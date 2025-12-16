"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/sign-in")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  // Evitar renderizar el contenido hasta confirmar autenticación
  if (!isAuthenticated) {
    return null // O podrías retornar un spinner/loading
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
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
