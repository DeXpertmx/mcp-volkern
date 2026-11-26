# Volkern MCP Server (v2.0.1 — SDK v2, spec MCP 2026-07-28)

Servidor MCP (Model Context Protocol) para integrar Volkern CRM con agentes de IA como Claude, GPT, y otros clientes compatibles con MCP.

## Novedades v2.0.0 - Ciclo Comercial Completo

- **SDK v2**: migrado a `@modelcontextprotocol/server` v2 (spec MCP 2026-07-28). Núcleo stateless y transporte Streamable HTTP en `/mcp`; el transporte SSE de la spec 2025 fue retirado.

### Nuevos Módulos
- **Contactos**: CRUD completo de contactos (personas y empresas)
- **Deals/Pipeline**: Crear y listar deals del pipeline de ventas
- **Cotizaciones**: Crear cotizaciones desde ítems del catálogo con precios, descuentos e impuestos
- **Órdenes de Venta**: Listar, consultar y convertir cotizaciones en órdenes de venta
- **Contratos**: Convertir cotizaciones aceptadas en contratos con condiciones de pago
- **Transporte Streamable HTTP**: Conexión remota vía HTTP para clientes MCP (VS Code, Cline, n8n) en el endpoint `/mcp`

### Flujo Comercial Completo vía MCP
1. `volkern_create_lead` → Capturar lead
2. `volkern_create_deal` → Abrir oportunidad en pipeline
3. `volkern_create_cotizacion` → Generar cotización desde catálogo
4. `volkern_create_orden_from_cotizacion` → Convertir en orden de venta
5. `volkern_create_contrato_from_cotizacion` → Formalizar contrato

### Catálogo Mejorado (v1.1.0)
- **Campos personalizados**: Atributos dinámicos por ítem (metros², habitaciones, idioma, etc.)
- **Categorías multinivel**: Organización jerárquica (Inmuebles > Oficina > Lujo)
- **Etiquetas**: Tags para filtrado rápido (vip, oportunidad, nuevo)
- **Galería multimedia**: Imágenes, video tours, documentos técnicos, tours 360°
- **Precios flexibles**: Pago único, recurrente o por hora con descuentos por volumen

## Instalación

### Opción 1: Instalación global desde NPM (Recomendado)

```bash
npm install -g volkern-mcp-server
```

### Opción 2: Usando npx (sin instalación)

```bash
npx volkern-mcp-server
```

### Opción 3: Desde código fuente

```bash
git clone https://github.com/DeXpertmx/mcp-volkern.git
cd mcp-volkern
npm install
npm run build
```

## Configuración

El servidor requiere las siguientes variables de entorno:

```bash
export VOLKERN_API_KEY="tu_api_key_aqui"
export VOLKERN_API_URL="https://volkern.app/api"  # Opcional, usa este valor por defecto
```

### Cómo se ejecutan las herramientas

El servidor **no ejecuta nada por su cuenta**: reenvía cada `tools/call` al
endpoint MCP de Volkern (`/mcp`) con tu API key. Así hereda la misma identidad
derivada de la credencial, la decisión de permisos por herramienta y rol, la
aprobación de acciones sensibles y la auditoría que el resto de superficies.

Consecuencias prácticas:

- **`Requiere aprobación`** significa que no se ha ejecutado nada: un
  responsable debe aprobarlo en Volkern. Reintentar devuelve la misma
  solicitud pendiente, no la ejecuta.
- **`Denegado`** es una decisión de política (herramienta destructiva con un
  rol sin permiso, por ejemplo), no un fallo de red.
- `VOLKERN_MCP_URL` permite apuntar a otro endpoint MCP; por defecto se deriva
  de `VOLKERN_API_URL` quitando el sufijo `/api` y añadiendo `/mcp`.

## Uso con Claude Desktop

Agrega la siguiente configuración a tu archivo `claude_desktop_config.json`:

### Si instalaste con NPM (Recomendado)

```json
{
  "mcpServers": {
    "volkern": {
      "command": "volkern-mcp",
      "env": {
        "VOLKERN_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### Si usas npx

```json
{
  "mcpServers": {
    "volkern": {
      "command": "npx",
      "args": ["volkern-mcp-server"],
      "env": {
        "VOLKERN_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### Si instalaste desde código fuente

**macOS/Linux:**
```json
{
  "mcpServers": {
    "volkern": {
      "command": "node",
      "args": ["/ruta/a/volkern-mcp-server/dist/index.js"],
      "env": {
        "VOLKERN_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "volkern": {
      "command": "node",
      "args": ["C:\\ruta\\a\\volkern-mcp-server\\dist\\index.js"],
      "env": {
        "VOLKERN_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

## Transporte HTTP (Streamable HTTP)

El servidor MCP soporta dos modos de transporte, seleccionables mediante la variable de entorno `TRANSPORT`:

| Transporte | Modo | Uso típico |
|------------|------|------------|
| `stdio` (default) | Comunicación por stdin/stdout | Claude Desktop, Cursor, Windsurf |
| `http` | Streamable HTTP stateless en `/mcp` | Clientes remotos, VS Code, Cline, n8n |

> **Nota**: el transporte SSE de la spec MCP 2025 fue retirado en la spec 2026-07-28. `TRANSPORT=sse` sigue aceptándose como alias de `http` por compatibilidad.

### Iniciar en modo HTTP

**Opción 1 — Instalación global NPM:**
```bash
export VOLKERN_API_KEY="tu_api_key_aqui"
TRANSPORT=http PORT=3001 volkern-mcp
```

**Opción 2 — Con npx (sin instalar):**
```bash
export VOLKERN_API_KEY="tu_api_key_aqui"
TRANSPORT=http PORT=3001 npx volkern-mcp-server
```

**Opción 3 — Desde código fuente:**
```bash
export VOLKERN_API_KEY="tu_api_key_aqui"
npm run start:http

# O directamente
export VOLKERN_API_KEY="tu_api_key_aqui"
TRANSPORT=http PORT=3001 node dist/index.js

# En desarrollo
export VOLKERN_API_KEY="tu_api_key_aqui"
TRANSPORT=http PORT=3001 npm run dev:http
```

### Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `POST /mcp` | POST | Endpoint MCP Streamable HTTP (JSON-RPC: initialize, tools/list, tools/call) |
| `GET /health` | GET | Health check del servidor (retorna JSON) |
| `OPTIONS *` | OPTIONS | CORS preflight para todos los endpoints |

### Health Check

```bash
curl http://localhost:3001/health
# ➜ {"status":"ok","server":"volkern-mcp-server","version":"2.0.0","transport":"http"}
```

### Conectar desde VS Code (Cline)

En la configuración de Cline, especifica el modo Streamable HTTP:

```json
{
  "mcpServers": {
    "volkern": {
      "type": "streamableHttp",
      "url": "http://localhost:3001/mcp",
      "headers": { "Authorization": "Bearer tu_api_key" }
    }
  }
}
```

### Conectar desde n8n o flujos automatizados

Usa el nodo HTTP Request de n8n contra `POST http://localhost:3001/mcp` con headers:
- `Content-Type: application/json`
- `Authorization: Bearer tu_api_key`

### Probar con curl

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

> **Nota**: el servidor es stateless (spec 2026-07-28): no requiere conexión de sesión previa; cada petición es independiente.

## Herramientas Disponibles (43 tools)

Los nombres, descripciones e inputSchemas viven en `src/tools-catalog.ts`, la única fuente de verdad compartida con el endpoint web `/mcp` de nextjs_space (`app/mcp/route.ts`), que publica exactamente este catálogo en `tools/list`.

### Contactos
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_contacts` | Listar contactos con filtros |
| `volkern_get_contact` | Obtener contacto por ID |
| `volkern_create_contact` | Crear un nuevo contacto |
| `volkern_update_contact` | Actualizar un contacto |
| `volkern_delete_contact` | Eliminar un contacto |

### Gestión de Leads
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_leads` | Listar leads con filtros opcionales |
| `volkern_get_lead` | Obtener detalles de un lead por ID |
| `volkern_create_lead` | Crear un nuevo lead |
| `volkern_update_lead` | Actualizar un lead existente |

### Citas/Appointments
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_check_disponibilidad` | Consultar horarios disponibles |
| `volkern_list_citas` | Listar citas con filtros |
| `volkern_create_cita` | Crear una nueva cita |
| `volkern_update_cita` | Actualizar una cita |
| `volkern_cita_accion` | Confirmar, cancelar o reprogramar |

### Servicios
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_servicios` | Listar servicios del catálogo |
| `volkern_get_servicio` | Obtener detalles de un servicio |

### Tareas
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_create_task` | Crear tarea de seguimiento |
| `volkern_list_tasks` | Listar tareas de un lead |
| `volkern_complete_task` | Marcar tarea como completada |

### Mensajería
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_send_whatsapp` | Enviar mensaje de WhatsApp |
| `volkern_list_conversaciones` | Listar conversaciones |

### Interacciones
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_interactions` | Listar interacciones de un lead |
| `volkern_create_interaction` | Registrar llamada, email, reunión |

### Notas
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_notes` | Listar notas de un lead |
| `volkern_create_note` | Agregar nota a un lead |

### Deals / Pipeline
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_deals` | Listar deals del pipeline con filtros |
| `volkern_create_deal` | Crear un nuevo deal |

### Cotizaciones
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_create_cotizacion` | Crear cotización desde ítems del catálogo |

### Órdenes de Venta
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_list_ordenes_venta` | Listar órdenes de venta con filtros |
| `volkern_get_orden_venta` | Obtener detalle de una orden |
| `volkern_create_orden_from_cotizacion` | Convertir cotización en orden de venta |

### Contratos
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_create_contrato_from_cotizacion` | Convertir cotización en contrato |

### Inventario MRP / Producción
| Herramienta | Descripción |
|-------------|-------------|
| `volkern_process_inventory_consumption` | Registrar consumo de inventario de una orden |
| `volkern_get_inventory_health` | Salud del inventario y predicción de rupturas de stock |
| `volkern_report_production_scrap` | Reportar merma de producción |

## Ejemplos de Uso

### Crear un lead y agendar cita

```
Usuario: Crea un lead para Juan Pérez, email juan@example.com, y agenda una cita para mañana a las 10am

Agente:
1. volkern_create_lead(nombre: "Juan Pérez", email: "juan@example.com")
2. volkern_check_disponibilidad(fecha: "2026-02-09")
3. volkern_create_cita(leadId: "...", fechaHora: "2026-02-09T10:00:00Z", titulo: "Reunión inicial")
```

### Consultar disponibilidad

```
Usuario: ¿Qué horarios hay disponibles para el lunes?

Agente:
1. volkern_check_disponibilidad(fecha: "2026-02-10")
```

### Crear tarea de seguimiento

```
Usuario: Crea un recordatorio para llamar a Juan mañana

Agente:
1. volkern_list_leads(search: "Juan")
2. volkern_create_task(leadId: "...", tipo: "llamada", titulo: "Llamar a Juan", fechaVencimiento: "2026-02-09T09:00:00Z")
```

## Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Compilar
npm run build

# Ejecutar compilado
npm start
```

## Troubleshooting

### Error: VOLKERN_API_KEY not set
Asegúrate de configurar la variable de entorno antes de iniciar el servidor.

### Error 401: No autorizado
Verifica que tu API key tenga los permisos necesarios en Volkern (Configuración → API Keys).

### Error 409: Conflicto de horario
El slot solicitado ya está ocupado. Consulta disponibilidad con `volkern_check_disponibilidad`.

## Publicación

El paquete se publica desde esta carpeta:

```bash
npm login        # cuenta propietaria de volkern-mcp-server
npm publish      # prepublishOnly compila y publica la versión de package.json
```

Antes de publicar, confirmar cuál es la última versión en npm (`npm view volkern-mcp-server version`) y no reutilizar un número ya publicado. Si hace falta subirla: `npm version patch|minor|major` (no reescribir a mano el lockfile).

Para el registro MCP, desde esta misma carpeta: `npx mcp-publisher publish` (requiere sesión de GitHub del propietario de `io.github.DeXpertmx/mcp-volkern`; toma nombre y versión de `server.json`).

## Licencia

MIT
