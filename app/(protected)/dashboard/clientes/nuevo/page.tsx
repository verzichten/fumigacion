"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCliente } from "./actions";
import { municipiosAntioquia } from "@/lib/constants/municipios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  Save,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";

export default function AnadirClientePage() {
  const [loading, setLoading] = useState(false);
  const [direcciones, setDirecciones] = useState([
    {
      id: Date.now(),
      direccion: "",
      barrio: "",
      municipio: "",
      piso: "",
      bloque: "",
      unidad: "",
    },
  ]);
  const router = useRouter();

  const municipiosOptions = municipiosAntioquia.map((m) => ({
    value: m.nombre,
    label: m.nombre,
  }));

  const agregarDireccion = () => {
    setDirecciones([
      ...direcciones,
      {
        id: Date.now(),
        direccion: "",
        barrio: "",
        municipio: "",
        piso: "",
        bloque: "",
        unidad: "",
      },
    ]);
  };

  const eliminarDireccion = (id: number) => {
    if (direcciones.length === 1) {
      toast.error("Debe registrar al menos una dirección.");
      return;
    }
    setDirecciones(direcciones.filter((d) => d.id !== id));
  };

  const handleDireccionChange = (id: number, field: string, value: string) => {
    setDirecciones(
      direcciones.map((d) => {
        if (d.id === id) {
          // Si cambia el municipio, limpiar el barrio
          if (field === "municipio") {
            return { ...d, [field]: value, barrio: "" };
          }
          return { ...d, [field]: value };
        }
        return d;
      }),
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No se encontró sesión activa");
      router.push("/sign-in");
      setLoading(false);
      return;
    }

    // Agregar las direcciones al FormData como un JSON string
    formData.append("direcciones", JSON.stringify(direcciones));

    try {
      const result = await createCliente(token, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.push("/dashboard/clientes");
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
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
              onClick={() => router.push("/dashboard/clientes")}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Nuevo Cliente
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Complete la información para registrar un nuevo cliente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="flex-1 bg-white px-8 py-8 overflow-y-auto">
        <form
          id="cliente-form"
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Información Personal */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Información Personal
                </h2>
                <p className="text-sm text-slate-600">
                  Datos básicos del cliente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-sm font-medium text-slate-700"
                >
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ingrese el nombre"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="apellido"
                  className="text-sm font-medium text-slate-700"
                >
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  name="apellido"
                  placeholder="Ingrese el apellido"
                  required
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Documentación */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Documentación
                </h2>
                <p className="text-sm text-slate-600">
                  Documento de identidad del cliente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-2">
                <Label
                  htmlFor="tipoDocumento"
                  className="text-sm font-medium text-slate-700"
                >
                  Tipo de Documento <span className="text-red-500">*</span>
                </Label>
                <Select name="tipoDocumento" required>
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label
                  htmlFor="numeroDocumento"
                  className="text-sm font-medium text-slate-700"
                >
                  Número de Documento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroDocumento"
                  name="numeroDocumento"
                  placeholder="Ej. 1234567890"
                  required
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Información de Contacto
                </h2>
                <p className="text-sm text-slate-600">
                  Medios de comunicación con el cliente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="telefono"
                  className="text-sm font-medium text-slate-700"
                >
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="Ej. 3001234567"
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="correo"
                  className="text-sm font-medium text-slate-700"
                >
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="correo"
                    name="correo"
                    type="email"
                    placeholder="Ej. cliente@ejemplo.com"
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Direcciones */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Direcciones
                  </h2>
                  <p className="text-sm text-slate-600">
                    Ubicaciones asociadas al cliente
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarDireccion}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Dirección
              </Button>
            </div>

            <div className="space-y-4">
              {direcciones.map((dir, index) => {
                const barriosDisponibles =
                  municipiosAntioquia.find((m) => m.nombre === dir.municipio)
                    ?.barrios || [];

                const barriosOptions = barriosDisponibles.map((b) => ({
                  value: b,
                  label: b,
                }));

                return (
                  <div
                    key={dir.id}
                    className="p-5 bg-slate-50 rounded-lg border border-slate-200 relative"
                  >
                    {direcciones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarDireccion(dir.id)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Dirección Principal{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={dir.direccion}
                          onChange={(e) =>
                            handleDireccionChange(
                              dir.id,
                              "direccion",
                              e.target.value,
                            )
                          }
                          placeholder="Ej. Calle 123 # 45 - 67"
                          required
                          className="bg-white h-11"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Municipio
                        </Label>
                        <Combobox
                          options={municipiosOptions}
                          value={dir.municipio}
                          onChange={(value) =>
                            handleDireccionChange(dir.id, "municipio", value)
                          }
                          placeholder="Seleccionar municipio"
                          emptyMessage="Municipio no encontrado"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Barrio
                        </Label>
                        <Combobox
                          options={barriosOptions}
                          value={dir.barrio}
                          onChange={(value) =>
                            handleDireccionChange(dir.id, "barrio", value)
                          }
                          placeholder="Seleccionar barrio"
                          emptyMessage="Barrio no encontrado"
                          disabled={!dir.municipio}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Bloque / Torre
                        </Label>
                        <Input
                          value={dir.bloque}
                          onChange={(e) =>
                            handleDireccionChange(
                              dir.id,
                              "bloque",
                              e.target.value,
                            )
                          }
                          placeholder="Ej. Torre 1"
                          className="bg-white h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Apto / Unidad
                        </Label>
                        <Input
                          value={dir.unidad}
                          onChange={(e) =>
                            handleDireccionChange(
                              dir.id,
                              "unidad",
                              e.target.value,
                            )
                          }
                          placeholder="Ej. 201"
                          className="bg-white h-11"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                onClick={() => router.push("/dashboard/clientes")}
                disabled={loading}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 min-w-[160px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Cliente
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
