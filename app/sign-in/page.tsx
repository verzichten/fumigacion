"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming Checkbox is available
import { User, Lock, Loader2 } from "lucide-react"; // Assuming icons are available

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // State for tracking validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = "El usuario es requerido";
    if (!formData.password) newErrors.password = "La contraseña es requerida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success("Inicio de sesión exitoso");
      router.push("/"); // Redirect to home page or dashboard
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 dark:bg-stone-900">
      <Card className="w-full max-w-sm shadow-xl border-stone-200 dark:border-stone-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-stone-500 dark:text-stone-400">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
                <Input
                  id="username"
                  placeholder="edisonyt"
                  className={`pl-9 ${errors.username ? "border-red-500" : ""}`}
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username}</p>
              )}
            </div>
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
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={handleCheckboxChange}
                disabled={isLoading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mantener sesión iniciada
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <div className="text-center text-sm text-stone-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-primary hover:underline"
            >
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
