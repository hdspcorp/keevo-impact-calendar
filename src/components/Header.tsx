import * as React from "react";
import { LogOut, ShieldCheck, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { areaNome } from "@/lib/domain";
import { AreaLoginDialog } from "./AreaLoginDialog";

export function Header({ notificacoesCount = 0 }: { notificacoesCount?: number }) {
  const { session, logout } = useStore();
  const [loginOpen, setLoginOpen] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!session) return "VC";
    return session.nome
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [session]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14px] font-semibold text-foreground sm:text-[15px]">
            Calendário de Gestão de Impactos 2026
          </h1>
          <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
            Planeje, acompanhe e execute os principais temas do ano.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {session && (
            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              title="Notificações"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              {notificacoesCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
                  {notificacoesCount > 9 ? "9+" : notificacoesCount}
                </span>
              )}
            </button>
          )}

          {session ? (
            <>
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="text-[12px] font-semibold text-foreground">{session.nome}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {session.kind === "admin" ? (
                    <>
                      <ShieldCheck className="h-3 w-3 text-primary" /> Administrador
                    </>
                  ) : (
                    <>Área · {areaNome(session.area)}</>
                  )}
                </span>
              </div>
              <Avatar className="h-9 w-9 border border-border bg-secondary">
                <AvatarFallback className="bg-secondary text-[11px] font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
      <AreaLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}
