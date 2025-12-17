"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, User, FileText, Phone, Mail, MapPin, Eye, Trash2, Edit, Users, Building2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientes, getCliente, deleteCliente, getClientesStats } from "./actions";
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

interface Cliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string;
  correo: string | null;
  createdAt: Date;
  direcciones: {
    direccion: string;
    municipio: string | null;
    barrio: string | null;
    piso: string | null;
    bloque: string | null;
    unidad: string | null;
  }[];
}

interface Stats {
  totalClientes: number;
  municipios: { nombre: string; cantidad: number }[];
  barrios: { nombre: string; cantidad: number }[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const fetchClientes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    // Fetch clients and stats in parallel
    const [clientesRes, statsRes] = await Promise.all([
      getClientes(token),
      getClientesStats(token)
    ]);
    
    if (clientesRes.error) {
      toast.error(clientesRes.error);
      if (clientesRes.error === "No autorizado") {
        router.push("/sign-in");
      }
    } else if (clientesRes.clientes) {
      setClientes(clientesRes.clientes);
    }

    if (statsRes.stats) {
      setStats(statsRes.stats);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, [router]);

  const handleViewCliente = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await getCliente(token, id);
    if (result.error) {
      toast.error(result.error);
    } else if (result.cliente) {
      setSelectedCliente(result.cliente);
      setIsViewModalOpen(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    setIsDeleting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setIsDeleting(false);
      return;
    }

    const result = await deleteCliente(token, clientToDelete);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      // Actualizar la lista localmente
      setClientes(clientes.filter(c => c.id !== clientToDelete));
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
    setIsDeleting(false);
  };

  const filteredClientes = clientes.filter((cliente) => {
    const search = searchTerm.toLowerCase();
    const fullName = `${cliente.nombre || ""} ${cliente.apellido || ""}`.toLowerCase();
    const documento = cliente.numeroDocumento?.toLowerCase() || "";
    const telefono = cliente.telefono?.toLowerCase() || "";
    
    return fullName.includes(search) || documento.includes(search) || telefono.includes(search);
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona tu base de datos de clientes
            </p>
          </div>
          <Button 
            onClick={() => router.push("/dashboard/clientes/nuevo")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="flex-none px-8 py-6 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClientes}</div>
                <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Municipios Frecuentes</CardTitle>
                <Map className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.municipios.length > 0 ? (
                    stats.municipios.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{m.nombre}</span>
                        <span className="font-bold">{m.cantidad}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin datos registrados</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Barrios Frecuentes</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.barrios.length > 0 ? (
                    stats.barrios.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{b.nombre}</span>
                        <span className="font-bold">{b.cantidad}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin datos registrados</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex-none px-8 py-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, documento o teléfono..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          ) : filteredClientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
              <User className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">No se encontraron clientes</p>
              <p className="text-sm">Agrega un nuevo cliente para comenzar</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Documento</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Ubicación</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClientes.map((cliente) => (
                    <tr 
                      key={cliente.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
                            {cliente.nombre?.[0]?.toUpperCase()}{cliente.apellido?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {cliente.nombre} {cliente.apellido}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">
                              Registrado el {new Date(cliente.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{cliente.numeroDocumento}</span>
                            <span className="text-xs text-slate-500">{cliente.tipoDocumento}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{cliente.telefono}</span>
                          </div>
                          {cliente.correo && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{cliente.correo}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cliente.direcciones[0] ? (
                          <div className="flex items-start gap-2 text-slate-600 max-w-[200px]">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 text-sm">
                              {cliente.direcciones[0].direccion}
                              {cliente.direcciones[0].municipio && `, ${cliente.direcciones[0].municipio}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Sin dirección</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200"
                            onClick={() => handleViewCliente(cliente.id)}
                          >
                            <Eye className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteClick(cliente.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:bg-slate-200"
                            onClick={() => router.push(`/dashboard/clientes/${cliente.id}/editar`)}
                          >
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>
              Información completa registrada en el sistema
            </DialogDescription>
          </DialogHeader>

          {selectedCliente && (
            <div className="space-y-6 mt-4">
              {/* Información Personal */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider border-b pb-2">
                  Información Personal
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500 block">Nombre Completo</span>
                    <span className="text-base font-medium text-slate-900">
                      {selectedCliente.nombre} {selectedCliente.apellido}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 block">Documento</span>
                    <span className="text-base font-medium text-slate-900">
                      {selectedCliente.tipoDocumento}: {selectedCliente.numeroDocumento}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider border-b pb-2">
                  Contacto
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500 block">Teléfono</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-base font-medium text-slate-900">{selectedCliente.telefono}</span>
                    </div>
                  </div>
                  {selectedCliente.correo && (
                    <div>
                      <span className="text-sm text-slate-500 block">Correo Electrónico</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-base font-medium text-slate-900">{selectedCliente.correo}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Direcciones */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider border-b pb-2">
                  Direcciones Registradas ({selectedCliente.direcciones.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedCliente.direcciones.map((direccion, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{direccion.direccion}</p>
                          <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                            {direccion.municipio && <span>{direccion.municipio}</span>}
                            {direccion.barrio && <span>Barrio: {direccion.barrio}</span>}
                          </div>
                          {(direccion.bloque || direccion.unidad || direccion.piso) && (
                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 mt-1">
                              {direccion.bloque && <span>Bloque: {direccion.bloque}</span>}
                              {direccion.piso && <span>Piso: {direccion.piso}</span>}
                              {direccion.unidad && <span>Unidad: {direccion.unidad}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400 text-right">
                  Registrado el {new Date(selectedCliente.createdAt).toLocaleDateString()}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todas sus direcciones asociadas.
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