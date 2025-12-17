"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getTecnicos(token: string) {
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

    const tecnicos = await prisma.usuario.findMany({
      where: {
        tenantId: usuario.tenantId,
        rol: "TECNICO",
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

    return { tecnicos };
  } catch (error) {
    console.error("Error obteniendo técnicos:", error);
    return { error: "Error al cargar los técnicos" };
  }
}

export async function getTecnico(token: string, id: number) {
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

    const tecnico = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "TECNICO",
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

    if (!tecnico) {
      return { error: "Técnico no encontrado" };
    }

    return { tecnico };
  } catch (error) {
    console.error("Error obteniendo técnico:", error);
    return { error: "Error al cargar el técnico" };
  }
}

export async function deleteTecnico(token: string, id: number) {
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

    // Verificar que el usuario a eliminar sea un técnico y pertenezca al tenant
    const tecnicoToDelete = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "TECNICO",
      },
    });

    if (!tecnicoToDelete) {
      return { error: "Técnico no encontrado o no autorizado para eliminar" };
    }

    await prisma.usuario.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/dashboard/usuarios/tecnicos");
    return { success: true, message: "Técnico eliminado exitosamente" };
  } catch (error) {
    console.error("Error eliminando técnico:", error);
    return {
      error:
        "Error al eliminar el técnico. Verifique que no tenga órdenes o asignaciones asociadas.",
    };
  }
}

export async function updateTecnico(token: string, id: number, formData: FormData) {
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
    
    // Verify tenant and role
    const tecnico = await prisma.usuario.findUnique({
      where: {
        id: id,
        tenantId: usuario.tenantId,
        rol: "TECNICO",
      },
    });

    if (!tecnico) {
      return { error: "Técnico no encontrado" };
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

    revalidatePath("/dashboard/usuarios/tecnicos");
    return { success: true, message: "Técnico actualizado exitosamente" };
  } catch (error) {
    console.error("Error actualizando técnico:", error);
    return { error: "Error al actualizar el técnico" };
  }
}
