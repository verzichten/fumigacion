"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getServicios(token: string) {
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

    const servicios = await prisma.servicio.findMany({
      where: {
        tenantId: usuario.tenantId,
      },
      orderBy: {
        nombre: "asc",
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    return { servicios };
  } catch (error) {
    console.error("Error obteniendo servicios:", error);
    return { error: "Error al cargar los servicios" };
  }
}

export async function getEmpresasOptions(token: string) {
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

    const empresas = await prisma.empresa.findMany({
      where: {
        tenantId: usuario.tenantId,
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: "asc",
      },
    });

    return { empresas };
  } catch (error) {
    console.error("Error obteniendo empresas:", error);
    return { error: "Error al cargar las empresas" };
  }
}

export async function createServicio(token: string, formData: FormData) {
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
    const activo = formData.get("activo") === "on";
    const empresaId = formData.get("empresaId") ? parseInt(formData.get("empresaId") as string) : null;

    if (!nombre) {
        return { error: "El nombre es obligatorio" };
    }

    await prisma.servicio.create({
      data: {
        tenantId: usuario.tenantId,
        nombre,
        activo,
        empresaId,
      },
    });

    revalidatePath("/dashboard/configuracion/servicios");
    return { success: true, message: "Servicio creado exitosamente" };
  } catch (error) {
    console.error("Error creando servicio:", error);
    return { error: "Error al crear el servicio" };
  }
}

export async function updateServicio(token: string, id: number, formData: FormData) {
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
    const activo = formData.get("activo") === "on";
    const empresaId = formData.get("empresaId") ? parseInt(formData.get("empresaId") as string) : null;

    if (!nombre) {
        return { error: "El nombre es obligatorio" };
    }

    await prisma.servicio.update({
        where: { id, tenantId: usuario.tenantId },
        data: {
            nombre,
            activo,
            empresaId
        }
    });

    revalidatePath("/dashboard/configuracion/servicios");
    return { success: true, message: "Servicio actualizado exitosamente" };
  } catch (error) {
    console.error("Error actualizando servicio:", error);
    return { error: "Error al actualizar el servicio" };
  }
}

export async function deleteServicio(token: string, id: number) {
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
  
      await prisma.servicio.update({
        where: { id, tenantId: usuario.tenantId },
        data: {
            activo: false // Soft delete
        }
      });
  
      revalidatePath("/dashboard/configuracion/servicios");
      return { success: true, message: "Servicio eliminado exitosamente" };
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      return { error: "Error al eliminar el servicio. Verifique que no tenga órdenes de servicio asociadas." };
    }
  }