"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserPlus,
  Settings,
  MapPin,
  FileText,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    clientes: true,
    servicios: true,
    equipo: true,
    configuracion: false,
  })

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const menuItems = [
    {
      key: "clientes",
      label: "Gestión de Clientes",
      icon: Users,
      items: [
        { href: "/dashboard/clientes/nuevo", label: "Añadir Cliente" },
        { href: "/dashboard/clientes", label: "Ver Clientes" },
      ],
    },
    {
      key: "servicios",
      label: "Gestión de Servicios",
      icon: Briefcase,
      items: [
        { href: "/dashboard/servicios/nuevo", label: "Registrar Servicio" },
        { href: "/dashboard/servicios", label: "Ver Servicios" },
      ],
    },
    {
      key: "equipo",
      label: "Equipo de Trabajo",
      icon: UserPlus,
      items: [
        { href: "/dashboard/usuarios/asesores", label: "Listado de Asesores" },
        { href: "/dashboard/usuarios/fumigadores", label: "Listado de Fumigadores" },
        { href: "/dashboard/usuarios/nuevo", label: "Registrar Usuario" },
      ],
    },
    {
      key: "configuracion",
      label: "Configuración",
      icon: Settings,
      items: [
        { href: "/dashboard/configuracion/perfiles", label: "Perfiles" },
        { href: "/dashboard/configuracion/servicios", label: "Servicios Ofrecidos" },
        { href: "/dashboard/configuracion/localidades", label: "Localidades" },
        { href: "/dashboard/configuracion/zonas", label: "Zonas Locativas" },
      ],
    },
  ]

  return (
    <div className={cn("pb-12 min-h-screen bg-stone-100 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Fumigación App
          </h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((menu) => (
              <div key={menu.key} className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-transparent hover:underline"
                  onClick={() => toggleMenu(menu.key)}
                >
                  <span className="flex items-center font-semibold">
                    <menu.icon className="mr-2 h-4 w-4" />
                    {menu.label}
                  </span>
                  {openMenus[menu.key] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {openMenus[menu.key] && (
                  <div className="ml-4 space-y-1 border-l border-stone-200 dark:border-stone-700 pl-2">
                    {menu.items.map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start h-8 text-sm"
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto">
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
