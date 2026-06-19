import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, User, AlertTriangle, Trash2 } from "lucide-react";
import { Evento, areaNome } from "@/lib/domain";
import { useStore } from "@/lib/store";

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function EventoDetailDrawer({
  evento,
  open,
  onOpenChange,
}: {
  evento: Evento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { session, removeEvento } = useStore();
  if (!evento) return null;

  const canEdit =
    session?.kind === "admin" ||
    (session?.kind === "area" && session.area === evento.area);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="space-y-2 border-b bg-gradient-to-b from-primary/[0.04] to-transparent px-6 pb-5 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {evento.tipo}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {areaNome(evento.area)}
            </Badge>
            <Badge
              className={`text-[10px] ${
                evento.relevancia === "Alta"
                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                  : evento.relevancia === "Média"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Relevância {evento.relevancia}
            </Badge>
            {evento.geraConflito && (
              <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                <AlertTriangle className="h-3 w-3" />
                Pode gerar conflito
              </Badge>
            )}
          </div>
          <SheetTitle className="text-xl">{evento.titulo}</SheetTitle>
          <SheetDescription className="text-xs">
            Detalhes do evento cadastrado no calendário.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-5 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Início">
              {fmt(evento.dataInicio)}
            </InfoRow>
            <InfoRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Fim">
              {fmt(evento.dataFim)}
            </InfoRow>
            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Responsável">
              {evento.responsavel || "—"}
            </InfoRow>
            <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Área">
              {areaNome(evento.area)}
            </InfoRow>
          </div>

          {evento.descricao && (
            <section className="rounded-2xl border bg-card p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descrição
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{evento.descricao}</p>
            </section>
          )}

          {evento.observacoes && (
            <section className="rounded-2xl border bg-card p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Observações
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{evento.observacoes}</p>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-4 text-[11px] text-muted-foreground">
            Criado por <strong>{evento.criadoPor}</strong> em{" "}
            {new Date(evento.criadoEm).toLocaleString("pt-BR")}.
          </section>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive"
                onClick={() => {
                  removeEvento(evento.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir evento
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}
