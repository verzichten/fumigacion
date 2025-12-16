"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Wrench,
  Calendar,
  DollarSign,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { municipiosAntioquia } from "@/lib/constants/municipios";
import { getFormData, updateOrdenServicio, addDireccionToCliente, getOrdenServicio } from "../../actions";

export default function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ordenId = Number(resolvedParams.id);

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Data State
  const [clientes, setClientes] = useState<any[]>([]);
  const [tiposServicios, setTiposServicios] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [zonas, setZonas] = useState<any[]>([]);
  const [metodosPago, setMetodosPago] = useState<any[]>([]);

  // Selection State
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [clientAddresses, setClientAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  
  // Form specific state for edit
  const [ordenData, setOrdenData] = useState<any>(null);

  // New Address State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    direccion: "",
    municipio: "",
    barrio: "",
    piso: "",
    bloque: "",
    unidad: ""
  });

  const prevClientIdRef = useRef(selectedClienteId);
  const router = useRouter();

  // Filter services based on selected company
  const filteredServicios = servicios.filter(s => 
    !s.empresaId || (selectedEmpresaId && s.empresaId.toString() === selectedEmpresaId)
  );

  // Filter service types based on selected company
  const filteredTiposServicios = tiposServicios.filter(t => 
    !t.empresaId || (selectedEmpresaId && t.empresaId.toString() === selectedEmpresaId)
  );

  // Filter technicians based on selected company
  const filteredTecnicos = tecnicos.filter(t => 
    !t.empresaId || (selectedEmpresaId && t.empresaId.toString() === selectedEmpresaId)
  );

  // Prepare client options for Combobox
  const clientOptions = clientes.map(c => ({
    value: c.id.toString(),
    label: `(${c.numeroDocumento || 'S/N'}) ${c.nombre || ''} ${c.apellido || ''}`.trim()
  }));

  const municipiosOptions = municipiosAntioquia.map((m) => ({
    value: m.nombre,
    label: m.nombre,
  }));

  const barriosOptions = newAddress.municipio 
    ? municipiosAntioquia.find(m => m.nombre === newAddress.municipio)?.barrios.map(b => ({ value: b, label: b })) || []
    : [];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const [formDataRes, ordenRes] = await Promise.all([
        getFormData(token),
        getOrdenServicio(token, ordenId)
      ]);
      
      if (formDataRes.error) {
        toast.error(formDataRes.error);
        return;
      }

      if (ordenRes.error || !ordenRes.orden) {
        toast.error(ordenRes.error || "Error cargando orden");
        router.push("/dashboard/servicios");
        return;
      }

      setClientes(formDataRes.clientes || []);
      setTiposServicios(formDataRes.tiposServicios || []);
      setServicios(formDataRes.servicios || []);
      setTecnicos(formDataRes.tecnicos || []);
      setEmpresas(formDataRes.empresas || []);
      setZonas(formDataRes.zonas || []);
      setMetodosPago(formDataRes.metodosPago || []);
      
      // Set initial values from orden
      const orden = ordenRes.orden;
      setOrdenData(orden);
      setSelectedClienteId(orden.clienteId.toString());
      setSelectedEmpresaId(orden.empresaId?.toString() || "");
      setSelectedAddressId(orden.direccionId?.toString() || "");
      
      // Pre-load addresses for this client immediately
      const client = formDataRes.clientes?.find((c: any) => c.id === orden.clienteId);
      if (client) {
          setClientAddresses(client.direcciones || []);
      }

      setLoadingData(false);
    };

    fetchData();
  }, [router, ordenId]);

  // Update addresses when client changes (user interaction)
  useEffect(() => {
    if (!loadingData && selectedClienteId) {
      const client = clientes.find(c => c.id.toString() === selectedClienteId);
      setClientAddresses(client?.direcciones || []);
      
      // Reset address if client changed by user (not initial load)
      if (prevClientIdRef.current !== selectedClienteId && prevClientIdRef.current !== "") {
        setSelectedAddressId("");
      }
      prevClientIdRef.current = selectedClienteId;
    } else if (!loadingData) {
      setClientAddresses([]);
    }
  }, [selectedClienteId, clientes, loadingData]);

  const handleAddressSelect = (value: string) => {
    if (value === "nueva_direccion") {
      setIsAddressModalOpen(true);
    } else {
      setSelectedAddressId(value);
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddress.direccion) {
      toast.error("La dirección es obligatoria");
      return;
    }

    setSavingAddress(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await addDireccionToCliente(token, Number(selectedClienteId), newAddress);

    if (result.error) {
      toast.error(result.error);
    } else if (result.direccion) {
      toast.success("Dirección agregada exitosamente");
      const updatedAddresses = [...clientAddresses, result.direccion];
      setClientAddresses(updatedAddresses);
      
      setClientes(clientes.map(c => 
        c.id.toString() === selectedClienteId 
          ? { ...c, direcciones: updatedAddresses } 
          : c
      ));

      setSelectedAddressId(result.direccion.id.toString());
      setIsAddressModalOpen(false);
      setNewAddress({
        direccion: "",
        municipio: "",
        barrio: "",
        piso: "",
        bloque: "",
        unidad: ""
      });
    }
    setSavingAddress(false);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    
    const formData = new FormData(event.currentTarget);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No se encontró sesión activa");
      setSaving(false);
      return;
    }

    if (selectedClienteId) formData.set("cliente", selectedClienteId);
    if (selectedAddressId) formData.set("direccionCliente", selectedAddressId);

    if (selectedEmpresaId !== "2") {
        formData.delete("valorRepuestos");
    }

    const result = await updateOrdenServicio(token, ordenId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      router.push("/dashboard/servicios");
    }
    setSaving(false);
  }

  if (loadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header fijo */}
      <div className="flex-none bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/servicios")}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Editar Orden de Servicio #{ordenId}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Modifique los detalles del servicio
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/servicios")}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="flex-1 bg-white px-8 py-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
          {/* Sección: Información del Cliente */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Información del Cliente
                </h2>
                <p className="text-sm text-slate-600">
                  Datos del cliente y ubicación
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="cliente"
                  className="text-sm font-medium text-slate-700"
                >
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <Combobox
                  options={clientOptions}
                  value={selectedClienteId}
                  onChange={setSelectedClienteId}
                  placeholder="Buscar cliente..."
                  emptyMessage="No se encontraron clientes."
                />
                <input type="hidden" name="cliente" value={selectedClienteId} />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="direccionCliente"
                  className="text-sm font-medium text-slate-700"
                >
                  Dirección del Cliente <span className="text-red-500">*</span>
                </Label>
                <Select
                    key={selectedAddressId}
                    name="direccionCliente"
                    value={selectedAddressId}
                    onValueChange={handleAddressSelect}
                    required
                    disabled={!selectedClienteId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={selectedClienteId ? "Seleccione una dirección" : "Seleccione un cliente primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientAddresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id.toString()}>
                        {addr.direccion} {addr.municipio ? `(${addr.municipio})` : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="nueva_direccion" className="text-blue-600 font-medium">
                        <span className="flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Agregar nueva dirección
                        </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sección: Detalles del Servicio */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <Wrench className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Detalles del Servicio
                </h2>
                <p className="text-sm text-slate-600">
                  Configure el tipo y las características del servicio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="empresa"
                  className="text-sm font-medium text-slate-700"
                >
                  Empresa Asociada
                </Label>
                <Select 
                  name="empresa" 
                  onValueChange={setSelectedEmpresaId}
                  value={selectedEmpresaId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tipoServicio"
                  className="text-sm font-medium text-slate-700"
                >
                  Tipo de Servicio <span className="text-red-500">*</span>
                </Label>
                <Select name="tipoServicio" required disabled={!selectedEmpresaId} defaultValue={ordenData?.tipoServicioId?.toString()}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={selectedEmpresaId ? "Seleccione el tipo" : "Seleccione una empresa primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTiposServicios.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="servicio"
                  className="text-sm font-medium text-slate-700"
                >
                  Servicio Específico <span className="text-red-500">*</span>
                </Label>
                <Select name="servicio" required disabled={!selectedEmpresaId} defaultValue={ordenData?.servicioId?.toString()}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={selectedEmpresaId ? "Seleccione un servicio" : "Seleccione una empresa primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServicios.map((serv) => (
                      <SelectItem key={serv.id} value={serv.id.toString()}>
                        {serv.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tecnico"
                  className="text-sm font-medium text-slate-700"
                >
                  Técnico Asignado
                </Label>
                <Select name="tecnico" disabled={!selectedEmpresaId} defaultValue={ordenData?.tecnicoId?.toString()}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={selectedEmpresaId ? "Seleccione un técnico" : "Seleccione una empresa primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTecnicos.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.nombre} {tech.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="zona"
                  className="text-sm font-medium text-slate-700"
                >
                  Zona
                </Label>
                <Select name="zona" defaultValue={ordenData?.zonaId?.toString()}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione una zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((z) => (
                      <SelectItem key={z.id} value={z.id.toString()}>
                        {z.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="observacion"
                className="text-sm font-medium text-slate-700"
              >
                Observaciones
              </Label>
              <Textarea
                id="observacion"
                name="observacion"
                placeholder="Notas adicionales sobre el servicio"
                rows={3}
                defaultValue={ordenData?.observacion || ""}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Sección: Fechas y Horarios */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Fechas y Horarios
                </h2>
                <p className="text-sm text-slate-600">
                  Agende la visita del servicio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="fechaVisita"
                  className="text-sm font-medium text-slate-700"
                >
                  Fecha de Visita
                </Label>
                <Input
                  id="fechaVisita"
                  name="fechaVisita"
                  type="date"
                  className="h-11"
                  defaultValue={ordenData?.fechaVisita ? new Date(ordenData.fechaVisita).toISOString().split('T')[0] : ""}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="horaInicio"
                  className="text-sm font-medium text-slate-700"
                >
                  Hora de Inicio Estimada (24h)
                </Label>
                <Input
                  id="horaInicio"
                  name="horaInicio"
                  type="time"
                  className="h-11"
                  defaultValue={ordenData?.horaInicio ? new Date(ordenData.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : ""}
                />
              </div>
            </div>
          </div>

          {/* Sección: Información de Pago y Estado */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Pago y Estado
                </h2>
                <p className="text-sm text-slate-600">
                  Detalles financieros y estado de la orden
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="valorCotizado"
                  className="text-sm font-medium text-slate-700"
                >
                  Valor Cotizado
                </Label>
                <Input
                  id="valorCotizado"
                  name="valorCotizado"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-11"
                  defaultValue={ordenData?.valorCotizado || ""}
                />
              </div>

              {selectedEmpresaId === "2" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="valorRepuestos"
                    className="text-sm font-medium text-slate-700"
                  >
                    Valor Repuestos
                  </Label>
                  <Input
                    id="valorRepuestos"
                    name="valorRepuestos"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="h-11"
                    defaultValue={ordenData?.valorRepuestos || 0}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="metodoPago"
                  className="text-sm font-medium text-slate-700"
                >
                  Método de Pago
                </Label>
                <Select name="metodoPago" defaultValue={ordenData?.metodoPagoId?.toString()}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione un método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPago.map((mp) => (
                      <SelectItem key={mp.id} value={mp.id.toString()}>
                        {mp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="estado"
                  className="text-sm font-medium text-slate-700"
                >
                  Estado del Servicio
                </Label>
                <Select name="estado" defaultValue={ordenData?.estado || "SERVICIO_NUEVO"}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICIO_NUEVO">Nuevo Servicio</SelectItem>
                    <SelectItem value="PROGRAMADO">Programado</SelectItem>
                    <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                    <SelectItem value="SERVICIO_LISTO">Servicio Listo</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-red-500">*</span>
              <span>Campos obligatorios</span>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/servicios")}
                disabled={saving}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 min-w-[160px]"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Actualizar Orden
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Dirección</DialogTitle>
            <DialogDescription>
              Registre una nueva dirección para el cliente seleccionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Dirección Principal <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newAddress.direccion}
                onChange={(e) => setNewAddress({...newAddress, direccion: e.target.value})}
                placeholder="Ej. Calle 123 # 45 - 67"
                className="bg-white h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Municipio
                </Label>
                <Combobox
                  options={municipiosOptions}
                  value={newAddress.municipio}
                  onChange={(value) => setNewAddress({...newAddress, municipio: value, barrio: ""})}
                  placeholder="Seleccionar..."
                  emptyMessage="Municipio no encontrado"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Barrio
                </Label>
                <Combobox
                  options={barriosOptions}
                  value={newAddress.barrio}
                  onChange={(value) => setNewAddress({...newAddress, barrio: value})}
                  placeholder="Seleccionar..."
                  emptyMessage="Barrio no encontrado"
                  disabled={!newAddress.municipio}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Bloque / Torre
                </Label>
                <Input
                  value={newAddress.bloque}
                  onChange={(e) => setNewAddress({...newAddress, bloque: e.target.value})}
                  placeholder="Ej. Torre 1"
                  className="bg-white h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Apto / Unidad
                </Label>
                <Input
                  value={newAddress.unidad}
                  onChange={(e) => setNewAddress({...newAddress, unidad: e.target.value})}
                  placeholder="Ej. 201"
                  className="bg-white h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddressModalOpen(false)}
              disabled={savingAddress}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveAddress}
              disabled={savingAddress}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingAddress ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Dirección"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
