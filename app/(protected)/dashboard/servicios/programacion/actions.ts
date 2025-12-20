"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function getOrdenesByDateRange(token: string, startDate: Date, endDate: Date, tecnicoId?: number) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });
    if (!usuario) return { error: "Usuario no encontrado" };

    const whereClause: any = {
      tenantId: usuario.tenantId,
      fechaVisita: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (tecnicoId) {
      whereClause.tecnicoId = tecnicoId;
    }

    const ordenes = await prisma.ordenServicio.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: { nombre: true, apellido: true },
        },
        tecnico: {
          select: { nombre: true, apellido: true },
        },
        servicio: {
          select: { nombre: true },
        },
        tipoServicio: {
          select: { nombre: true, id: true },
        },
        empresa: {
            select: { nombre: true }
        },
        zona: {
            select: { nombre: true }
        }
      },
      orderBy: {
        horaInicio: "asc",
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
    console.error("Error obteniendo órdenes por fecha:", error);
    return { error: "Error al cargar la programación" };
  }
}
