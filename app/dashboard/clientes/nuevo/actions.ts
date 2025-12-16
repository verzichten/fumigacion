"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCliente(token: string, formData: FormData) {
  const payload = verifyToken(token);

  if (!payload) {
    return { error: "No autorizado. Por favor inicie sesión nuevamente." };
  }

  // Obtener el tenantId del usuario
  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.userId },
    select: { tenantId: true },
  });

  if (!usuario) {
    return { error: "Usuario no encontrado." };
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

  let direccionesData: any[] = [];
  try {
    if (direccionesJson) {
      const parsed = JSON.parse(direccionesJson);
      if (Array.isArray(parsed)) {
        direccionesData = parsed.map((d: any) => ({
          tenantId: usuario.tenantId,
          direccion: d.direccion,
          barrio: d.barrio || null,
          municipio: d.municipio || null,
          piso: d.piso || null,
          bloque: d.bloque || null,
          unidad: d.unidad || null,
        }));
      }
    }
  } catch (e) {
    console.error("Error parsing direcciones:", e);
  }

  try {
    await prisma.cliente.create({
      data: {
        tenantId: usuario.tenantId,
        nombre,
        apellido,
        tipoDocumento,
        numeroDocumento,
        telefono,
        correo: correo || null,
        direcciones: {
          create: direccionesData,
        },
      },
    });

    revalidatePath("/dashboard/clientes");
    return { success: true, message: "Cliente creado exitosamente." };
  } catch (error) {
    console.error("Error creando cliente:", error);
    return { error: "Error al crear el cliente." };
  }
}
