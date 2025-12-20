"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Rol, EstadoServicio } from "@prisma/client";
import { redis } from "@/lib/redis";

// --- Funciones para el Listado de Órdenes (Page principal) ---

export async function getOrdenesServicio(token: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });
    if (!usuario) return { error: "Usuario no encontrado" };

    const ordenes = await prisma.ordenServicio.findMany({
      where: { tenantId: usuario.tenantId },
      orderBy: { id: "desc" },
      take: 100, // Reducido de 500 a 100
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            tipoDocumento: true,
            numeroDocumento: true,
            telefono: true,
            correo: true,
          },
        },
        empresa: { select: { id: true, nombre: true } },
        servicio: { select: { nombre: true } },
        tecnico: { select: { nombre: true, apellido: true } },
        tipoServicio: { select: { id: true, nombre: true } },
        creadoPor: { select: { nombre: true, apellido: true } },
        zona: { select: { nombre: true } },
      },
    });

    const ordenesSerialized = ordenes.map((orden) => ({
      ...orden,
      valorCotizado: orden.valorCotizado ? Number(orden.valorCotizado) : null,
      valorPagado: orden.valorPagado ? Number(orden.valorPagado) : null,
      valorRepuestos: orden.valorRepuestos ? Number(orden.valorRepuestos) : 0,
    }));

    return { ordenes: ordenesSerialized };
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    return { error: "Error al cargar las órdenes" };
  }
}

export async function getOrdenServicio(token: string, id: number) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    const orden = await prisma.ordenServicio.findUnique({
      where: { id, tenantId: usuario.tenantId },
      include: {
        cliente: true,
        empresa: true,
        servicio: true,
        tecnico: true,
        direccion: true,
        tipoServicio: true,
        zona: true,
        metodoPago: true,
        creadoPor: true,
      },
    });

    if (!orden) return { error: "Orden no encontrada" };

    const ordenSerialized = {
      ...orden,
      valorCotizado: orden.valorCotizado ? Number(orden.valorCotizado) : null,
      valorPagado: orden.valorPagado ? Number(orden.valorPagado) : null,
      valorRepuestos: orden.valorRepuestos ? Number(orden.valorRepuestos) : 0,
    };

    return { orden: ordenSerialized };
  } catch (error) {
    console.error("Error obteniendo orden:", error);
    return { error: "Error al cargar la orden" };
  }
}

export async function deleteOrdenServicio(token: string, id: number) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    await prisma.ordenServicio.delete({
      where: { id, tenantId: usuario.tenantId },
    });

    if (redis) {
      await redis.del(`stats:ordenes:${usuario.tenantId}`);
    }

    revalidatePath("/dashboard/servicios");
    return { success: true, message: "Orden eliminada exitosamente" };
  } catch (error) {
    console.error("Error eliminando orden:", error);
    return { error: "Error al eliminar la orden" };
  }
}

export async function getOrdenesStats(token: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    const tenantId = usuario.tenantId;

    if (redis) {
      const cachedStats = await redis.get(`stats:ordenes:${tenantId}`);
      if (cachedStats) {
        return { stats: JSON.parse(cachedStats) };
      }
    }

    // Usar una sola consulta agregada en lugar de 5 consultas separadas
    const [stats, noConcretados] = await Promise.all([
      prisma.ordenServicio.groupBy({
        by: ["estado"],
        where: { tenantId },
        _count: true,
      }),
      prisma.ordenServicio.count({
        where: {
          tenantId,
          tipoServicio: {
            nombre: "NO CONCRETADO",
          },
        },
      }),
    ]);

    // Contar desde los resultados agrupados
    const totalOrdenes = stats.reduce((sum, s) => sum + s._count, 0);
    const programadas =
      stats.find((s) => s.estado === "PROGRAMADO")?._count || 0;
    const enProceso = stats.find((s) => s.estado === "EN_PROCESO")?._count || 0;
    const finalizadas =
      stats.find((s) => s.estado === "SERVICIO_LISTO")?._count || 0;

    const resultStats = {
      totalOrdenes,
      programadas,
      enProceso,
      finalizadas,
      noConcretados,
    };

    if (redis) {
      await redis.set(`stats:ordenes:${tenantId}`, JSON.stringify(resultStats), 'EX', 300);
    }

    return {
      stats: resultStats,
    };
  } catch (error) {
    console.error("Error stats:", error);
    return { error: "Error cargando estadísticas" };
  }
}

// --- Funciones para Nuevo Servicio (Formulario) ---

// NUEVA FUNCIÓN OPTIMIZADA SOLO PARA FILTROS
export async function getFilterData(token: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };
    const tenantId = usuario.tenantId;

    if (redis) {
      const cachedFilters = await redis.get(`filters:data:${tenantId}`);
      if (cachedFilters) {
        return JSON.parse(cachedFilters);
      }
    }

    // Solo las consultas necesarias para filtros
    const [tiposServicios, creadores, empresas] = await Promise.all([
      prisma.tipoServicio.findMany({
        where: { tenantId, activo: true },
        select: { id: true, nombre: true, empresaId: true },
      }),
      prisma.usuario.findMany({
        where: { tenantId, rol: { in: ["ADMIN", "ASESOR"] }, activo: true },
        select: { id: true, nombre: true, apellido: true },
      }),
      prisma.empresa.findMany({
        where: { tenantId },
        select: { id: true, nombre: true },
      }),
    ]);

    const resultFilters = {
      tiposServicios,
      creadores,
      empresas,
    };

    if (redis) {
      await redis.set(`filters:data:${tenantId}`, JSON.stringify(resultFilters), 'EX', 3600);
    }

    return resultFilters;
  } catch (error) {
    console.error("Error getFilterData:", error);
    return { error: "Error al cargar datos de filtros" };
  }
}

export async function getFormData(token: string, simpleMode: boolean = false) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };
    const tenantId = usuario.tenantId;

    const [
      clientes,
      tiposServicios,
      servicios,
      tecnicos,
      asesores,
      creadores,
      empresas,
      zonas,
      metodosPago,
    ] = await Promise.all([
      !simpleMode
        ? prisma.cliente.findMany({
            where: { tenantId },
            include: { direcciones: true },
            orderBy: { nombre: "asc" },
          })
        : Promise.resolve([]),
      prisma.tipoServicio.findMany({ where: { tenantId, activo: true } }),
      !simpleMode
        ? prisma.servicio.findMany({ where: { tenantId, activo: true } })
        : Promise.resolve([]),
      !simpleMode
        ? prisma.usuario.findMany({
            where: { tenantId, rol: "TECNICO", activo: true },
          })
        : Promise.resolve([]),
      !simpleMode
        ? prisma.usuario.findMany({
            where: { tenantId, rol: "ASESOR", activo: true },
          })
        : Promise.resolve([]),
      prisma.usuario.findMany({
        where: { tenantId, rol: { in: ["ADMIN", "ASESOR"] }, activo: true },
        select: { id: true, nombre: true, apellido: true },
      }),
      prisma.empresa.findMany({ where: { tenantId } }),
      !simpleMode
        ? prisma.zona.findMany({ where: { tenantId, estado: true } })
        : Promise.resolve([]),
      !simpleMode
        ? prisma.metodoPago.findMany({ where: { tenantId, activo: true } })
        : Promise.resolve([]),
    ]);

    return {
      clientes,
      tiposServicios,
      servicios,
      tecnicos,
      asesores,
      creadores,
      empresas,
      zonas,
      metodosPago,
    };
  } catch (error) {
    console.error("Error getFormData:", error);
    return { error: "Error al cargar datos del formulario" };
  }
}

export async function addDireccionToCliente(
  token: string,
  clienteId: number,
  addressData: any,
) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    const nuevaDireccion = await prisma.direccion.create({
      data: {
        tenantId: usuario.tenantId,
        clienteId,
        direccion: addressData.direccion,
        municipio: addressData.municipio,
        barrio: addressData.barrio,
        bloque: addressData.bloque,
        unidad: addressData.unidad,
        piso: addressData.piso,
      },
    });

    return { direccion: nuevaDireccion };
  } catch (error) {
    console.error("Error adding address:", error);
    return { error: "Error al guardar la dirección" };
  }
}

export async function createOrdenServicio(token: string, formData: FormData) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true, id: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Extract data
    const clienteId = Number(formData.get("cliente"));
    const direccionId = Number(formData.get("direccionCliente"));
    const empresaId = Number(formData.get("empresa"));
    const tipoServicioId = Number(formData.get("tipoServicio"));
    const servicioId = Number(formData.get("servicio"));
    const tecnicoId = formData.get("tecnico")
      ? Number(formData.get("tecnico"))
      : null;
    const zonaId = formData.get("zona") ? Number(formData.get("zona")) : null;
    const observacion = formData.get("observacion") as string;

    const fechaVisitaStr = formData.get("fechaVisita") as string;
    const horaInicioStr = formData.get("horaInicio") as string;

    const valorCotizado = formData.get("valorCotizado")
      ? Number(formData.get("valorCotizado"))
      : null;
    const valorRepuestos = formData.get("valorRepuestos")
      ? Number(formData.get("valorRepuestos"))
      : 0;
    const metodoPagoId = formData.get("metodoPago")
      ? Number(formData.get("metodoPago"))
      : null;
    const estado = formData.get("estado") as EstadoServicio;

    // Validate required fields
    if (!clienteId || !servicioId || !tipoServicioId) {
      return { error: "Faltan campos obligatorios" };
    }

    // Get address text for caching
    const direccion = await prisma.direccion.findUnique({
      where: { id: direccionId },
    });
    const direccionTexto = direccion
      ? `${direccion.direccion} ${direccion.municipio || ""}`.trim()
      : "Dirección no encontrada";

    // Combine Date and Time
    let fechaVisita: Date | null = null;
    let horaInicio: Date | null = null;

    if (fechaVisitaStr) {
      fechaVisita = new Date(fechaVisitaStr);
    }

    if (fechaVisitaStr && horaInicioStr) {
      horaInicio = new Date(`${fechaVisitaStr}T${horaInicioStr}`);
    }

    await prisma.ordenServicio.create({
      data: {
        tenantId: usuario.tenantId,
        clienteId,
        direccionId,
        empresaId,
        tipoServicioId,
        servicioId,
        tecnicoId,
        zonaId,
        observacion,
        fechaVisita,
        horaInicio,
        valorCotizado,
        valorRepuestos,
        metodoPagoId,
        estado,
        direccionTexto,
        creadoPorId: usuario.id,
        barrio: direccion?.barrio,
        municipio: direccion?.municipio,
        bloque: direccion?.bloque,
        unidad: direccion?.unidad,
        piso: direccion?.piso,
      },
    });

    revalidatePath("/dashboard/servicios");
    
    if (redis) {
      await redis.del(`stats:ordenes:${usuario.tenantId}`);
    }

    return { success: true, message: "Orden de servicio creada correctamente" };
  } catch (error) {
    console.error("Error creating orden:", error);
    return { error: "Error al crear la orden de servicio" };
  }
}

export async function updateOrdenServicio(
  token: string,
  id: number,
  formData: FormData,
) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Verify existence and ownership
    const existingOrden = await prisma.ordenServicio.findUnique({
      where: { id, tenantId: usuario.tenantId },
    });

    if (!existingOrden) return { error: "Orden no encontrada" };

    // Extract data
    const clienteId = Number(formData.get("cliente"));
    const direccionId = Number(formData.get("direccionCliente"));
    const empresaId = Number(formData.get("empresa"));
    const tipoServicioId = Number(formData.get("tipoServicio"));
    const servicioId = Number(formData.get("servicio"));
    const tecnicoId = formData.get("tecnico")
      ? Number(formData.get("tecnico"))
      : null;
    const zonaId = formData.get("zona") ? Number(formData.get("zona")) : null;
    const observacion = formData.get("observacion") as string;

    const fechaVisitaStr = formData.get("fechaVisita") as string;
    const horaInicioStr = formData.get("horaInicio") as string;

    const valorCotizado = formData.get("valorCotizado")
      ? Number(formData.get("valorCotizado"))
      : null;
    const valorRepuestos = formData.get("valorRepuestos")
      ? Number(formData.get("valorRepuestos"))
      : 0;
    const metodoPagoId = formData.get("metodoPago")
      ? Number(formData.get("metodoPago"))
      : null;
    const estado = formData.get("estado") as EstadoServicio;

    // Validate required fields
    if (!clienteId || !servicioId || !tipoServicioId) {
      return { error: "Faltan campos obligatorios" };
    }

    // Get address text for caching
    const direccion = await prisma.direccion.findUnique({
      where: { id: direccionId },
    });
    const direccionTexto = direccion
      ? `${direccion.direccion} ${direccion.municipio || ""}`.trim()
      : "Dirección no encontrada";

    // Combine Date and Time
    let fechaVisita: Date | null = null;
    let horaInicio: Date | null = null;

    if (fechaVisitaStr) {
      fechaVisita = new Date(fechaVisitaStr);
    }

    if (fechaVisitaStr && horaInicioStr) {
      horaInicio = new Date(`${fechaVisitaStr}T${horaInicioStr}`);
    }

    await prisma.ordenServicio.update({
      where: { id },
      data: {
        clienteId,
        direccionId,
        empresaId,
        tipoServicioId,
        servicioId,
        tecnicoId,
        zonaId,
        observacion,
        fechaVisita,
        horaInicio,
        valorCotizado,
        valorRepuestos,
        metodoPagoId,
        estado,
        direccionTexto,
        barrio: direccion?.barrio,
        municipio: direccion?.municipio,
        bloque: direccion?.bloque,
        unidad: direccion?.unidad,
        piso: direccion?.piso,
      },
    });

    revalidatePath("/dashboard/servicios");

    if (redis) {
      await redis.del(`stats:ordenes:${usuario.tenantId}`);
    }

    return {
      success: true,
      message: "Orden de servicio actualizada correctamente",
    };
  } catch (error) {
    console.error("Error updating orden:", error);
    return { error: "Error al actualizar la orden de servicio" };
  }
}

export async function sendServiceToTechnician(token: string, ordenId: number, message: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId, tenantId: usuario.tenantId },
      include: {
        tecnico: true,
      },
    });

    if (!orden) return { error: "Orden no encontrada" };

    if (!orden.tecnicoId) return { error: "La orden no tiene técnico asignado" };

    // Fetch full technician data directly from Usuario table to get sensitive fields
    const tecnico = await prisma.usuario.findUnique({
      where: { id: orden.tecnicoId },
      select: {
        numberId: true,
        whatsappGroupId: true,
      }
    });

    if (!tecnico) return { error: "Técnico no encontrado en el sistema" };

    if (!tecnico.numberId || !tecnico.whatsappGroupId) {
      return { error: "El técnico no tiene configurado numberId o whatsappGroupId" };
    }

    const webhookUrl = "https://cobrocartera-n8n.hrymiz.easypanel.host/webhook-test/send-service-worker";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        numberId: tecnico.numberId,
        whatsappGroupId: tecnico.whatsappGroupId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    return { success: true, message: "Información enviada al técnico correctamente" };
  } catch (error) {
    console.error("Error sending to technician:", error);
    return { error: "Error al enviar la información al técnico" };
  }
}