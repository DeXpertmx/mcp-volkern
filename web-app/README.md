# Dimension Energy - Web App

Aplicación web para captación de leads con extracción automática de datos de facturas eléctricas.

## Características

- 📄 **Subida de facturas**: Soporta PDF, JPG y PNG
- 🔍 **Extracción automática**: OCR y parsing de datos de facturas
- ✅ **Revisión de datos**: El usuario puede verificar y corregir los datos extraídos
- 🎯 **Integración CRM**: Crea leads automáticamente en Volkern CRM
- 📋 **Gestión de tareas**: 
  - Tarea para enviar propuesta en 24 horas
  - Tarea para notificar al equipo de desarrollo de propuestas

## Instalación

### Backend

```bash
cd backend
npm install
```

Configurar variables de entorno (opcional):
```bash
export VOLKERN_API_KEY="tu_api_key"
export VOLKERN_API_URL="https://volkern.app/api"
```

Ejecutar en modo desarrollo:
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3001`

### Frontend

```bash
cd web-app
npm install
npm run dev
```

La aplicación se ejecutará en `http://localhost:3000`

## Flujo de Uso

1. **Subir factura**: El usuario sube su factura de luz (PDF o imagen)
2. **Extracción automática**: El sistema extrae los datos usando OCR/parsing
3. **Revisión**: El usuario verifica y corrige los datos si es necesario
4. **Envío**: Se crea el lead en Volkern CRM con:
   - Todos los datos del cliente organizados
   - Contexto completo del proyecto
   - Etiquetas para seguimiento
5. **Tareas automáticas**:
   - Tarea para enviar propuesta en 24h
   - Tarea para que el equipo de propuestas analice el caso

## Estructura de Datos

### Lead creado en Volkern CRM
```json
{
  "nombre": "Juan García",
  "email": "juan@empresa.com",
  "telefono": "+34612345678",
  "empresa": "Empresa SL",
  "canal": "web",
  "estado": "nuevo",
  "etiquetas": ["factura-subida", "propuesta-pendiente"],
  "contextoProyecto": "...datos organizados..."
}
```

### Tareas creadas
1. **Enviar propuesta económica** (24h)
2. **Análisis y elaboración de propuesta** (equipo de desarrollo)

## APIs del Backend

### POST /api/extract-invoice
Extrae datos de una factura subida.

**Request**: multipart/form-data con campo `file`
**Response**: 
```json
{
  "nombre": "...",
  "email": "...",
  "telefono": "...",
  "empresa": "...",
  "cif": "...",
  "direccion": "...",
  "consumoMensual": "...",
  "potenciaContratada": "...",
  "gastoAnual": "..."
}
```

### POST /api/submit-lead
Crea un lead en Volkern CRM y las tareas asociadas.

**Request**: JSON con todos los datos del formulario
**Response**:
```json
{
  "success": true,
  "message": "Lead y tareas creados exitosamente",
  "leadId": "...",
  "tasks": ["...", "..."]
}
```

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **OCR**: Tesseract.js
- **PDF**: pdf-parse
- **CRM**: Volkern API
