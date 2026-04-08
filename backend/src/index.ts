import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const VOLKERN_API_URL = process.env.VOLKERN_API_URL || 'https://volkern.app/api';
const VOLKERN_API_KEY = process.env.VOLKERN_API_KEY || '';

if (!VOLKERN_API_KEY) {
  console.warn('⚠️  VOLKERN_API_KEY no configurada. Las funciones de CRM no estarán disponibles.');
}

// Crear directorio de uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG y PNG.'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Función para extraer texto de PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('No se pudo procesar el archivo PDF');
  }
}

// Función para extraer texto de imagen con OCR
async function extractTextFromImage(filePath: string): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'spa');
    return text;
  } catch (error) {
    console.error('Error doing OCR:', error);
    throw new Error('No se pudo procesar la imagen');
  }
}

// Función para parsear datos de la factura
function parseInvoiceData(text: string) {
  const extractedData: any = {};

  // Patrones regex comunes en facturas españolas
  const patterns = {
    nombre: [/(?:Nombre|Titular)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/i],
    email: [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/],
    telefono: [/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/g],
    empresa: [/(?:Empresa|Compañía|Razón Social)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s\.\,]+)/i],
    cif: [/([A-Z][0-9]{8}|[0-9]{8}[A-Z]|[A-Z][0-9]{7}[A-Z])/],
    direccion: [/(?:Dirección|Domicilio|Calle)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s\.\,\-]+)/i],
    consumo: [/(?:Consumo|kWh)[:\s]*([0-9\.]+)\s*(?:kWh)?/i],
    potencia: [/(?:Potencia)[:\s]*([0-9\.]+)\s*(?:kW)?/i],
    importe: [/(?:Total|Importe|Gasto)[:\s]*([0-9\.]+[,\.]?[0-9]*)\s*€/i],
    fecha: [/(\d{1,2}\/\d{1,2}\/\d{2,4})/]
  };

  // Extraer cada campo
  for (const [field, regexList] of Object.entries(patterns)) {
    for (const regex of regexList as RegExp[]) {
      const match = text.match(regex);
      if (match) {
        extractedData[field] = match[1]?.trim() || match[0]?.trim();
        break;
      }
    }
  }

  // Mapear a nuestro formato
  return {
    nombre: extractedData.nombre || '',
    email: extractedData.email || '',
    telefono: Array.isArray(extractedData.telefono) ? extractedData.telefono[0] : extractedData.telefono || '',
    empresa: extractedData.empresa || '',
    cif: extractedData.cif || '',
    direccion: extractedData.direccion || '',
    consumoMensual: extractedData.consumo || '',
    potenciaContratada: extractedData.potencia || '',
    gastoAnual: extractedData.importe || ''
  };
}

// Función para crear lead en Volkern CRM
async function createLeadInVolkern(leadData: any, contextoProyecto: string) {
  if (!VOLKERN_API_KEY) {
    console.log('Lead creado (modo simulación):', leadData);
    return { id: 'demo-lead-' + Date.now(), ...leadData };
  }

  try {
    const response = await axios.post(
      `${VOLKERN_API_URL}/leads`,
      {
        nombre: leadData.nombre,
        email: leadData.email,
        telefono: leadData.telefono,
        empresa: leadData.empresa,
        canal: 'web',
        estado: 'nuevo',
        etiquetas: ['factura-subida', 'propuesta-pendiente'],
        notas: `Datos extraídos de factura:\n${contextoProyecto}`,
        contextoProyecto
      },
      {
        headers: {
          'Authorization': `Bearer ${VOLKERN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating lead in Volkern:', error.response?.data || error.message);
    throw new Error('Error al crear el lead en el CRM');
  }
}

// Función para crear tarea en Volkern CRM
async function createTaskInVolkern(leadId: string, taskData: any) {
  if (!VOLKERN_API_KEY) {
    console.log('Tarea creada (modo simulación):', { leadId, ...taskData });
    return { id: 'demo-task-' + Date.now(), leadId, ...taskData };
  }

  try {
    const response = await axios.post(
      `${VOLKERN_API_URL}/leads/${leadId}/tasks`,
      taskData,
      {
        headers: {
          'Authorization': `Bearer ${VOLKERN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating task in Volkern:', error.response?.data || error.message);
    throw new Error('Error al crear la tarea en el CRM');
  }
}

// Endpoint para extraer datos de factura
app.post('/api/extract-invoice', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    let extractedText = '';
    
    // Extraer texto según el tipo de archivo
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === '.pdf') {
      extractedText = await extractTextFromPDF(req.file.path);
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      extractedText = await extractTextFromImage(req.file.path);
    } else {
      return res.status(400).json({ message: 'Tipo de archivo no soportado' });
    }

    // Parsear los datos extraídos
    const parsedData = parseInvoiceData(extractedText);

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error extracting invoice data:', error);
    res.status(500).json({ message: error.message || 'Error al procesar la factura' });
  }
});

// Endpoint para enviar lead y crear tareas
app.post('/api/submit-lead', async (req, res) => {
  try {
    const { 
      nombre, email, telefono, empresa, cif, direccion,
      consumoMensual, potenciaContratada, gastoAnual, mensaje 
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !empresa) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Crear contexto del proyecto con los datos organizados
    const contextoProyecto = `
📋 DATOS DEL CLIENTE
====================
Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono}
Empresa: ${empresa}
CIF/NIF: ${cif}
Dirección: ${direccion}

⚡ DATOS DE CONSUMO
==================
Consumo Mensual: ${consumoMensual || 'No especificado'} kWh
Potencia Contratada: ${potenciaContratada || 'No especificado'} kW
Gasto Anual Estimado: ${gastoAnual || 'No especificado'} €

💬 MENSAJE ADICIONAL
===================
${mensaje || 'Sin mensaje adicional'}

📎 ARCHIVO ADJUNTO
==================
Factura subida por el cliente para análisis detallado.
    `.trim();

    // Crear lead en Volkern CRM
    const lead = await createLeadInVolkern({
      nombre,
      email,
      telefono,
      empresa,
      cif,
      direccion,
      consumoMensual,
      potenciaContratada,
      gastoAnual
    }, contextoProyecto);

    console.log('✅ Lead creado:', lead.id);

    // Calcular fecha de vencimiento (24 horas desde ahora)
    const now = new Date();
    const dueDate24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueDateISO = dueDate24h.toISOString();

    // Crear tarea 1: Enviar propuesta en 24 horas
    const task1 = await createTaskInVolkern(lead.id, {
      tipo: 'email',
      titulo: 'Enviar propuesta económica al cliente',
      descripcion: `Enviar propuesta personalizada de ahorro energético a ${nombre} (${empresa}).\n\nContexto:\n${contextoProyecto}`,
      fechaVencimiento: dueDateISO,
      asignadoA: '' // Se puede asignar a un usuario específico
    });

    console.log('✅ Tarea 1 creada (enviar propuesta):', task1.id);

    // Crear tarea 2: Notificar al equipo de desarrollo de propuestas
    const task2 = await createTaskInVolkern(lead.id, {
      tipo: 'recordatorio',
      titulo: 'Análisis y elaboración de propuesta - Nuevo lead',
      descripcion: `El equipo de desarrollo de propuestas debe analizar la factura y elaborar una propuesta personalizada para:\n\nCliente: ${nombre}\nEmpresa: ${empresa}\nEmail: ${email}\nTeléfono: ${telefono}\n\n${contextoProyecto}`,
      fechaVencimiento: dueDateISO,
      asignadoA: '' // Se puede asignar al equipo de propuestas
    });

    console.log('✅ Tarea 2 creada (notificar equipo):', task2.id);

    res.json({
      success: true,
      message: 'Lead y tareas creados exitosamente',
      leadId: lead.id,
      tasks: [task1.id, task2.id]
    });
  } catch (error: any) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ 
      message: error.message || 'Error al enviar la solicitud',
      details: error.response?.data 
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📁 Directorio de uploads: ${uploadDir}`);
  console.log(`🔌 API URL: ${VOLKERN_API_URL}`);
  if (VOLKERN_API_KEY) {
    console.log('✅ API Key de Volkern configurada');
  } else {
    console.log('⚠️  Modo demostración (sin API Key)');
  }
});
