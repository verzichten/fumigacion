"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getClientes(token: string) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    const clientes = await prisma.cliente.findMany({
      where: {
        tenantId: usuario.tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        direcciones: {
          take: 1, // Traer al menos la dirección principal para mostrar
        },
      },
    });

    return { clientes };
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return { error: "Error al cargar los clientes" };
  }
}

export async function getCliente(token: string, id: number) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
      },
      include: {
        direcciones: true,
      },
    });

    if (!cliente) {
      return { error: "Cliente no encontrado" };
    }

    return { cliente };
  } catch (error) {
    console.error("Error obteniendo cliente:", error);
    return { error: "Error al cargar el cliente" };
  }
}

export async function deleteCliente(token: string, id: number) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    // Primero verificamos que el cliente pertenezca al tenant
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
      },
    });

    if (!cliente) {
      return { error: "Cliente no encontrado o no autorizado" };
    }

    // Eliminar el cliente (la cascada se encargará de las direcciones si está configurada, 
    // pero Prisma requiere configuración explícita o borrar manualmente las relaciones si no hay onDelete: Cascade en DB)
    // Asumiremos que el schema maneja cascada o borramos relaciones primero.
    // Revisando el schema provided: Direccion tiene `cliente Cliente @relation(...)`. 
    // No veo `onDelete: Cascade`. Prisma por defecto restringe.
    // Debemos borrar las direcciones primero.

    await prisma.direccion.deleteMany({
      where: {
        clienteId: id,
        tenantId: usuario.tenantId, // Buena práctica aunque clienteId sea único
      },
    });

    await prisma.cliente.delete({
      where: {
        id: id,
      },
    });

    return { success: true, message: "Cliente eliminado exitosamente" };
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return { error: "Error al eliminar el cliente. Verifique que no tenga órdenes de servicio asociadas." };
  }
}

export async function updateCliente(token: string, id: number, formData: FormData) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const tipoDocumento = formData.get("tipoDocumento") as string;
    const numeroDocumento = formData.get("numeroDocumento") as string;
    const telefono = formData.get("telefono") as string;
    const correo = formData.get("correo") as string;
    const direccionesJson = formData.get("direcciones") as string;

    if (!telefono) {
      return { error: "El teléfono es obligatorio." };
    }

    let direccionesForm: any[] = [];
    try {
      if (direccionesJson) {
        direccionesForm = JSON.parse(direccionesJson);
      }
    } catch (e) {
      console.error("Error parsing direcciones:", e);
    }

    // 1. Obtener direcciones actuales de la BD para comparar
    const currentDirecciones = await prisma.direccion.findMany({
      where: { clienteId: id, tenantId: usuario.tenantId },
    });

    const currentDireccionesIds = currentDirecciones.map(d => d.id);
    
    // Identificar IDs que vienen del form que son reales (existen en BD)
    // Asumimos que si el ID es pequeño (ej. < 2000000000) es real, si es timestamp es nuevo.
    // Mejor aún, verificamos si el ID está en currentDireccionesIds.
    
    const direccionesToUpdate = direccionesForm.filter(d => currentDireccionesIds.includes(d.id));
    const direccionesToCreate = direccionesForm.filter(d => !currentDireccionesIds.includes(d.id));
    
    // Los que están en BD pero NO en el form, se borran
    const formIdsReal = direccionesToUpdate.map(d => d.id);
    const direccionesToDelete = currentDireccionesIds.filter(id => !formIdsReal.includes(id));

    await prisma.$transaction(async (tx) => {
      // Actualizar datos básicos
      await tx.cliente.update({
        where: { id: id },
        data: {
          nombre,
          apellido,
          tipoDocumento,
          numeroDocumento,
          telefono,
          correo: correo || null,
        },
      });

      // Borrar direcciones removidas
      if (direccionesToDelete.length > 0) {
        // Verificar si tienen órdenes antes de borrar? 
        // Prisma lanzará error si hay foreign keys restrict. 
        // Dejemos que falle si hay dependencias, es más seguro.
        await tx.direccion.deleteMany({
          where: { id: { in: direccionesToDelete } },
        });
      }

      // Actualizar existentes
      for (const dir of direccionesToUpdate) {
        await tx.direccion.update({
          where: { id: dir.id },
          data: {
            direccion: dir.direccion,
            municipio: dir.municipio || null,
            barrio: dir.barrio || null,
            piso: dir.piso || null,
            bloque: dir.bloque || null,
            unidad: dir.unidad || null,
          },
        });
      }

      // Crear nuevas
      if (direccionesToCreate.length > 0) {
        await tx.direccion.createMany({
          data: direccionesToCreate.map(dir => ({
            tenantId: usuario.tenantId,
            clienteId: id,
            direccion: dir.direccion,
            municipio: dir.municipio || null,
            barrio: dir.barrio || null,
            piso: dir.piso || null,
            bloque: dir.bloque || null,
            unidad: dir.unidad || null,
          })),
        });
      }
    });

    revalidatePath("/dashboard/clientes");
    return { success: true, message: "Cliente actualizado exitosamente." };
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    // Verificar error de FK
    if (JSON.stringify(error).includes("Foreign key constraint failed")) {
       return { error: "No se pueden eliminar direcciones que tienen órdenes de servicio asociadas." };
    }
    return { error: "Error al actualizar el cliente." };
  }
}

export async function getClientesStats(token: string) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    // Total clientes
    const totalClientes = await prisma.cliente.count({
      where: { tenantId: usuario.tenantId },
    });

    // Agrupar por municipio
    const municipiosGroup = await prisma.direccion.groupBy({
      by: ['municipio'],
      where: { 
        tenantId: usuario.tenantId,
        municipio: { not: null }
      },
      _count: {
        municipio: true
      },
      orderBy: {
        _count: {
          municipio: 'desc'
        }
      },
      take: 5
    });

    // Agrupar por barrio
    const barriosGroup = await prisma.direccion.groupBy({
      by: ['barrio'],
      where: { 
        tenantId: usuario.tenantId,
        barrio: { not: null }
      },
      _count: {
        barrio: true
      },
      orderBy: {
        _count: {
          barrio: 'desc'
        }
      },
      take: 5
    });

    const municipiosStats = municipiosGroup.map(g => ({
      nombre: g.municipio || "Desconocido",
      cantidad: g._count.municipio
    }));

    const barriosStats = barriosGroup.map(g => ({
      nombre: g.barrio || "Desconocido",
      cantidad: g._count.barrio
    }));

    return { 
      stats: {
        totalClientes,
        municipios: municipiosStats,
        barrios: barriosStats
      }
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { error: "Error al cargar estadísticas" };
  }
}
