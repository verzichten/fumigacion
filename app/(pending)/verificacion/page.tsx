"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function VerificacionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "rejected" | "loading">("loading");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // New logic: null is Rejected, false is Pending
        if (user.aprobado === null) {
          setStatus("rejected");
        } else {
          setStatus("pending");
        }
      } catch (e) {
        setStatus("pending");
      }
    } else {
      // If no user info, redirect to sign-in or default to pending
      router.push("/sign-in");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/sign-in");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 dark:bg-stone-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 dark:bg-stone-900">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl text-center space-y-6">
        {status === "rejected" ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="text-3xl font-bold text-slate-900">
              Solicitud Rechazada
            </h1>
            <p className="text-slate-600">
              Lo sentimos, tu solicitud de registro ha sido revisada y no fue aprobada en este momento.
            </p>
            <p className="text-slate-600 font-medium">
              Si crees que esto es un error, por favor contacta al administrador del sistema.
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto h-16 w-16 text-blue-500" />
            <h1 className="text-3xl font-bold text-slate-900">
              Verificación Pendiente
            </h1>
            <p className="text-slate-600">
              Tu cuenta ha sido creada exitosamente. Para mantener la seguridad y calidad de nuestro servicio, un administrador revisará y aprobará tu cuenta en las próximas 24 horas.
            </p>
            <p className="text-slate-600 font-medium">
              Recibirás una notificación una vez tu cuenta esté activa.
            </p>
          </>
        )}
        
        <Button className="w-full" onClick={handleLogout}>
          Volver al Inicio de Sesión
        </Button>
      </div>
    </div>
  );
}
