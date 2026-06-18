import * as React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conflito } from "@/lib/conflitos";
import { Obrigacao } from "@/lib/domain";

const PRI_STYLE: Record<Conflito["prioridade"], string> = {
  alta: "border-red-300 bg-red-50 text-red-700",
  media: "border-amber-300 bg-amber-50 text-amber-700",
  baixa: "border-zinc-300 bg-zinc-50 text-zinc-600",
};

export function ConflitosDrawer({
  open,
  onOpenChange,
  conflitos,
  obrigacoes,
  onOpenObrigacao,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conflitos: Conflito[];
  obrigacoes: Obrigacao[];
  onOpenObrigacao: (o: Obrigacao) => void;
}) {
  const findOb = (id?: string) => (id ? obrigacoes.find((o) => o.id === id) : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Conflitos detectados
            <Badge variant="secondary" className="ml-1">
              {conflitos.length}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Situações que merecem atenção entre obrigações, áreas e eventos de marketing.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto pr-1">
          {conflitos.length === 0 && (
            <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Nenhum conflito no momento.
            </div>
          )}
          {conflitos.map((c) => {
            const ob = findOb(c.obrigacaoId);
            return (
              <article
                key={c.id}
                className="space-y-2 rounded-2xl border bg-card p-3 shadow-sm"
              >
                <header className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{c.titulo}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.descricao}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRI_STYLE[c.prioridade]}`}
                  >
                    {c.prioridade}
                  </span>
                </header>
                {ob && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between gap-2"
                    onClick={() => {
                      onOpenObrigacao(ob);
                      onOpenChange(false);
                    }}
                  >
                    Abrir “{ob.nome}”
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
