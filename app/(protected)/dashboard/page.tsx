"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Activity, 
  TrendingUp,
  Briefcase,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "./actions";
import { toast } from "sonner";

interface DashboardStats {
  serviciosAgendadosHoy: number;
  serviciosRealizadosHoy: number;
  serviciosEnProcesoHoy: number;
  serviciosEnProcesoTotal: number;
  serviciosRealizadosTotal: number;
  serviciosTotalesHistorico: number;
  ingresosHoy: number;
  ingresosTotal: number;
  topServicios: { nombre: string; cantidad: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const result = await getDashboardStats(token);
      if (result.error) {
        toast.error(result.error);
        if (result.error === "No autorizado") router.push("/sign-in");
      } else if (result.stats) {
        setStats(result.stats);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      </div>

      {stats && (
        <div className="space-y-8">
          {/* Section: Resumen de Hoy */}
          <div>
            <h3 className="text-lg font-medium text-slate-600 mb-4">Resumen de Hoy</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Servicios Agendados
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosAgendadosHoy}</div>
                  <p className="text-xs text-muted-foreground">
                    Para el día de hoy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    En Proceso (Hoy)
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosEnProcesoHoy}</div>
                  <p className="text-xs text-muted-foreground">
                    Actualmente en ejecución
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Realizados Hoy
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosRealizadosHoy}</div>
                  <p className="text-xs text-muted-foreground">
                    Completados exitosamente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Hoy
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.ingresosHoy)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total recaudado hoy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section: Estadísticas Globales */}
          <div>
             <h3 className="text-lg font-medium text-slate-600 mb-4">Estadísticas Globales</h3>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    En Proceso (Total)
                  </CardTitle>
                  <Activity className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosEnProcesoTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    Total órdenes activas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Realizados (Histórico)
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosRealizadosTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    Total servicios finalizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Servicios Totales
                  </CardTitle>
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.serviciosTotalesHistorico}</div>
                  <p className="text-xs text-muted-foreground">
                    Histórico de órdenes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Totales
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-700" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(stats.ingresosTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total histórico recaudado
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section: Top Servicios */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Servicios Más Solicitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topServicios.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay datos suficientes aún.</p>
                  ) : (
                    stats.topServicios.map((servicio, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                              {servicio.nombre}
                            </p>
                            <span className="text-sm font-bold text-muted-foreground">
                              {servicio.cantidad}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ 
                                width: `${(servicio.cantidad / Math.max(...stats.topServicios.map(s => s.cantidad))) * 100}%` 
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Placeholder for future charts or notifications */}
            <Card className="col-span-3">
               <CardHeader>
                 <CardTitle>Accesos Rápidos</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors"
                      onClick={() => router.push('/dashboard/servicios/nuevo')}
                    >
                       <span className="block font-semibold text-slate-700">Nueva Orden</span>
                       <span className="text-xs text-slate-500">Registrar servicio</span>
                    </button>
                    <button 
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors"
                      onClick={() => router.push('/dashboard/clientes/nuevo')}
                    >
                       <span className="block font-semibold text-slate-700">Nuevo Cliente</span>
                       <span className="text-xs text-slate-500">Registrar cliente</span>
                    </button>
                    <button 
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors"
                      onClick={() => router.push('/dashboard/servicios/programacion')}
                    >
                       <span className="block font-semibold text-slate-700">Agenda</span>
                       <span className="text-xs text-slate-500">Ver programación</span>
                    </button>
                    <button 
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-left transition-colors"
                      onClick={() => router.push('/dashboard/usuarios/tecnicos')}
                    >
                       <span className="block font-semibold text-slate-700">Técnicos</span>
                       <span className="text-xs text-slate-500">Gestionar equipo</span>
                    </button>
                 </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}