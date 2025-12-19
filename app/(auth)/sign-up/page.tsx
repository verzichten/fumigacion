"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Mail, Lock, Phone, FileText, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
    tipoDocumento: "",
    numeroDocumento: "",
    telefono: "",
  })

  // State for tracking validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tipoDocumento: value }))
     if (errors.tipoDocumento) {
      setErrors((prev) => ({ ...prev, tipoDocumento: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username) newErrors.username = "El usuario es requerido"
    if (!formData.email) newErrors.email = "El correo es requerido"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo inválido"
    
    if (!formData.password) newErrors.password = "La contraseña es requerida"
    else if (formData.password.length < 6) newErrors.password = "Mínimo 6 caracteres"
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nombre) newErrors.nombre = "El nombre es requerido"
    if (!formData.apellido) newErrors.apellido = "El apellido es requerido"
    if (!formData.tipoDocumento) newErrors.tipoDocumento = "Seleccione un tipo"
    if (!formData.numeroDocumento) newErrors.numeroDocumento = "Requerido"
    // Validate telefono if needed, currently optional in schema but good to have basic check if entered
    if (formData.telefono && formData.telefono.length < 7) newErrors.telefono = "Número inválido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep1()) {
      setStep(step + 1)
    }
  }

  const prevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!validateStep2()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar usuario')
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Cuenta creada exitosamente");
      router.push("/verificacion"); 

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 dark:bg-stone-900">
      <Card className="w-full max-w-lg shadow-xl border-stone-200 dark:border-stone-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
               <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-stone-200'}`} />
               <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-stone-200'}`} />
            </div>
            <span className="text-xs text-stone-500 font-medium">Paso {step} de 2</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Información de Cuenta" : "Datos Personales"}
          </CardTitle>
          <CardDescription className="text-stone-500 dark:text-stone-400">
            {step === 1 
              ? "Configura tus credenciales de acceso" 
              : "Necesitamos conocerte un poco más"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                  <Input 
                    id="username" 
                    placeholder="juanperez123" 
                    className={`pl-9 ${errors.username ? "border-red-500" : ""}`}
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="juan@ejemplo.com" 
                    className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className={`pl-9 ${errors.password ? "border-red-500" : ""}`}
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      className={`pl-9 ${errors.confirmPassword ? "border-red-500" : ""}`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    placeholder="Juan" 
                    className={errors.nombre ? "border-red-500" : ""}
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input 
                    id="apellido" 
                    placeholder="Pérez" 
                    className={errors.apellido ? "border-red-500" : ""}
                    value={formData.apellido}
                    onChange={handleInputChange}
                  />
                  {errors.apellido && <p className="text-xs text-red-500">{errors.apellido}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                  <Select onValueChange={handleSelectChange} value={formData.tipoDocumento}>
                    <SelectTrigger className={`w-full ${errors.tipoDocumento ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="NIT">NIT</SelectItem>
                      <SelectItem value="PAS">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipoDocumento && <p className="text-xs text-red-500">{errors.tipoDocumento}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroDocumento">Número de Documento</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                    <Input 
                      id="numeroDocumento" 
                      placeholder="1234567890" 
                      className={`pl-9 ${errors.numeroDocumento ? "border-red-500" : ""}`}
                      value={formData.numeroDocumento}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.numeroDocumento && <p className="text-xs text-red-500">{errors.numeroDocumento}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                  <Input 
                    id="telefono" 
                    placeholder="+57 300 123 4567" 
                    className={`pl-9 ${errors.telefono ? "border-red-500" : ""}`}
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>
                {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
          {step === 1 ? (
            <div className="w-full text-center text-sm text-stone-500">
               ¿Ya tienes cuenta?{" "}
               <Link href="/sign-in" className="font-semibold text-primary hover:underline">
                 Ingresa aquí
               </Link>
            </div>
          ) : (
            <Button variant="outline" onClick={prevStep} disabled={isLoading} className="flex-1 mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>
          )}

          {step === 1 && (
            <Button onClick={nextStep} className="flex-1 ml-2">
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === 2 && (
             <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 ml-2 bg-green-600 hover:bg-green-700">
               {isLoading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Registrando...
                 </>
               ) : (
                 <>
                   Confirmar Registro
                   <CheckCircle2 className="ml-2 h-4 w-4" />
                 </>
               )}
             </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
