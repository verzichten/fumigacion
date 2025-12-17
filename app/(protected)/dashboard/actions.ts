"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { EstadoServicio } from "@prisma/client";

export async function getDashboardStats(token: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: { tenantId: true },
    });

    if (!usuario) return { error: "Usuario no encontrado" };
    const tenantId = usuario.tenantId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      serviciosAgendadosHoy,
      serviciosRealizadosHoy,
      serviciosEnProcesoHoy,
      serviciosEnProcesoTotal,
      serviciosRealizadosTotal,
      serviciosTotalesHistorico,
      ingresosHoy,
      ingresosTotal,
      topServicios
    ] = await Promise.all([
      // Servicios agendados para hoy (cualquier estado, fecha visita = hoy)
      prisma.ordenServicio.count({
        where: {
          tenantId,
          fechaVisita: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Servicios realizados hoy (Estado LISTO y fecha visita = hoy)
      prisma.ordenServicio.count({
        where: {
          tenantId,
          estado: "SERVICIO_LISTO",
          fechaVisita: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
       // Servicios en proceso hoy (Estado EN_PROCESO y fecha visita = hoy)
       prisma.ordenServicio.count({
        where: {
          tenantId,
          estado: "EN_PROCESO",
          fechaVisita: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Servicios en proceso (Total actual)
      prisma.ordenServicio.count({
        where: {
          tenantId,
          estado: "EN_PROCESO",
        },
      }),
       // Servicios realizados (Total histórico)
       prisma.ordenServicio.count({
        where: {
          tenantId,
          estado: "SERVICIO_LISTO",
        },
      }),
      // Servicios Totales (Total histórico)
      prisma.ordenServicio.count({
        where: {
          tenantId,
        },
      }),
      // Ingresos Hoy (Suma valorPagado de servicios con fecha visita hoy)
      prisma.ordenServicio.aggregate({
        where: {
          tenantId,
          fechaVisita: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          valorPagado: true,
        },
      }),
      // Ingresos Totales (Total histórico)
      prisma.ordenServicio.aggregate({
        where: {
          tenantId,
        },
        _sum: {
          valorPagado: true,
        },
      }),
      // Servicios más solicitados
      prisma.ordenServicio.groupBy({
        by: ['servicioId'],
        where: {
          tenantId,
        },
        _count: {
          servicioId: true,
        },
        orderBy: {
          _count: {
            servicioId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Fetch names for top services
    const topServiciosWithNames = await Promise.all(
      topServicios.map(async (item) => {
        const servicio = await prisma.servicio.findUnique({
          where: { id: item.servicioId },
          select: { nombre: true },
        });
        return {
          nombre: servicio?.nombre || "Desconocido",
          cantidad: item._count.servicioId,
        };
      })
    );

    return {
      stats: {
        serviciosAgendadosHoy,
        serviciosRealizadosHoy,
        serviciosEnProcesoHoy,
        serviciosEnProcesoTotal,
        serviciosRealizadosTotal,
        serviciosTotalesHistorico,
        ingresosHoy: Number(ingresosHoy._sum.valorPagado || 0),
        ingresosTotal: Number(ingresosTotal._sum.valorPagado || 0),
        topServicios: topServiciosWithNames,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { error: "Error al cargar estadísticas" };
  }
}

export async function getAllTenants(token: string) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
    return { tenants };
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return { error: "Error al cargar sistemas" };
  }
}

export async function switchUserTenant(token: string, newTenantId: number) {
  const payload = verifyToken(token);
  if (!payload) return { error: "No autorizado" };

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: newTenantId },
    });

    if (!tenant) return { error: "Sistema no encontrado" };

    await prisma.usuario.update({
      where: { id: payload.userId },
      data: { tenantId: newTenantId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error switching tenant:", error);
    return { error: "Error al cambiar de sistema" };
  }
}
