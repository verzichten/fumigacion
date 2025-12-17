"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, ClipboardList, Calendar, CheckCircle, Clock, Trash2, Eye, User, MapPin, Filter, Edit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrdenesServicio, deleteOrdenServicio, getOrdenesStats, getOrdenServicio, getFormData } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrdenServicio {
  id: number;
  cliente: { 
    id: number;
    nombre: string | null; 
    apellido: string | null; 
    numeroDocumento: string | null;
    tipoDocumento: string | null;
    telefono: string | null;
    correo: string | null;
  };
  servicio: { nombre: string };
  tecnico: { nombre: string; apellido: string } | null;
  empresa: { id: number; nombre: string } | null;
  tipoServicio: { id: number; nombre: string } | null;
  creadoPor: { nombre: string; apellido: string } | null;
  zona: { nombre: string } | null;
  creadoPorId: number | null;
  estado: string;
  fechaVisita: Date | string | null;
  horaInicio: Date | string | null;
  valorCotizado: number | null;
  direccionTexto: string;
  numeroOrden: string | null;
  createdAt: Date | string;
  piso: string | null;
  bloque: string | null;
  unidad: string | null;
  barrio: string | null;
  municipio: string | null;
  departamento: string | null;
  observacion: string | null;
}

interface Stats {
  totalOrdenes: number;
  programadas: number;
  enProceso: number;
  finalizadas: number;
  noConcretados: number;
}

export default function ServiciosPage() {
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [ordenToDelete, setOrdenToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter states
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [tiposServicios, setTiposServicios] = useState<any[]>([]);
  const [creadores, setCreadores] = useState<any[]>([]); // New state
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<string>("all");
  const [selectedCreador, setSelectedCreador] = useState<string>("all"); // New state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const [ordenesRes, statsRes, formDataRes] = await Promise.all([
      getOrdenesServicio(token),
      getOrdenesStats(token),
      getFormData(token)
    ]);
    
    if (ordenesRes.error) {
      toast.error(ordenesRes.error);
      if (ordenesRes.error === "No autorizado") router.push("/sign-in");
    } else if (ordenesRes.ordenes) {
      setOrdenes(ordenesRes.ordenes);
    }

    if (statsRes.stats) {
      setStats(statsRes.stats);
    }

    if (formDataRes && !formDataRes.error) {
      setEmpresas(formDataRes.empresas || []);
      setTiposServicios(formDataRes.tiposServicios || []);
      setCreadores(formDataRes.creadores || []); // Set creators
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleViewOrden = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await getOrdenServicio(token, id);
    if (result.error) {
      toast.error(result.error);
    } else if (result.orden) {
      setSelectedOrden(result.orden);
      setIsViewModalOpen(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    setOrdenToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!ordenToDelete) return;

    setIsDeleting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setIsDeleting(false);
      return;
    }

    const result = await deleteOrdenServicio(token, ordenToDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      setOrdenes(ordenes.filter(o => o.id !== ordenToDelete));
      setIsDeleteModalOpen(false);
      setOrdenToDelete(null);
      fetchData(); // Refresh stats
    }
    setIsDeleting(false);
  };

  const filteredTiposServicios = tiposServicios.filter(tipo => 
    selectedEmpresa === "all" || !tipo.empresaId || tipo.empresaId.toString() === selectedEmpresa
  );

  const filteredOrdenes = ordenes.filter((orden) => {
    const search = searchTerm.toLowerCase();
    const numeroDocumento = orden.cliente.numeroDocumento?.toLowerCase() || "";
    const telefono = orden.cliente.telefono?.toLowerCase() || "";
    const matchesSearch = numeroDocumento.includes(search) || telefono.includes(search);
    const matchesEmpresa = selectedEmpresa === "all" || (orden.empresa?.id.toString() === selectedEmpresa);
    const matchesTipo = selectedTipoServicio === "all" || (orden.tipoServicio?.id.toString() === selectedTipoServicio);
    const matchesCreador = selectedCreador === "all" || (orden.creadoPorId?.toString() === selectedCreador);

    const orderFechaVisita = orden.fechaVisita ? new Date(orden.fechaVisita) : null;
    const filterStartDate = startDate ? new Date(startDate) : null;
    const filterEndDate = endDate ? new Date(endDate) : null;

    const matchesStartDate = !filterStartDate || (orderFechaVisita && orderFechaVisita >= filterStartDate);
    const matchesEndDate = !filterEndDate || (orderFechaVisita && orderFechaVisita <= filterEndDate);


    return matchesSearch && matchesEmpresa && matchesTipo && matchesCreador && matchesStartDate && matchesEndDate;
  });

  const handleEmpresaChange = (value: string) => {
    setSelectedEmpresa(value);
    setSelectedTipoServicio("all"); // Reset service type when company changes
  };

  const handleExportExcel = async () => {
    if (filteredOrdenes.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Servicios");

    // Define columns
    worksheet.columns = [
      { header: "Nro. Orden", key: "nroOrden", width: 15 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Fecha Creación", key: "fechaCreacion", width: 20 },
      { header: "Empresa", key: "empresa", width: 20 },
      { header: "Cliente", key: "cliente", width: 25 },
      { header: "Documento Cliente", key: "documentoCliente", width: 20 },
      { header: "Teléfono Cliente", key: "telefonoCliente", width: 15 },
      { header: "Correo Cliente", key: "correoCliente", width: 25 },
      { header: "Servicio", key: "servicio", width: 20 },
      { header: "Tipo Servicio", key: "tipoServicio", width: 20 },
      { header: "Zona", key: "zona", width: 15 },
      { header: "Técnico (Fumigador)", key: "tecnico", width: 25 },
      { header: "Creado Por", key: "creadoPor", width: 20 },
      { header: "Dirección", key: "direccion", width: 30 },
      { header: "Municipio", key: "municipio", width: 15 },
      { header: "Departamento", key: "departamento", width: 15 },
      { header: "Barrio", key: "barrio", width: 15 },
      { header: "Unidad", key: "unidad", width: 10 },
      { header: "Bloque", key: "bloque", width: 10 },
      { header: "Piso", key: "piso", width: 10 },
      { header: "Fecha Visita", key: "fechaVisita", width: 15 },
      { header: "Hora Visita", key: "horaVisita", width: 15 },
      { header: "Valor Cotizado", key: "valorCotizado", width: 15 },
      { header: "Observaciones", key: "observaciones", width: 30 },
    ];

    // Add rows
    filteredOrdenes.forEach((orden) => {
      worksheet.addRow({
        nroOrden: orden.numeroOrden || `INT-${orden.id}`,
        estado: orden.estado,
        fechaCreacion: new Date(orden.createdAt).toLocaleString("es-CO"),
        empresa: orden.empresa?.nombre || "N/A",
        cliente: `${orden.cliente.nombre || ""} ${orden.cliente.apellido || ""}`.trim(),
        documentoCliente: `${orden.cliente.tipoDocumento || ""} ${orden.cliente.numeroDocumento || ""}`.trim(),
        telefonoCliente: orden.cliente.telefono || "N/A",
        correoCliente: orden.cliente.correo || "N/A",
        servicio: orden.servicio.nombre,
        tipoServicio: orden.tipoServicio?.nombre || "N/A",
        zona: orden.zona?.nombre || "N/A",
        tecnico: orden.tecnico ? `${orden.tecnico.nombre} ${orden.tecnico.apellido}` : "Sin asignar",
        creadoPor: orden.creadoPor ? `${orden.creadoPor.nombre} ${orden.creadoPor.apellido}` : "Sistema",
        direccion: orden.direccionTexto,
        municipio: orden.municipio || "",
        departamento: orden.departamento || "",
        barrio: orden.barrio || "",
        unidad: orden.unidad || "",
        bloque: orden.bloque || "",
        piso: orden.piso || "",
        fechaVisita: orden.fechaVisita ? new Date(orden.fechaVisita).toLocaleDateString("es-CO") : "Sin programar",
        horaVisita: orden.horaInicio ? new Date(orden.horaInicio).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "",
        valorCotizado: orden.valorCotizado || 0,
        observaciones: orden.observacion || "",
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" }, // Blue color
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Style data rows (borders)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", wrapText: true };
        });
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Reporte_Servicios_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "SERVICIO_NUEVO": return <Badge variant="secondary">Nuevo</Badge>;
      case "PROGRAMADO": return <Badge className="bg-blue-500 hover:bg-blue-600">Programado</Badge>;
      case "EN_PROCESO": return <Badge className="bg-yellow-500 hover:bg-yellow-600">En Proceso</Badge>;
      case "SERVICIO_LISTO": return <Badge className="bg-green-500 hover:bg-green-600">Finalizado</Badge>;
      case "CANCELADO": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Órdenes de Servicio</h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona los servicios programados y realizados
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleExportExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button 
              onClick={() => router.push("/dashboard/servicios/nuevo")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="flex-none px-8 py-6 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrdenes}</div>
                <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Programadas</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.programadas}</div>
                <p className="text-xs text-muted-foreground">Pendientes de visita</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.enProceso}</div>
                <p className="text-xs text-muted-foreground">Ejecutándose actualmente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.finalizadas}</div>
                <p className="text-xs text-muted-foreground">Servicios completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No Concretados</CardTitle>
                <Trash2 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.noConcretados}</div>
                <p className="text-xs text-muted-foreground">Servicios no realizados</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex-none px-8 py-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="relative max-w-md w-full md:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por documento o teléfono de cliente..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <Select value={selectedEmpresa} onValueChange={handleEmpresaChange}>
              <SelectTrigger className="w-full md:w-[180px] bg-white">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedTipoServicio} 
              onValueChange={setSelectedTipoServicio}
              disabled={selectedEmpresa === "all" && filteredTiposServicios.length === tiposServicios.length}
            >
              <SelectTrigger className="w-full md:w-[180px] bg-white">
                <SelectValue placeholder="Tipo de Servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {filteredTiposServicios.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCreador} onValueChange={setSelectedCreador}>
              <SelectTrigger className="w-full md:w-[180px] bg-white">
                <SelectValue placeholder="Creado por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los creadores</SelectItem>
                {creadores.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.nombre} {user.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-200">
              <span className="text-xs text-slate-500 whitespace-nowrap pl-2">Fechas:</span>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                title="Fecha de inicio del rango" 
                className="w-[130px] border-0 focus-visible:ring-0 h-8 p-1" 
              />
              <span className="text-slate-300">-</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                title="Fecha de fin del rango" 
                className="w-[130px] border-0 focus-visible:ring-0 h-8 p-1" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-slate-50 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrdenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
              <ClipboardList className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">No se encontraron órdenes</p>
              <p className="text-sm">Intenta ajustar los filtros o crea una nueva orden</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="px-6 py-4">Cliente / Dirección</th>
                    <th className="px-6 py-4">Servicio</th>
                    <th className="px-6 py-4">Programación</th>
                    <th className="px-6 py-4">Tipo Servicio</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrdenes.map((orden) => (
                    <tr
                      key={orden.id}
                      className="hover:bg-slate-50 transition-colors"
                    ><td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {orden.cliente.nombre} {orden.cliente.apellido}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{orden.direccionTexto}</span>
                          </div>
                        </div>
                      </td><td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium">{orden.servicio.nombre}</span>
                          <span className="text-xs text-slate-500">{orden.empresa?.nombre}</span>
                        </div>
                      </td><td className="px-6 py-4">
                        <div className="flex flex-col text-slate-600">
                          {orden.fechaVisita ? (
                             <>
                               <span>{new Date(orden.fechaVisita).toLocaleDateString()}</span>
                               <span className="text-xs text-slate-400">
                                 {orden.horaInicio ? new Date(orden.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                               </span>
                             </>
                          ) : (
                             <span className="italic text-slate-400">Sin agendar</span>
                          )}
                        </div>
                      </td><td className="px-6 py-4">
                        <span className="text-slate-900 font-medium">{orden.tipoServicio?.nombre || 'N/A'}</span>
                      </td><td className="px-6 py-4">
                        {getStatusBadge(orden.estado)}
                      </td><td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200"
                            onClick={() => handleViewOrden(orden.id)}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200"
                            onClick={() => router.push(`/dashboard/servicios/${orden.id}/editar`)}
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(orden.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle Completo */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle Completo de Orden</DialogTitle>
            <DialogDescription>
              Información detallada del servicio registrado
            </DialogDescription>
          </DialogHeader>

          {selectedOrden && (
            <div className="space-y-6 mt-2">
              {/* 1. Información General */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Información General
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">ID Interno</span>
                    <span className="font-medium">#{selectedOrden.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Número Orden</span>
                    <span className="font-medium">{selectedOrden.numeroOrden || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Estado Actual</span>
                    <div className="mt-0.5">{getStatusBadge(selectedOrden.estado)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Fecha Creación</span>
                    <span className="font-medium text-sm">
                      {new Date(selectedOrden.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                   <div>
                    <span className="text-xs text-slate-500 block">Creado Por</span>
                    <span className="font-medium text-sm">
                       {selectedOrden.creadoPor ? `${selectedOrden.creadoPor.nombre} ${selectedOrden.creadoPor.apellido}` : "Sistema"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Cliente y Contacto */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Cliente y Contacto
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-xs text-slate-500 block">Nombre Completo</span>
                    <span className="font-medium text-base">
                      {selectedOrden.cliente?.nombre} {selectedOrden.cliente?.apellido}
                    </span>
                  </div>
                  <div>
                     <span className="text-xs text-slate-500 block">Documento</span>
                     <span className="font-medium">
                       {selectedOrden.cliente?.tipoDocumento} {selectedOrden.cliente?.numeroDocumento}
                     </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Teléfono</span>
                    <span className="font-medium">{selectedOrden.cliente?.telefono}</span>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-xs text-slate-500 block">Correo Electrónico</span>
                    <span className="font-medium text-sm">{selectedOrden.cliente?.correo || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Ubicación del Servicio */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Ubicación del Servicio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <span className="text-xs text-slate-500 block">Dirección Principal</span>
                    <span className="font-medium text-base flex items-center gap-2">
                       <MapPin className="h-4 w-4 text-blue-500" />
                       {selectedOrden.direccionTexto}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Municipio / Depto</span>
                    <span className="font-medium">
                      {selectedOrden.municipio || "N/A"}
                      {selectedOrden.departamento && `, ${selectedOrden.departamento}`}
                    </span>
                  </div>
                  <div>
                     <span className="text-xs text-slate-500 block">Zona</span>
                     <span className="font-medium">{selectedOrden.zona?.nombre || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Barrio</span>
                    <span className="font-medium">{selectedOrden.barrio || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Detalles Interior</span>
                    <span className="text-sm font-medium">
                        {[
                          selectedOrden.bloque && `Bloque: ${selectedOrden.bloque}`,
                          selectedOrden.piso && `Piso: ${selectedOrden.piso}`,
                          selectedOrden.unidad && `Unidad: ${selectedOrden.unidad}`
                        ].filter(Boolean).join(" - ") || "Sin detalles"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Detalle del Servicio */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Detalle del Servicio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Empresa</span>
                    <span className="font-medium">{selectedOrden.empresa?.nombre || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tipo de Servicio</span>
                    <span className="font-medium">{selectedOrden.tipoServicio?.nombre || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Servicio Específico</span>
                    <span className="font-medium">{selectedOrden.servicio?.nombre || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Técnico Asignado</span>
                    <span className="font-medium">
                      {selectedOrden.tecnico 
                        ? `${selectedOrden.tecnico.nombre} ${selectedOrden.tecnico.apellido}` 
                        : <span className="text-orange-500 italic">Sin asignar</span>
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Programación */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Programación
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-blue-50 p-3 rounded-lg">
                   <div>
                    <span className="text-xs text-slate-500 block">Fecha de Visita</span>
                    <span className="font-medium">
                      {selectedOrden.fechaVisita 
                        ? new Date(selectedOrden.fechaVisita).toLocaleDateString()
                        : "N/A"
                      }
                    </span>
                   </div>
                   <div>
                    <span className="text-xs text-slate-500 block">Hora Inicio</span>
                    <span className="font-medium">
                      {selectedOrden.horaInicio 
                        ? new Date(selectedOrden.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : "--:--"
                      }
                    </span>
                   </div>
                   <div>
                    <span className="text-xs text-slate-500 block">Hora Fin</span>
                    <span className="font-medium">
                      {selectedOrden.horaFin 
                        ? new Date(selectedOrden.horaFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : "--:--"
                      }
                    </span>
                   </div>
                </div>
              </div>

              {/* 6. Condiciones y Observaciones */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  Estado y Observaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Nivel Infestación</span>
                    <span className="font-medium">{selectedOrden.nivelInfestacion || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Cond. Higiene</span>
                    <span className="font-medium">{selectedOrden.condicionesHigiene || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Cond. Local</span>
                    <span className="font-medium">{selectedOrden.condicionesLocal || "N/A"}</span>
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <span className="text-xs text-slate-500 block mb-1">Observaciones Generales</span>
                    <p className="text-sm bg-slate-50 p-3 rounded-md border border-slate-100 min-h-[60px]">
                      {selectedOrden.observacion || "Sin observaciones registradas."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. Información Financiera */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                   Información Financiera
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Valor Cotizado</span>
                    <span className="font-bold text-slate-900">
                      {selectedOrden.valorCotizado 
                        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(selectedOrden.valorCotizado) 
                        : "$ 0"
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Valor Repuestos</span>
                    <span className="font-medium">
                      {selectedOrden.valorRepuestos 
                        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(selectedOrden.valorRepuestos) 
                        : "$ 0"
                      }
                    </span>
                  </div>
                   <div>
                    <span className="text-xs text-slate-500 block">Valor Pagado</span>
                    <span className="font-medium text-green-600">
                      {selectedOrden.valorPagado 
                        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(selectedOrden.valorPagado) 
                        : "$ 0"
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Método de Pago</span>
                    <span className="font-medium">{selectedOrden.metodoPago?.nombre || "N/A"}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Eliminación */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la orden de servicio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}