# Volkern MCP Server (v2.0.0)

Servidor MCP (Model Context Protocol) para integrar Volkern CRM con agentes de IA como Claude, GPT, y otros clientes compatibles con MCP.

## Novedades v2.0.0 - Ciclo Comercial Completo

### Nuevos Módulos
- **Contactos**: CRUD completo de contactos (personas y empresas)
- **Deals/Pipeline**: Crear y listar deals del pipeline de ventas
- **Cotizaciones**: Crear cotizaciones desde ítems del catálogo con precios, descuentos e impuestos
- **Órdenes de Venta**: Listar, consultar y convertir cotizaciones en órdenes de venta
- **Contratos**: Convertir cotizaciones aceptadas en contratos con condiciones de pago

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
git clone https://github.com/volkern/mcp-server.git
cd mcp-server
npm install
npm run build
```

## Configuración

El servidor requiere las siguientes variables de entorno:

```bash
export VOLKERN_API_KEY="tu_api_key_aqui"
export VOLKERN_API_URL="https://volkern.app/api"  # Opcional, usa este valor por defecto
```

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

## Herramientas Disponibles (35 tools)

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

## Licencia

MIT
