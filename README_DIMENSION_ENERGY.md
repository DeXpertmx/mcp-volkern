# Dimension Energy - Landing Page con Integración CRM

Réplica de la página https://dimensionenergy.space.z.ai/ con funcionalidad completa de captación de leads, extracción automática de datos de facturas eléctricas e integración con Volkern CRM.

## 🚀 Características Principales

### Frontend (React + TypeScript + Vite)
- **Diseño moderno y responsive** inspirado en Dimension Energy
- **Subida de facturas** (PDF, JPG, PNG)
- **Extracción automática de datos** mediante OCR y parsing
- **Formulario de revisión** para verificar y corregir datos extraídos
- **Flujo en 3 pasos**: Subir → Revisar → Confirmar

### Backend (Node.js + Express + TypeScript)
- **API REST** para procesamiento de facturas
- **OCR con Tesseract.js** para imágenes
- **Parser de PDF** con pdf-parse
- **Integración con Volkern CRM** para creación de leads
- **Gestión automática de tareas**

### Integración con Volkern CRM
Al enviar el formulario se crea automáticamente:

1. **Lead en el CRM** con:
   - Datos completos del cliente
   - Información de consumo energético
   - Contexto del proyecto organizado
   - Etiquetas para seguimiento

2. **Tarea 1**: "Enviar propuesta económica al cliente"
   - Programada para 24 horas
   - Tipo: email
   - Incluye todo el contexto del cliente

3. **Tarea 2**: "Análisis y elaboración de propuesta"
   - Para el equipo de desarrollo de propuestas
   - Tipo: recordatorio
   - Incluye datos para análisis detallado

## 📁 Estructura del Proyecto

```
/workspace
├── web-app/                 # Frontend React
│   ├── src/
│   │   ├── App.tsx         # Componente principal
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Estilos globales
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                 # Backend Node.js
│   ├── src/
│   │   └── index.ts        # Servidor Express + lógica CRM
│   ├── uploads/            # Directorio temporal para archivos
│   ├── dist/               # Build output
│   ├── package.json
│   └── tsconfig.json
│
└── README.md               # Este archivo
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js >= 18.0.0
- npm o yarn
- API Key de Volkern CRM (opcional para modo demo)

### 1. Instalar dependencias del Backend

```bash
cd /workspace/backend
npm install
```

### 2. Configurar variables de entorno (Backend)

Crear archivo `.env` o exportar las variables:

```bash
export VOLKERN_API_KEY="tu_api_key_de_volkern"
export VOLKERN_API_URL="https://volkern.app/api"
export PORT=3001
```

**Nota**: Si no se configura la API Key, el sistema funcionará en modo demostración (logs en consola).

### 3. Construir y ejecutar el Backend

```bash
cd /workspace/backend
npm run build    # Compilar TypeScript
npm start        # Ejecutar servidor
```

El backend se ejecutará en `http://localhost:3001`

### 4. Instalar dependencias del Frontend

```bash
cd /workspace/web-app
npm install
```

### 5. Ejecutar el Frontend

```bash
cd /workspace/web-app
npm run dev
```

El frontend se ejecutará en `http://localhost:3000`

## 📋 Endpoints de la API

### POST /api/extract-invoice
Extrae datos de una factura subida.

**Headers**: `Content-Type: multipart/form-data`

**Body**: 
- `file`: Archivo (PDF, JPG, PNG)

**Response**:
```json
{
  "nombre": "Juan García López",
  "email": "juan@empresa.com",
  "telefono": "+34612345678",
  "empresa": "Empresa SL",
  "cif": "B12345678",
  "direccion": "Calle Mayor 123, Madrid",
  "consumoMensual": "450.5",
  "potenciaContratada": "15.5",
  "gastoAnual": "5400.00"
}
```

### POST /api/submit-lead
Crea lead en Volkern CRM y genera las tareas automáticas.

**Headers**: `Content-Type: application/json`

**Body**:
```json
{
  "nombre": "Juan García López",
  "email": "juan@empresa.com",
  "telefono": "+34612345678",
  "empresa": "Empresa SL",
  "cif": "B12345678",
  "direccion": "Calle Mayor 123, Madrid",
  "consumoMensual": "450.5",
  "potenciaContratada": "15.5",
  "gastoAnual": "5400.00",
  "mensaje": "Interesado en reducir costes energéticos"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Lead y tareas creados exitosamente",
  "leadId": "lead_abc123",
  "tasks": ["task_xyz789", "task_def456"]
}
```

### GET /api/health
Health check del servidor.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔄 Flujo de Usuario

1. **Paso 1 - Subir Factura**
   - El usuario accede a la landing page
   - Sube su factura de luz (PDF o imagen)
   - Hace clic en "Extraer datos de la factura"

2. **Paso 2 - Revisar Datos**
   - El sistema muestra los datos extraídos automáticamente
   - El usuario verifica que sean correctos
   - Puede editar cualquier campo si es necesario
   - Añade mensaje adicional opcional

3. **Paso 3 - Confirmar Envío**
   - El usuario hace clic en "Enviar solicitud"
   - Se crea el lead en Volkern CRM
   - Se generan 2 tareas automáticas:
     - Tarea para enviar propuesta en 24h
     - Tarea para análisis del equipo de propuestas
   - Se muestra mensaje de éxito

## 📊 Datos Extraídos de la Factura

El sistema intenta extraer automáticamente:

- ✅ Nombre del titular
- ✅ Email de contacto
- ✅ Teléfono
- ✅ Nombre de la empresa
- ✅ CIF/NIF
- ✅ Dirección
- ✅ Consumo mensual (kWh)
- ✅ Potencia contratada (kW)
- ✅ Gasto anual estimado (€)

**Nota**: La precisión de la extracción depende de la calidad y formato de la factura.

## 🎨 Diseño

El diseño replica la estética de Dimension Energy:
- Gradiente púrpura/azul como fondo
- Tipografía Inter moderna
- Cards blancas con sombras suaves
- Formulario limpio y profesional
- Iconos SVG integrados
- Totalmente responsive

## 🔐 Consideraciones de Seguridad

- Los archivos se eliminan automáticamente después del procesamiento
- Límite de 10MB por archivo
- Validación de tipos de archivo (solo PDF, JPG, PNG)
- CORS configurado para permitir solo origen local (configurable)

## 🧪 Modo Demostración

Si no se configura `VOLKERN_API_KEY`, el sistema funciona en modo demo:
- Los leads se registran en consola
- Las tareas se simulan
- Ideal para pruebas y desarrollo

## 📦 Build para Producción

### Backend
```bash
cd /workspace/backend
npm run build
npm start
```

### Frontend
```bash
cd /workspace/web-app
npm run build
# Los archivos estáticos estarán en /web-app/dist
```

Para servir el frontend en producción, configurar un servidor web (nginx, Apache, etc.) para servir los archivos estáticos de `/web-app/dist` y hacer proxy de `/api/*` al backend.

## 🤝 Integración con Volkern CRM

La integración utiliza la API de Volkern para:
- Crear leads con `POST /leads`
- Crear tareas con `POST /leads/{id}/tasks`

Requiere:
- API Key válida de Volkern
- Permisos para crear leads y tareas

Documentación de la API disponible en el MCP Server de Volkern incluido en este repositorio.

## 📞 Soporte

Para issues o preguntas:
1. Revisar logs del backend para errores
2. Verificar configuración de API Key
3. Comprobar conectividad con Volkern API

## 📄 Licencia

MIT License

---

**Desarrollado para Dimension Energy** - Expertos en ahorro energético para empresas ⚡
