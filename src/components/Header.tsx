import * as React from "react";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { areaNome } from "@/lib/domain";
import { AreaLoginDialog } from "./AreaLoginDialog";
import { KeevoLogo } from "./KeevoLogo";

export function Header() {
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
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <KeevoLogo size={28} />
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold text-foreground sm:text-[15px]">
              Calendário de Gestão de Impactos 2026
            </h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Visão estratégica para antecipação dos principais temas do ano.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-medium text-foreground">{session.nome}</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
                <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
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
