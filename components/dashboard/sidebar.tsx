"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllTenants, switchUserTenant } from "@/app/(protected)/dashboard/actions";
import { toast } from "sonner";
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
  Menu,
  ArrowLeftRight,
  CheckCircle,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

// Define the type for sub-items within a parent menu
interface SubMenuItem {
  href: string;
  label: string;
}

// Define a type for menu items that are direct links
interface MenuItemWithHref {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
  items?: never; // This ensures it cannot have 'items'
}

// Define a type for menu items that are parents with sub-items
interface MenuItemWithSubItems {
  key: string;
  label: string;
  icon: React.ElementType;
  items: SubMenuItem[];
  href?: never; // This ensures it cannot have 'href' directly
}

type MenuConfig = MenuItemWithHref | MenuItemWithSubItems;

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUserRole();

  const allMenuItems: MenuConfig[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
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
        { href: "/dashboard/servicios/programacion", label: "Programación" },
      ],
    },
    {
      key: "equipo",
      label: "Equipo de Trabajo",
      icon: UserPlus,
      items: [
        { href: "/dashboard/usuarios/asesores", label: "Listado de Asesores" },
        { href: "/dashboard/usuarios/tecnicos", label: "Listado de Tecnicos" },
        { href: "/dashboard/usuarios/aprobar", label: "Aprobar Usuario" },
        { href: "/dashboard/usuarios/nuevo", label: "Registrar Usuario" },
      ],
    },
    {
      key: "configuracion",
      label: "Configuración",
      icon: Settings,
      items: [
        { href: "/dashboard/configuracion/perfil", label: "Perfil" },
        { href: "/dashboard/configuracion/empresas", label: "Empresas" },
        { href: "/dashboard/configuracion/servicios", label: "Servicios" },
        { href: "/dashboard/configuracion/localidades", label: "Localidades" },
        { href: "/dashboard/configuracion/zonas", label: "Zonas Locativas" },
      ],
    },
  ];

  const menuItems = useMemo(() => {
    if (!role) return [];

    return allMenuItems.map(item => {
      // If it's a direct link, everyone (Admin/Asesor) has access if it's in the list
      // (Technicians are blocked at layout level)
      if (!item.items) return item;

      // Filter sub-items
      const filteredItems = item.items.filter(subItem => {
        // Admin Only Links
        const adminOnlyPaths = [
          "/dashboard/usuarios/aprobar",
          "/dashboard/usuarios/nuevo",
          "/dashboard/configuracion/empresas",
          "/dashboard/configuracion/servicios",
          "/dashboard/configuracion/localidades",
          "/dashboard/configuracion/zonas",
        ];

        if (adminOnlyPaths.includes(subItem.href)) {
          return role === "ADMIN";
        }

        return true; // Default allow for others
      });

      return {
        ...item,
        items: filteredItems
      };
    }).filter(item => {
        // If it was a parent item and now has no children, remove it
        if (item.items && item.items.length === 0) return false;
        return true;
    }) as MenuConfig[];
  }, [role]);

  const initialOpenMenus = allMenuItems.reduce((acc: Record<string, boolean>, menu) => {
    if (menu.items && menu.items.length > 0) {
      const isActiveParent = menu.items.some(item => pathname.startsWith(item.href));
      acc[menu.key] = isActiveParent;
    }
    return acc;
  }, {});

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(initialOpenMenus);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenants, setTenants] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [switchingTenant, setSwitchingTenant] = useState(false);

  const fetchTenants = async () => {
    setLoadingTenants(true);
    const token = localStorage.getItem("token");
    if (token) {
      const result = await getAllTenants(token);
      if (result.tenants) {
        setTenants(result.tenants);
      } else {
        toast.error("Error al cargar sistemas");
      }
    }
    setLoadingTenants(false);
  };

  const handleSwitchTenant = async () => {
    if (!selectedTenantId) return;

    setSwitchingTenant(true);
    const token = localStorage.getItem("token");
    if (token) {
      const result = await switchUserTenant(token, parseInt(selectedTenantId));
      if (result.success) {
        toast.success("Sistema cambiado exitosamente");
        window.location.reload();
      } else {
        toast.error(result.error || "Error al cambiar sistema");
      }
    }
    setSwitchingTenant(false);
    setIsTenantModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/sign-out", {
        method: "POST",
      });

      // Limpiar almacenamiento local
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirigir al login
      router.push("/sign-in");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div
      className={cn(
        "pb-12 h-full flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground",
        className,
      )}
    >
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-sidebar-foreground">
            Fumigación App
          </h2>
          <div className="space-y-1">
                        {menuItems.map((menu) => {
                          if (!menu.items || menu.items.length === 0) {
                            const directLinkMenu = menu as MenuItemWithHref;
                            return (
                              <Button
                                key={directLinkMenu.key}
                                asChild
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start transition-all duration-200 ease-in-out",
                                  pathname === directLinkMenu.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary font-medium"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                              >
                                <Link href={directLinkMenu.href}>
                                  <directLinkMenu.icon className="mr-2 h-4 w-4" />
                                  {directLinkMenu.label}
                                </Link>
                              </Button>
                            );
                          } else {
                            const parentMenu = menu as MenuItemWithSubItems;
                            return (
                              <div key={parentMenu.key} className="space-y-1">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground transition-all duration-200 ease-in-out"
                                  onClick={() => toggleMenu(parentMenu.key)}
                                >
                                  <span className="flex items-center font-semibold">
                                    <parentMenu.icon className="mr-2 h-4 w-4" />
                                    {parentMenu.label}
                                  </span>
                                  {openMenus[parentMenu.key] ? (
                                    <ChevronDown className="h-4 w-4 transition-all duration-200 ease-in-out" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 transition-all duration-200 ease-in-out" />
                                  )}
                                </Button>
                                {openMenus[parentMenu.key] && (
                                  <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
                                    {parentMenu.items.map((item) => {
                                      const isActive =
                                        pathname === item.href ||
                                        (pathname.startsWith(item.href + "/") &&
                                         !parentMenu.items.some((sub) => sub.href === pathname));
            
                                      return (
                                        <Button
                                          key={item.href}
                                          asChild
                                          variant="ghost"
                                          className={cn(
                                            "w-full justify-start h-8 text-sm transition-all duration-200 ease-in-out",
                                            isActive
                                              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary font-medium"
                                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                          )}
                                        >
                                          <Link href={item.href}>{item.label}</Link>
                                        </Button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })}          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto">
        <Dialog open={isTenantModalOpen} onOpenChange={setIsTenantModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 ease-in-out mb-2"
              onClick={fetchTenants}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Cambiar Sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Sistema</DialogTitle>
              <DialogDescription>
                Seleccione el sistema al que desea cambiar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {loadingTenants ? (
                <div className="flex justify-center p-4">
                  <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-slate-50",
                        selectedTenantId === tenant.id.toString()
                          ? "border-indigo-600 bg-indigo-50 hover:bg-indigo-50"
                          : "border-slate-200"
                      )}
                      onClick={() => setSelectedTenantId(tenant.id.toString())}
                    >
                      <span className={cn(
                        "font-medium",
                        selectedTenantId === tenant.id.toString() ? "text-indigo-700" : "text-slate-700"
                      )}>
                        {tenant.nombre}
                      </span>
                      {selectedTenantId === tenant.id.toString() && (
                        <CheckCircle className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTenantModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSwitchTenant} disabled={switchingTenant || !selectedTenantId}>
                {switchingTenant ? "Cambiando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ease-in-out"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
