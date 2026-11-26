/**
 * Catálogo de tools del MCP server de Volkern (JSON Schema, formato MCP).
 *
 * Única fuente de verdad compartida:
 *   - servidor standalone → src/index.ts (registerTool vía SDK v2)
 *   - endpoint web /mcp     → nextjs_space/app/mcp/route.ts (tools/list)
 */

/** Definición de tool en JSON Schema (formato MCP). */
export interface VolkernTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export const VOLKERN_TOOLS: VolkernTool[] = [
  // === CONTACTS ===
  {
    name: "volkern_list_contacts",
    description: "List contacts with optional filters. Returns paginated results. Contacts are converted leads or manually created business contacts.",
    inputSchema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: ["person", "company"],
          description: "Filter by contact type"
        },
        search: {
          type: "string",
          description: "Search by name, email, phone, or company"
        },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 50, max: 100)" }
      }
    }
  },
  {
    name: "volkern_get_contact",
    description: "Get detailed information about a specific contact by ID, including company, deals, and interactions",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "The contact's unique ID" }
      },
      required: ["contactId"]
    }
  },
  {
    name: "volkern_create_contact",
    description: "Create a new contact in the CRM",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Contact's full name (required)" },
        email: { type: "string", description: "Email address (required)" },
        telefono: { type: "string", description: "Phone number" },
        tipo: { type: "string", enum: ["person", "company"], description: "Contact type (default: person)" },
        companyId: { type: "string", description: "ID of parent company contact" },
        cargo: { type: "string", description: "Job title" },
        ubicacion: { type: "string", description: "Location" },
        linkedin: { type: "string", description: "LinkedIn profile URL" },
        notas: { type: "string", description: "Notes" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" }
      },
      required: ["nombre", "email"]
    }
  },
  {
    name: "volkern_update_contact",
    description: "Update an existing contact's information",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "The contact's unique ID" },
        nombre: { type: "string" },
        email: { type: "string" },
        telefono: { type: "string" },
        tipo: { type: "string", enum: ["person", "company"] },
        cargo: { type: "string" },
        ubicacion: { type: "string" },
        linkedin: { type: "string" },
        notas: { type: "string" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["contactId"]
    }
  },
  {
    name: "volkern_delete_contact",
    description: "Delete a contact by ID",
    inputSchema: {
      type: "object",
      properties: {
        contactId: { type: "string", description: "The contact's unique ID" }
      },
      required: ["contactId"]
    }
  },

  // === LEADS ===
  {
    name: "volkern_list_leads",
    description: "List leads with optional filters. Returns paginated results.",
    inputSchema: {
      type: "object",
      properties: {
        estado: {
          type: "string",
          enum: ["nuevo", "contactado", "calificado", "negociacion", "cliente", "perdido"],
          description: "Filter by lead status"
        },
        canal: {
          type: "string",
          enum: ["web", "referido", "whatsapp", "telefono", "email", "otro"],
          description: "Filter by acquisition channel"
        },
        search: {
          type: "string",
          description: "Search by name, email, or phone"
        },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 50, max: 100)" }
      }
    }
  },
  {
    name: "volkern_get_lead",
    description: "Get detailed information about a specific lead by ID",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "The lead's unique ID" }
      },
      required: ["leadId"]
    }
  },
  {
    name: "volkern_create_lead",
    description: "Create a new lead in the CRM. If email already exists, updates the existing lead.",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Lead's full name (required)" },
        email: { type: "string", description: "Email address" },
        telefono: { type: "string", description: "Phone number with country code (e.g., +34612345678)" },
        empresa: { type: "string", description: "Company name" },
        canal: {
          type: "string",
          enum: ["web", "referido", "whatsapp", "telefono", "email", "otro"],
          description: "Acquisition channel"
        },
        estado: {
          type: "string",
          enum: ["nuevo", "contactado", "calificado", "negociacion", "cliente", "perdido"],
          description: "Initial status (default: nuevo)"
        },
        etiquetas: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization"
        },
        notas: { type: "string", description: "Initial notes" },
        contextoProyecto: { type: "string", description: "Project context or requirements" }
      },
      required: ["nombre"]
    }
  },
  {
    name: "volkern_update_lead",
    description: "Update an existing lead's information",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "The lead's unique ID" },
        nombre: { type: "string" },
        email: { type: "string" },
        telefono: { type: "string" },
        empresa: { type: "string" },
        canal: { type: "string" },
        estado: { type: "string" },
        etiquetas: {
          type: "array",
          items: { type: "string" },
          description: "Tags del lead. Se añaden a los que ya tiene; no los reemplaza"
        },
        notas: { type: "string" }
      },
      required: ["leadId"]
    }
  },

  // === APPOINTMENTS ===
  {
    name: "volkern_check_disponibilidad",
    description: "Check available time slots for a specific date. Always call this before booking.",
    inputSchema: {
      type: "object",
      properties: {
        fecha: { type: "string", description: "Date in YYYY-MM-DD format" },
        duracion: { type: "number", description: "Duration in minutes (default: 60)" }
      },
      required: ["fecha"]
    }
  },
  {
    name: "volkern_list_citas",
    description: "List appointments with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        estado: {
          type: "string",
          enum: ["Pendiente", "Confirmada", "Completada", "Cancelada", "Pagada"],
          description: "Filter by appointment status"
        },
        tipo: {
          type: "string",
          enum: ["reunion", "servicio", "llamada", "otro"],
          description: "Filter by appointment type"
        },
        fecha: { type: "string", description: "Filter by specific date (YYYY-MM-DD)" },
        fechaInicio: { type: "string", description: "Start of date range (ISO 8601)" },
        fechaFin: { type: "string", description: "End of date range (ISO 8601)" }
      }
    }
  },
  {
    name: "volkern_create_cita",
    description: "Create a new appointment. Check availability first with volkern_check_disponibilidad.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead for this appointment" },
        fechaHora: { type: "string", description: "Appointment date/time in ISO 8601 UTC (e.g., 2026-02-10T10:00:00Z)" },
        tipo: {
          type: "string",
          enum: ["reunion", "servicio", "llamada", "otro"],
          description: "Appointment type (default: reunion)"
        },
        titulo: { type: "string", description: "Appointment title" },
        descripcion: { type: "string", description: "Appointment description or notes" },
        duracion: { type: "number", description: "Duration in minutes (default: 60)" },
        servicioId: { type: "string", description: "Service ID (required if tipo is 'servicio')" }
      },
      required: ["leadId", "fechaHora"]
    }
  },
  {
    name: "volkern_update_cita",
    description: "Update an existing appointment",
    inputSchema: {
      type: "object",
      properties: {
        citaId: { type: "string", description: "The appointment's unique ID" },
        fechaHora: { type: "string", description: "New date/time in ISO 8601 UTC" },
        estado: { type: "string", enum: ["Pendiente", "Confirmada", "Completada", "Cancelada"] },
        descripcion: { type: "string" },
        duracion: { type: "number" }
      },
      required: ["citaId"]
    }
  },
  {
    name: "volkern_cita_accion",
    description: "Perform an action on an appointment (confirm, cancel, or reschedule)",
    inputSchema: {
      type: "object",
      properties: {
        citaId: { type: "string", description: "The appointment's unique ID" },
        accion: {
          type: "string",
          enum: ["confirmar", "cancelar", "reprogramar"],
          description: "Action to perform"
        },
        nuevaFecha: { type: "string", description: "New date/time for reschedule (ISO 8601)" },
        motivo: { type: "string", description: "Reason for cancellation" }
      },
      required: ["citaId", "accion"]
    }
  },

  // === CATALOG (ENHANCED) ===
  {
    name: "volkern_list_catalogo",
    description: "List catalog items (products, services, appointments, courses) with advanced filters",
    inputSchema: {
      type: "object",
      properties: {
        tipo: { 
          type: "string", 
          enum: ["producto", "servicio", "cita", "academia"],
          description: "Filter by item type" 
        },
        activo: { type: "boolean", description: "Filter only active items (default: true)" },
        categoria: { type: "string", description: "Filter by category name" },
        etiqueta: { type: "string", description: "Filter by tag" },
        search: { type: "string", description: "Search by name, description or SKU" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 50)" }
      }
    }
  },
  {
    name: "volkern_get_catalogo_item",
    description: "Get detailed information about a specific catalog item including custom fields, pricing, and media",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The catalog item's unique ID" }
      },
      required: ["itemId"]
    }
  },
  {
    name: "volkern_create_catalogo_item",
    description: "Create a new catalog item with full support for custom fields, categories, tags, media, and flexible pricing",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Item name (required)" },
        descripcion: { type: "string", description: "Detailed description" },
        sku: { type: "string", description: "Internal SKU/code" },
        tipo: { 
          type: "string", 
          enum: ["producto", "servicio", "cita", "academia"],
          description: "Item type (default: servicio)" 
        },
        precioBase: { type: "number", description: "Base price (required)" },
        moneda: { type: "string", description: "Currency code (EUR, USD, MXN, GBP)" },
        categoriaFiscal: { type: "string", enum: ["general", "reducido", "superreducido", "exento"] },
        tasaImpuestoId: { type: "string", description: "Tax rate ID" },
        duracionMinutos: { type: "number", description: "Duration in minutes (for services/appointments)" },
        modalidad: { type: "string", enum: ["presencial", "virtual", "hibrido"] },
        unidad: { type: "string", description: "Unit (unidad, hora, servicio, mes, sesion, paquete)" },
        activo: { type: "boolean", description: "Is active (default: true)" },
        destacado: { type: "boolean", description: "Is featured (default: false)" },
        customFields: {
          type: "array",
          description: "Custom fields array [{key, label, type, value, unit?, options?}]",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              label: { type: "string" },
              type: { type: "string", enum: ["text", "number", "select", "date", "boolean"] },
              value: { type: ["string", "number", "boolean"] },
              unit: { type: "string" },
              options: { type: "array", items: { type: "string" } }
            }
          }
        },
        categorias: { 
          type: "array", 
          items: { type: "string" },
          description: "Categories array (e.g., ['Inmuebles', 'Oficina', 'Lujo'])" 
        },
        etiquetas: { 
          type: "array", 
          items: { type: "string" },
          description: "Tags array (e.g., ['vip', 'oportunidad', 'nuevo'])" 
        },
        metadata: {
          type: "object",
          description: "Additional metadata (e.g., {industria: 'real-estate', prioridad: 3})"
        },
        media: {
          type: "object",
          description: "Media gallery {imagenes: [], video_tour, documento_tecnico, tour_360}",
          properties: {
            imagenes: { type: "array", items: { type: "string" } },
            video_tour: { type: "string" },
            documento_tecnico: { type: "string" },
            tour_360: { type: "string" }
          }
        },
        pricing: {
          type: "object",
          description: "Flexible pricing {tipo, descuentos[], impuestos}",
          properties: {
            tipo: { type: "string", enum: ["unico", "recurrente", "por_hora"] },
            descuentos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  min: { type: "number" },
                  descuento: { type: "number" }
                }
              }
            },
            impuestos: {
              type: "object",
              properties: {
                iva: { type: "number" },
                incluido: { type: "boolean" }
              }
            }
          }
        }
      },
      required: ["nombre", "precioBase"]
    }
  },
  {
    name: "volkern_update_catalogo_item",
    description: "Update an existing catalog item. Supports partial updates of any field including custom fields, categories, tags, media, and pricing",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "The catalog item's unique ID" },
        nombre: { type: "string" },
        descripcion: { type: "string" },
        sku: { type: "string" },
        tipo: { type: "string", enum: ["producto", "servicio", "cita", "academia"] },
        precioBase: { type: "number" },
        moneda: { type: "string" },
        categoriaFiscal: { type: "string" },
        tasaImpuestoId: { type: "string" },
        duracionMinutos: { type: "number" },
        modalidad: { type: "string" },
        unidad: { type: "string" },
        activo: { type: "boolean" },
        destacado: { type: "boolean" },
        customFields: { type: "array", description: "Replace custom fields" },
        categorias: { type: "array", items: { type: "string" }, description: "Replace categories" },
        etiquetas: { type: "array", items: { type: "string" }, description: "Replace tags" },
        metadata: { type: "object", description: "Replace metadata" },
        media: { type: "object", description: "Replace media gallery" },
        pricing: { type: "object", description: "Replace pricing configuration" }
      },
      required: ["itemId"]
    }
  },
  {
    name: "volkern_search_catalogo",
    description: "Search catalog items by text across name, description and SKU. Returns items matching the query with their categories and tags.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        tipo: { type: "string", enum: ["producto", "servicio", "cita", "academia"] },
        limit: { type: "number", description: "Max results (default: 20)" }
      },
      required: ["query"]
    }
  },

  // === SERVICES (LEGACY - uses catalog) ===
  {
    name: "volkern_list_servicios",
    description: "List available services from the catalog (legacy endpoint, use volkern_list_catalogo with tipo='servicio' instead)",
    inputSchema: {
      type: "object",
      properties: {
        activo: { type: "boolean", description: "Filter only active services (default: true)" }
      }
    }
  },
  {
    name: "volkern_get_servicio",
    description: "Get detailed information about a specific service (legacy endpoint)",
    inputSchema: {
      type: "object",
      properties: {
        servicioId: { type: "string", description: "The service's unique ID" }
      },
      required: ["servicioId"]
    }
  },

  // === TASKS ===
  {
    name: "volkern_create_task",
    description: "Create a follow-up task for a lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" },
        tipo: {
          type: "string",
          enum: ["llamada", "email", "reunion", "recordatorio"],
          description: "Task type"
        },
        titulo: { type: "string", description: "Task title" },
        descripcion: { type: "string", description: "Task description/context" },
        fechaVencimiento: { type: "string", description: "Due date in ISO 8601 UTC" },
        asignadoA: { type: "string", description: "User ID to assign the task to (default: the authenticated user)" }
      },
      required: ["leadId", "tipo", "titulo", "fechaVencimiento"]
    }
  },
  {
    name: "volkern_list_tasks",
    description: "List tasks for a specific lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" }
      },
      required: ["leadId"]
    }
  },
  {
    name: "volkern_complete_task",
    description: "Mark a task as completed",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "The task's unique ID" }
      },
      required: ["taskId"]
    }
  },

  // === MESSAGING ===
  {
    name: "volkern_send_whatsapp",
    description: "Send a WhatsApp message to a lead. Requires active WhatsApp integration.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead to message" },
        mensaje: { type: "string", description: "Message content" },
        tipo: {
          type: "string",
          enum: ["texto", "imagen", "documento"],
          description: "Message type (default: texto)"
        }
      },
      required: ["leadId", "mensaje"]
    }
  },
  {
    name: "volkern_list_conversaciones",
    description: "List WhatsApp conversations, optionally filtered by lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "Filter by lead ID" },
        page: { type: "number" },
        limit: { type: "number" }
      }
    }
  },

  // === INTERACTIONS ===
  {
    name: "volkern_list_interactions",
    description: "List all interactions for a specific lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" }
      },
      required: ["leadId"]
    }
  },
  {
    name: "volkern_create_interaction",
    description: "Log an interaction (call, email, meeting) with a lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" },
        tipo: {
          type: "string",
          enum: ["llamada", "email", "whatsapp", "reunion", "nota", "otro"],
          description: "Interaction type"
        },
        contenido: { type: "string", description: "Interaction summary/content" },
        resultado: {
          type: "string",
          enum: ["positivo", "neutro", "negativo"],
          description: "Outcome of the interaction"
        },
        metadatos: {
          type: "object",
          description: "Additional metadata (e.g., call duration, meeting attendees)"
        }
      },
      required: ["leadId", "tipo", "contenido"]
    }
  },

  // === NOTES ===
  {
    name: "volkern_list_notes",
    description: "List all notes for a specific lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" }
      },
      required: ["leadId"]
    }
  },
  {
    name: "volkern_create_note",
    description: "Create a note for a lead",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID of the lead" },
        contenido: { type: "string", description: "Note content" },
        titulo: { type: "string", description: "Optional note title (se antepone al contenido)" }
      },
      required: ["leadId", "contenido"]
    }
  },

  // === DEALS / PIPELINE ===
  {
    name: "volkern_list_deals",
    description: "List sales pipeline deals with optional filters. Returns paginated results.",
    inputSchema: {
      type: "object",
      properties: {
        etapa: { type: "string", description: "Filter by pipeline stage (e.g., calificacion, propuesta, negociacion, ganado, perdido)" },
        prioridad: { type: "string", enum: ["baja", "media", "alta", "urgente"], description: "Filter by priority" },
        leadId: { type: "string", description: "Filter by lead ID" },
        contactId: { type: "string", description: "Filter by contact ID" },
        search: { type: "string", description: "Search by deal title" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 50)" }
      }
    }
  },
  {
    name: "volkern_create_deal",
    description: "Create a new deal in the sales pipeline",
    inputSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Deal title (required)" },
        valor: { type: "number", description: "Deal value/amount (required)" },
        moneda: { type: "string", description: "Currency code: EUR, USD, MXN, GBP (default: EUR)" },
        leadId: { type: "string", description: "ID of the associated lead" },
        contactId: { type: "string", description: "ID of the associated contact" },
        descripcion: { type: "string", description: "Deal description" },
        etapa: { type: "string", description: "Pipeline stage (default: calificacion)" },
        probabilidad: { type: "number", description: "Win probability 0-100 (default: 25)" },
        prioridad: { type: "string", enum: ["baja", "media", "alta", "urgente"], description: "Priority (default: media)" },
        fechaEstimadaCierre: { type: "string", description: "Estimated close date (ISO 8601)" },
        origen: { type: "string", description: "Deal origin/source" },
        tags: { type: "array", items: { type: "string" }, description: "Tags" },
        usuarioAsignadoId: { type: "string", description: "Assigned user ID" }
      },
      required: ["titulo", "valor"]
    }
  },

  // === COTIZACIONES (QUOTES) ===
  {
    name: "volkern_create_cotizacion",
    description: "Create a quote/proposal from catalog items. Items inherit pricing, taxes, and descriptions from the catalog. Supports volume discounts.",
    inputSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Quote title (required)" },
        catalogItems: {
          type: "array",
          description: "Array of catalog items to include (required)",
          items: {
            type: "object",
            properties: {
              catalogoItemId: { type: "string", description: "Catalog item ID" },
              cantidad: { type: "number", description: "Quantity" },
              descuento: { type: "number", description: "Line item discount %" },
              precioOverride: { type: "number", description: "Override catalog price" }
            },
            required: ["catalogoItemId", "cantidad"]
          }
        },
        dealId: { type: "string", description: "Associated deal ID" },
        leadId: { type: "string", description: "Associated lead ID" },
        descripcion: { type: "string", description: "Quote description" },
        descuentoPorcentaje: { type: "number", description: "Global discount % (default: 0)" },
        moneda: { type: "string", description: "Currency code (EUR, USD, MXN)" },
        validezDias: { type: "number", description: "Validity in days (default: 30)" },
        terminosPago: { type: "string", description: "Payment terms" },
        notasCliente: { type: "string", description: "Notes visible to client" },
        notasInternas: { type: "string", description: "Internal notes" },
        clienteNombre: { type: "string", description: "Client name (auto-filled from lead/contact)" },
        clienteEmail: { type: "string", description: "Client email" },
        clienteEmpresa: { type: "string", description: "Client company" },
        emisorId: { type: "string", description: "Issuer/company fiscal profile ID" }
      },
      required: ["titulo", "catalogItems"]
    }
  },

  // === ÓRDENES DE VENTA (SALES ORDERS) ===
  {
    name: "volkern_list_ordenes_venta",
    description: "List sales orders with optional filters. Returns paginated results.",
    inputSchema: {
      type: "object",
      properties: {
        estado: { type: "string", description: "Filter by status" },
        leadId: { type: "string", description: "Filter by lead ID" },
        contactId: { type: "string", description: "Filter by contact ID" },
        dealId: { type: "string", description: "Filter by deal ID" },
        contratoId: { type: "string", description: "Filter by contract ID" },
        fechaDesde: { type: "string", description: "Start date filter (ISO 8601)" },
        fechaHasta: { type: "string", description: "End date filter (ISO 8601)" },
        search: { type: "string", description: "Search by order number or client" },
        page: { type: "number", description: "Page number (default: 1)" },
        limit: { type: "number", description: "Results per page (default: 50)" }
      }
    }
  },
  {
    name: "volkern_get_orden_venta",
    description: "Get detailed information about a specific sales order",
    inputSchema: {
      type: "object",
      properties: {
        ordenId: { type: "string", description: "The sales order's unique ID" }
      },
      required: ["ordenId"]
    }
  },
  {
    name: "volkern_create_orden_from_cotizacion",
    description: "Convert an accepted quote into a sales order. Inherits items, client data, and fiscal references.",
    inputSchema: {
      type: "object",
      properties: {
        cotizacionId: { type: "string", description: "ID of the accepted quote (required)" },
        fechaEntrega: { type: "string", description: "Expected delivery date (ISO 8601)" },
        notas: { type: "string", description: "Client-facing notes" },
        notasInternas: { type: "string", description: "Internal notes" },
        condicionesVenta: { type: "string", description: "Sales conditions" },
        referenciaCliente: { type: "string", description: "Client reference/PO number" },
        ajustarPrecios: { type: "boolean", description: "Update prices from current catalog (default: false)" }
      },
      required: ["cotizacionId"]
    }
  },

  // === CONTRATOS (CONTRACTS) ===
  {
    name: "volkern_create_contrato_from_cotizacion",
    description: "Convert an accepted quote into a contract. Inherits items, client, fiscal data, and catalog references.",
    inputSchema: {
      type: "object",
      properties: {
        cotizacionId: { type: "string", description: "ID of the accepted quote (required)" },
        tipo: { type: "string", enum: ["servicio", "producto", "mixto", "suscripcion"], description: "Contract type (default: servicio)" },
        fechaInicio: { type: "string", description: "Contract start date (ISO 8601)" },
        fechaFin: { type: "string", description: "Contract end date (ISO 8601)" },
        metodoPago: { type: "string", description: "Payment method" },
        condicionesPago: { type: "string", description: "Payment conditions" },
        frecuenciaPago: { type: "string", enum: ["mensual", "trimestral", "anual", "unico"], description: "Payment frequency" },
        diaPago: { type: "number", description: "Day of month for payment" },
        clausulas: { type: "string", description: "Contract clauses/terms" },
        notasInternas: { type: "string", description: "Internal notes" },
        notasCliente: { type: "string", description: "Client-visible notes" },
        ajustarPrecios: { type: "boolean", description: "Update prices from current catalog (default: false)" }
      },
      required: ["cotizacionId"]
    }
  },
  
  // === FINANCE (ERP) ===
  {
    name: "volkern_get_financial_dashboard",
    description: "Get the global financial summary (P&L, Cash Flow, and Health) for the business. Restricted to authorized users.",
    inputSchema: {
      type: "object",
      properties: {
        months: { type: "number", description: "Period in months (default: 1)" }
      }
    }
  },
  {
    name: "volkern_verify_vault_integrity",
    description: "Verify the SHA-256 integrity chain of the financial audit vault to detect manipulations.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "volkern_calculate_tax_provisions",
    description: "Calculate tax liability projections based on localized rules (MX, ES, US-LLC).",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", enum: ["MX", "ES", "USA_LLC"], description: "Country code (default: ES)" }
      },
      required: ["country"]
    }
  },
  {
    name: "volkern_process_inventory_consumption",
    description: "Process inventory consumption for a product. If the product has a Bill of Materials (BoM), it will automatically deduct components.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "The ID of the product being consumed" },
        quantity: { type: "number", description: "The quantity to consume" },
        warehouseId: { type: "string", description: "Optional warehouse ID (defaults to main warehouse)" }
      },
      required: ["productId", "quantity"]
    }
  },
  {
    name: "volkern_get_inventory_health",
    description: "Analyze inventory health, detecting items below their reorder points and predicting supply ruptures.",
    inputSchema: {
      type: "object",
      properties: {
        itemId: { type: "string", description: "Optional item ID to check specific health" }
      }
    }
  },
  {
    name: "volkern_report_production_scrap",
    description: "Report production waste (scrap) with Vision-Lock verification. Requires evidence image and location data.",
    inputSchema: {
      type: "object",
      properties: {
        workOrderId: { type: "string", description: "The ID of the work order" },
        itemId: { type: "string", description: "The ID of the item being scrapped" },
        quantity: { type: "number", description: "Quantity of waste" },
        evidenceUrl: { type: "string", description: "URL of the photographic evidence" },
        lat: { type: "number", description: "GPS Latitude of the report" },
        lng: { type: "number", description: "GPS Longitude of the report" },
        timestamp: { type: "string", description: "ISO timestamp of the capture" }
      },
      required: ["workOrderId", "itemId", "quantity", "evidenceUrl"]
    }
  },
];