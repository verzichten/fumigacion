"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { useUserRole } from "@/hooks/use-user-role"
import { toast } from "sonner"

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const { role, loading } = useUserRole()

  useEffect(() => {
    if (!loading) {
      if (!role) {
        router.push("/sign-in")
      } else if (role !== "ADMIN" && role !== "ASESOR") {
        toast.error("No tienes permisos para acceder al dashboard")
        router.push("/sign-in")
      }
    }
  }, [loading, role, router])

  // Evitar renderizar el contenido hasta confirmar autenticación y rol
  if (loading || !role || (role !== "ADMIN" && role !== "ASESOR")) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-stone-950">
      {/* Sidebar - Desktop: static (flex item), Mobile: fixed off-canvas */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-stone-200 bg-stone-100 transition-transform duration-200 ease-in-out dark:border-stone-800 dark:bg-stone-900 md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar className="h-full overflow-y-auto" />
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}
