"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  User,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrdenesByDateRange } from "./actions";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface OrdenServicio {
  id: number;
  fechaVisita: Date | string | null;
  horaInicio: Date | string | null;
  horaFin: Date | string | null;
  direccionTexto: string;
  municipio: string | null;
  barrio: string | null;
  estado: string;
  cliente: { nombre: string | null; apellido: string | null };
  tecnico: { nombre: string; apellido: string } | null;
  servicio: { nombre: string };
  tipoServicio: { nombre: string; id: number } | null;
  empresa: { nombre: string } | null;
  zona: { nombre: string } | null;
}

export default function ProgramacionPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get start and end of week (Monday to Sunday)
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay(); // 0 is Sunday
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(currentDate), [currentDate]);

  const fetchOrdenes = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const result = await getOrdenesByDateRange(token, weekStart, weekEnd);
    if (result.error) {
      toast.error(result.error);
    } else if (result.ordenes) {
      setOrdenes(result.ordenes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrdenes();
  }, [weekStart, weekEnd]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the header
  const weekDays = useMemo(() => {
    const days = [];
    let day = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    return days;
  }, [weekStart]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "PROGRAMADO": return "bg-blue-100 text-blue-700 border-blue-200";
      case "EN_PROCESO": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "SERVICIO_LISTO": return "bg-green-100 text-green-700 border-green-200";
      case "CANCELADO": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Group orders by date (string key YYYY-MM-DD)
  const ordersByDate = useMemo(() => {
    const groups: Record<string, OrdenServicio[]> = {};
    ordenes.forEach(orden => {
      if (!orden.fechaVisita) return;
      const dateKey = new Date(orden.fechaVisita).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(orden);
    });
    return groups;
  }, [ordenes]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Programación de Servicios</h1>
            <p className="text-sm text-slate-600 mt-1">
              Organización semanal de visitas y servicios
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 font-medium text-sm">
              Hoy
            </Button>
            <div className="h-4 w-[1px] bg-slate-300 mx-1" />
            <span className="text-sm font-medium px-2 min-w-[140px] text-center">
              {weekStart.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          
          {/* Week Header */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4 md:mb-0 md:gap-px md:bg-slate-200 md:border md:border-slate-200 rounded-t-lg overflow-hidden flex-none">
             {weekDays.map((day, index) => {
               const isToday = new Date().toDateString() === day.toDateString();
               return (
                 <div key={index} className={cn(
                   "bg-white p-3 text-center md:text-left",
                   isToday ? "bg-blue-50" : ""
                 )}>
                   <span className="block text-xs font-semibold text-slate-500 uppercase">
                     {day.toLocaleDateString('es-CO', { weekday: 'short' })}
                   </span>
                   <div className={cn(
                     "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mt-1",
                     isToday ? "bg-blue-600 text-white" : "text-slate-900"
                   )}>
                     {day.getDate()}
                   </div>
                 </div>
               );
             })}
          </div>

          {/* Week Body (Events) */}
          <div className="flex-1 min-h-[500px] grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-px md:bg-slate-200 md:border-x md:border-b md:border-slate-200 rounded-b-lg overflow-hidden">
             {weekDays.map((day, index) => {
               const dateKey = day.toISOString().split('T')[0];
               const dayOrdenes = ordersByDate[dateKey] || [];
               const isToday = new Date().toDateString() === day.toDateString();

               return (
                 <div key={index} className={cn(
                   "bg-white min-h-[150px] md:min-h-0 p-2 space-y-2 overflow-y-auto",
                   isToday ? "bg-blue-50/30" : ""
                 )}>
                   {/* Mobile Day Label (visible only on small screens) */}
                   <div className="md:hidden font-bold text-slate-700 mb-2 border-b pb-1">
                     {day.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                   </div>

                   {loading ? (
                     <div className="space-y-2 opacity-50">
                       <div className="h-20 bg-slate-100 rounded-md animate-pulse" />
                     </div>
                   ) : dayOrdenes.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-300 text-xs italic py-10 md:py-0">
                         Sin servicios
                      </div>
                   ) : (
                     dayOrdenes.map((orden) => (
                       <Popover key={orden.id}>
                         <PopoverTrigger asChild>
                            <div className={cn(
                              "group relative p-2 rounded-md border text-left transition-all hover:shadow-md cursor-pointer",
                              getStatusColor(orden.estado)
                            )}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center text-xs font-bold">
                                  <Clock className="h-3 w-3 mr-1 opacity-70" />
                                  {orden.horaInicio ? new Date(orden.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '??:??'}
                                </div>
                                <MoreHorizontal className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              
                              <div className="font-semibold text-xs truncate leading-tight mb-1" title={orden.cliente.nombre + ' ' + orden.cliente.apellido}>
                                {orden.cliente.nombre} {orden.cliente.apellido}
                              </div>
                              
                              <div className="text-[10px] opacity-80 truncate flex items-center gap-1" title={orden.direccionTexto}>
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                {orden.barrio || orden.municipio || "Sin ubicación"}
                              </div>
                              
                              {orden.tecnico && (
                                <div className="mt-1.5 pt-1.5 border-t border-current/10 flex items-center gap-1 text-[10px] font-medium opacity-90">
                                   <User className="h-2.5 w-2.5" />
                                   <span className="truncate">{orden.tecnico.nombre}</span>
                                </div>
                              )}
                            </div>
                         </PopoverTrigger>
                         <PopoverContent className="w-80 p-0 overflow-hidden" align="start">
                            <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                               <span className="font-semibold text-sm">Detalle del Servicio</span>
                               <Badge variant="outline" className="text-xs">{orden.estado}</Badge>
                            </div>
                            <div className="p-4 space-y-3">
                               <div>
                                  <div className="text-xs text-slate-500">Cliente</div>
                                  <div className="font-medium text-sm">{orden.cliente.nombre} {orden.cliente.apellido}</div>
                               </div>
                               <div>
                                  <div className="text-xs text-slate-500">Servicio</div>
                                  <div className="font-medium text-sm">{orden.servicio.nombre}</div>
                                  <div className="text-xs text-slate-400">{orden.tipoServicio?.nombre}</div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                  <div>
                                     <div className="text-xs text-slate-500">Hora</div>
                                     <div className="font-medium text-sm flex items-center gap-1">
                                       <Clock className="h-3 w-3" />
                                       {orden.horaInicio ? new Date(orden.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} - 
                                       {orden.horaFin ? new Date(orden.horaFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                                     </div>
                                  </div>
                                  <div>
                                     <div className="text-xs text-slate-500">Técnico</div>
                                     <div className="font-medium text-sm">{orden.tecnico?.nombre || "Sin asignar"}</div>
                                  </div>
                               </div>
                               <div>
                                  <div className="text-xs text-slate-500">Dirección</div>
                                  <div className="font-medium text-sm flex items-start gap-1">
                                     <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                     <span className="text-xs leading-tight">{orden.direccionTexto}</span>
                                  </div>
                                  {(orden.barrio || orden.municipio) && (
                                    <div className="text-xs text-slate-400 ml-4 mt-0.5">
                                      {orden.barrio}, {orden.municipio}
                                    </div>
                                  )}
                               </div>
                               <div className="pt-2 flex justify-end">
                                  <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/servicios?view=${orden.id}`)}>
                                    Ver Completo
                                  </Button>
                               </div>
                            </div>
                         </PopoverContent>
                       </Popover>
                     ))
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
