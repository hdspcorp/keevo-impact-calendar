import * as React from "react";
import { AREAS, areaNome, Obrigacao } from "@/lib/domain";

export function PendingPanel({
  obrigacoes,
  onSelect,
}: {
  obrigacoes: Obrigacao[];
  onSelect: (o: Obrigacao) => void;
}) {
  const pendByArea = React.useMemo(() => {
    const map: Record<string, Obrigacao[]> = {};
    for (const a of AREAS) map[a.slug] = [];
    for (const o of obrigacoes) {
      for (const a of AREAS) {
        const st = o.areas[a.slug].status;
        if (st !== "Atualizada" && st !== "Concluída") map[a.slug].push(o);
      }
    }
    return map;
  }, [obrigacoes]);

  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <aside className="space-y-3 rounded-2xl border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Próximas pendências</h3>
        <p className="text-[11px] text-muted-foreground">Por área responsável</p>
      </div>

      <div className="space-y-1.5">
        {AREAS.map((a) => {
          const items = pendByArea[a.slug];
          const open = expanded === a.slug;
          return (
            <div key={a.slug} className="rounded-xl border bg-background">
              <button
                onClick={() => setExpanded(open ? null : a.slug)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: a.cor }}
                  />
                  <span className="font-medium text-foreground">{a.nome}</span>
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {items.length}
                </span>
              </button>
              {open && (
                <div className="space-y-1 border-t px-2 py-2">
                  {items.length === 0 ? (
                    <div className="px-2 py-2 text-[11px] text-muted-foreground">Nada pendente</div>
                  ) : (
                    items.slice(0, 6).map((o) => (
                      <button
                        key={o.id}
                        onClick={() => onSelect(o)}
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-secondary"
                      >
                        <div className="truncate font-medium text-foreground">{o.nome}</div>
                        <div className="text-muted-foreground">
                          {new Date(o.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
