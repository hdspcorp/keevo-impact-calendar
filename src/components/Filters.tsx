import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS, STATUS_GERAL } from "@/lib/domain";
import { Search } from "lucide-react";

export type FilterValues = {
  q: string;
  area: string;
  status: string;
  tipo: string;
  acao: string;
  /** "all" | "yes" | "no" */
  nexus: string;
  /** "all" | "60d" */
  vencimento: string;
};

export const DEFAULT_FILTERS: FilterValues = {
  q: "",
  area: "all",
  status: "all",
  tipo: "all",
  acao: "all",
  nexus: "all",
  vencimento: "all",
};

export function Filters({
  value,
  onChange,
}: {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
}) {
  const set = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Buscar por obrigação, linha ou impacto..."
          className="h-9 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
        />
      </div>

      <Sel value={value.area} onChange={(v) => set("area", v)}>
        <SelectItem value="all">Todas as áreas</SelectItem>
        {AREAS.map((a) => (
          <SelectItem key={a.slug} value={a.slug}>{a.nome}</SelectItem>
        ))}
      </Sel>

      <Sel value={value.status} onChange={(v) => set("status", v)}>
        <SelectItem value="all">Todos os status</SelectItem>
        {STATUS_GERAL.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </Sel>

      <Sel value={value.tipo} onChange={(v) => set("tipo", v)}>
        <SelectItem value="all">Toda periodicidade</SelectItem>
        <SelectItem value="Mensal">Mensal</SelectItem>
        <SelectItem value="Anual">Anual</SelectItem>
        <SelectItem value="Eventual">Eventual</SelectItem>
      </Sel>

      <Sel value={value.acao} onChange={(v) => set("acao", v)}>
        <SelectItem value="all">Ação: todas</SelectItem>
        <SelectItem value="yes">Apenas com estrela</SelectItem>
        <SelectItem value="no">Sem ação necessária</SelectItem>
      </Sel>

      <Sel value={value.nexus} onChange={(v) => set("nexus", v)}>
        <SelectItem value="all">NEXUS: todas</SelectItem>
        <SelectItem value="yes">Requer NEXUS</SelectItem>
        <SelectItem value="no">Dispensa NEXUS</SelectItem>
      </Sel>

      <Sel value={value.vencimento} onChange={(v) => set("vencimento", v)}>
        <SelectItem value="all">Vencimento: todos</SelectItem>
        <SelectItem value="60d">Próximos 60 dias</SelectItem>
      </Sel>
    </div>
  );
}

function Sel({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[150px] border-0 bg-secondary/60 text-xs shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
