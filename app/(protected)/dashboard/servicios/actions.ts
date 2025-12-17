"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Rol, EstadoServicio } from "@prisma/client";

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
      orderBy: { createdAt: "desc" },
      include: {
        cliente: true,
        empresa: { select: { id: true, nombre: true } },
        servicio: { select: { nombre: true } },
        tecnico: { select: { nombre: true, apellido: true } },
        tipoServicio: { select: { id: true, nombre: true } },
        creadoPor: { select: { nombre: true, apellido: true } },
        zona: { select: { nombre: true } },
      },
    });

    const ordenesSerialized = ordenes.map(orden => ({
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
        select: { tenantId: true }
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    await prisma.ordenServicio.delete({
      where: { id, tenantId: usuario.tenantId },
    });

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
        select: { tenantId: true }
    });
    
    if (!usuario) return { error: "Usuario no encontrado" };

    const tenantId = usuario.tenantId;

    const totalOrdenes = await prisma.ordenServicio.count({ where: { tenantId } });
    const programadas = await prisma.ordenServicio.count({ where: { tenantId, estado: "PROGRAMADO" } });
    const enProceso = await prisma.ordenServicio.count({ where: { tenantId, estado: "EN_PROCESO" } });
    const finalizadas = await prisma.ordenServicio.count({ where: { tenantId, estado: "SERVICIO_LISTO" } });
    const noConcretados = await prisma.ordenServicio.count({
      where: {
        tenantId,
        tipoServicio: {
          nombre: "NO CONCRETADO"
        }
      }
    });

    // Ordenes por mes (últimos 6 meses) - simplified for now
    // Or just group by status
    
    return {
      stats: {
        totalOrdenes,
        programadas,
        enProceso,
        finalizadas,
        noConcretados
      }
    };
  } catch (error) {
    console.error("Error stats:", error);
    return { error: "Error cargando estadísticas" };
  }
}

// --- Funciones para Nuevo Servicio (Formulario) ---

export async function getFormData(token: string) {
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
      metodosPago
    ] = await Promise.all([
      prisma.cliente.findMany({ 
        where: { tenantId }, 
        include: { direcciones: true },
        orderBy: { nombre: 'asc' } 
      }),
      prisma.tipoServicio.findMany({ where: { tenantId, activo: true } }),
      prisma.servicio.findMany({ where: { tenantId, activo: true } }),
      prisma.usuario.findMany({ 
        where: { tenantId, rol: "TECNICO", activo: true } 
      }),
      prisma.usuario.findMany({ 
        where: { tenantId, rol: "ASESOR", activo: true } 
      }),
      prisma.usuario.findMany({
        where: { tenantId, rol: { in: ["ADMIN", "ASESOR"] }, activo: true },
        select: { id: true, nombre: true, apellido: true }
      }),
      prisma.empresa.findMany({ where: { tenantId } }),
      prisma.zona.findMany({ where: { tenantId, estado: true } }),
      prisma.metodoPago.findMany({ where: { tenantId, activo: true } })
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
      metodosPago
    };
  } catch (error) {
    console.error("Error getFormData:", error);
    return { error: "Error al cargar datos del formulario" };
  }
}

export async function addDireccionToCliente(token: string, clienteId: number, addressData: any) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
        where: { id: payload.userId },
        select: { tenantId: true }
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
      }
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
        select: { tenantId: true, id: true }
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Extract data
    const clienteId = Number(formData.get("cliente"));
    const direccionId = Number(formData.get("direccionCliente"));
    const empresaId = Number(formData.get("empresa"));
    const tipoServicioId = Number(formData.get("tipoServicio"));
    const servicioId = Number(formData.get("servicio"));
    const tecnicoId = formData.get("tecnico") ? Number(formData.get("tecnico")) : null;
    const zonaId = formData.get("zona") ? Number(formData.get("zona")) : null;
    const observacion = formData.get("observacion") as string;
    
    const fechaVisitaStr = formData.get("fechaVisita") as string;
    const horaInicioStr = formData.get("horaInicio") as string;
    
    const valorCotizado = formData.get("valorCotizado") ? Number(formData.get("valorCotizado")) : null;
    const valorRepuestos = formData.get("valorRepuestos") ? Number(formData.get("valorRepuestos")) : 0;
    const metodoPagoId = formData.get("metodoPago") ? Number(formData.get("metodoPago")) : null;
    const estado = formData.get("estado") as EstadoServicio;

    // Validate required fields
    if (!clienteId || !servicioId || !tipoServicioId) {
        return { error: "Faltan campos obligatorios" };
    }

    // Get address text for caching
    const direccion = await prisma.direccion.findUnique({ where: { id: direccionId } });
    const direccionTexto = direccion 
        ? `${direccion.direccion} ${direccion.municipio || ''}`.trim() 
        : "Dirección no encontrada";

    // Combine Date and Time
    let fechaVisita: Date | null = null;
    let horaInicio: Date | null = null;
    
    if (fechaVisitaStr) {
        fechaVisita = new Date(fechaVisitaStr);
        // Adjust for timezone if needed, but keeping simple for now
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
        direccionTexto, // Cache address text
        creadoPorId: usuario.id,
        // Optional fields from address
        barrio: direccion?.barrio,
        municipio: direccion?.municipio,
        bloque: direccion?.bloque,
        unidad: direccion?.unidad,
        piso: direccion?.piso,
      }
    });

    revalidatePath("/dashboard/servicios");
    return { success: true, message: "Orden de servicio creada correctamente" };

  } catch (error) {
    console.error("Error creating orden:", error);
    return { error: "Error al crear la orden de servicio" };
  }
}

export async function updateOrdenServicio(token: string, id: number, formData: FormData) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
        where: { id: payload.userId },
        select: { tenantId: true }
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Verify existence and ownership
    const existingOrden = await prisma.ordenServicio.findUnique({
        where: { id, tenantId: usuario.tenantId }
    });

    if (!existingOrden) return { error: "Orden no encontrada" };

    // Extract data
    const clienteId = Number(formData.get("cliente"));
    const direccionId = Number(formData.get("direccionCliente"));
    const empresaId = Number(formData.get("empresa"));
    const tipoServicioId = Number(formData.get("tipoServicio"));
    const servicioId = Number(formData.get("servicio"));
    const tecnicoId = formData.get("tecnico") ? Number(formData.get("tecnico")) : null;
    const zonaId = formData.get("zona") ? Number(formData.get("zona")) : null;
    const observacion = formData.get("observacion") as string;
    
    const fechaVisitaStr = formData.get("fechaVisita") as string;
    const horaInicioStr = formData.get("horaInicio") as string;
    
    const valorCotizado = formData.get("valorCotizado") ? Number(formData.get("valorCotizado")) : null;
    const valorRepuestos = formData.get("valorRepuestos") ? Number(formData.get("valorRepuestos")) : 0;
    const metodoPagoId = formData.get("metodoPago") ? Number(formData.get("metodoPago")) : null;
    const estado = formData.get("estado") as EstadoServicio;

    // Validate required fields
    if (!clienteId || !servicioId || !tipoServicioId) {
        return { error: "Faltan campos obligatorios" };
    }

    // Get address text for caching
    const direccion = await prisma.direccion.findUnique({ where: { id: direccionId } });
    const direccionTexto = direccion 
        ? `${direccion.direccion} ${direccion.municipio || ''}`.trim() 
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
        // Update cached address fields
        barrio: direccion?.barrio,
        municipio: direccion?.municipio,
        bloque: direccion?.bloque,
        unidad: direccion?.unidad,
        piso: direccion?.piso,
      }
    });

    revalidatePath("/dashboard/servicios");
    return { success: true, message: "Orden de servicio actualizada correctamente" };

  } catch (error) {
    console.error("Error updating orden:", error);
    return { error: "Error al actualizar la orden de servicio" };
  }
}