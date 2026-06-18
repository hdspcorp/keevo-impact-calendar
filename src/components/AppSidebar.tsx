import * as React from "react";
import {
  Calendar as CalendarIcon,
  User,
  AlertTriangle,
  Layers,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { KeevoLogo } from "./KeevoLogo";
import { cn } from "@/lib/utils";

export type SidebarSection =
  | "calendario"
  | "minha-area"
  | "conflitos"
  | "impactos"
  | "relatorios"
  | "configuracoes"
  | "ajuda";

type Item = {
  key: SidebarSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  disabled?: boolean;
  adminOnly?: boolean;
  areaOnly?: boolean;
};

export function AppSidebar({
  active,
  conflitosCount,
  showMinhaArea,
  isAdmin,
  onNavigate,
}: {
  active: SidebarSection;
  conflitosCount: number;
  showMinhaArea: boolean;
  isAdmin: boolean;
  onNavigate: (s: SidebarSection) => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const items: Item[] = [
    { key: "calendario", label: "Calendário", icon: CalendarIcon },
    ...(showMinhaArea
      ? [{ key: "minha-area" as const, label: "Minha área", icon: User }]
      : []),
    { key: "conflitos", label: "Conflitos", icon: AlertTriangle, badge: conflitosCount },
    { key: "impactos", label: "Impactos", icon: Layers },
    { key: "relatorios", label: "Relatórios", icon: BarChart3, disabled: true },
    ...(isAdmin
      ? [{ key: "configuracoes" as const, label: "Configurações", icon: Settings }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <KeevoLogo size={20} variant="mark" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-sidebar-foreground">Keevo</div>
              <div className="text-[10px] text-sidebar-foreground/60">Impactos 2026</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={active === item.key}
                    disabled={item.disabled}
                    onClick={() => !item.disabled && onNavigate(item.key)}
                    tooltip={item.label}
                    className={cn(
                      "gap-2.5",
                      item.disabled && "opacity-50"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {!!item.badge && item.badge > 0 && !collapsed && (
                      <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onNavigate("ajuda")}
              tooltip="Ajuda"
              className="gap-2.5 text-sidebar-foreground/70"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Ajuda</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
