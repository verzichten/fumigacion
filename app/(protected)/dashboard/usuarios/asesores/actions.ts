"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAsesores(token: string) {
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

    const asesores = await prisma.usuario.findMany({
      where: {
        tenantId: usuario.tenantId,
        rol: "ASESOR",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        telefono: true,
        createdAt: true,
      },
    });

    return { asesores };
  } catch (error) {
    console.error("Error obteniendo asesores:", error);
    return { error: "Error al cargar los asesores" };
  }
}

export async function getAsesor(token: string, id: number) {
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

    const asesor = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "ASESOR",
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        telefono: true,
        createdAt: true,
      },
    });

    if (!asesor) {
      return { error: "Asesor no encontrado" };
    }

    return { asesor };
  } catch (error) {
    console.error("Error obteniendo asesor:", error);
    return { error: "Error al cargar el asesor" };
  }
}

export async function deleteAsesor(token: string, id: number) {
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

    // Verificar que el usuario a eliminar sea un asesor y pertenezca al tenant
    const asesorToDelete = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "ASESOR",
      },
    });

    if (!asesorToDelete) {
      return { error: "Asesor no encontrado o no autorizado para eliminar" };
    }

    await prisma.usuario.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/dashboard/usuarios/asesores");
    return { success: true, message: "Asesor eliminado exitosamente" };
  } catch (error) {
    console.error("Error eliminando asesor:", error);
    return {
      error:
        "Error al eliminar el asesor. Verifique que no tenga registros asociados.",
    };
  }
}

export async function updateAsesor(token: string, id: number, formData: FormData) {
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
    const telefono = formData.get("telefono") as string;
    const rol = formData.get("rol") as "ADMIN" | "TECNICO" | "ASESOR";
    
    // Verificar tenant y rol
    const asesor = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "ASESOR",
      },
    });

    if (!asesor) {
      return { error: "Asesor no encontrado" };
    }

    await prisma.usuario.update({
      where: { id: id },
      data: {
        nombre,
        apellido,
        telefono,
        rol,
      },
    });

    revalidatePath("/dashboard/usuarios/asesores");
    return { success: true, message: "Asesor actualizado exitosamente" };
  } catch (error) {
    console.error("Error actualizando asesor:", error);
    return { error: "Error al actualizar el asesor" };
  }
}
