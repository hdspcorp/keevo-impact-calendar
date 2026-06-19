import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Plus, Trash2, Zap } from "lucide-react";
import {
  AREAS,
  AreaSlug,
  AtalhoEvento,
  RelevanciaEvento,
  TipoEvento,
  TIPOS_EVENTO,
} from "@/lib/domain";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AdminAtalhosPage() {
  const { atalhos, addAtalho, updateAtalho, removeAtalho, reorderAtalho } = useStore();
  const ordenados = [...atalhos].sort((a, b) => a.ordem - b.ordem);

  const [novo, setNovo] = React.useState<Omit<AtalhoEvento, "id" | "ordem" | "ativo">>({
    nome: "",
    descricao: "",
    icone: "⚡",
    area: "marketing",
    tipo: "Campanha",
    relevancia: "Média",
    geraConflito: true,
    duracaoDias: 1,
  });

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Atalhos inteligentes</h1>
          <p className="text-xs text-muted-foreground">
            Atalhos pré-configurados que aparecem na home do calendário para criação rápida
            de eventos.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Criar novo atalho</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              placeholder="Ex.: Keevo Live"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ícone (emoji)</Label>
            <Input
              value={novo.icone}
              onChange={(e) => setNovo({ ...novo, icone: e.target.value })}
              maxLength={3}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={novo.descricao}
              onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Área</Label>
            <Select
              value={novo.area}
              onValueChange={(v: AreaSlug) => setNovo({ ...novo, area: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a.slug} value={a.slug}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de evento</Label>
            <Select
              value={novo.tipo}
              onValueChange={(v: TipoEvento) => setNovo({ ...novo, tipo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Relevância</Label>
            <Select
              value={novo.relevancia}
              onValueChange={(v: RelevanciaEvento) => setNovo({ ...novo, relevancia: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duração padrão (dias)</Label>
            <Input
              type="number"
              min={1}
              value={novo.duracaoDias}
              onChange={(e) =>
                setNovo({ ...novo, duracaoDias: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-amber-50/50 px-3 py-2 sm:col-span-2">
            <div className="text-xs">
              <strong>Pode gerar conflito?</strong>
              <div className="text-muted-foreground">
                Sinaliza eventos criados por este atalho como concorrentes com outras áreas.
              </div>
            </div>
            <Switch
              checked={novo.geraConflito}
              onCheckedChange={(v) => setNovo({ ...novo, geraConflito: v })}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            className="gap-1.5"
            onClick={() => {
              if (!novo.nome.trim()) {
                toast.error("Informe o nome do atalho.");
                return;
              }
              addAtalho(novo);
              toast.success(`Atalho "${novo.nome}" criado.`);
              setNovo({ ...novo, nome: "", descricao: "" });
            }}
          >
            <Plus className="h-4 w-4" />
            Criar atalho
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">
          Atalhos existentes ({ordenados.length})
        </h2>
        {ordenados.length === 0 && (
          <div className="rounded-xl border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
            Nenhum atalho criado.
          </div>
        )}
        <ul className="space-y-2">
          {ordenados.map((a, i) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border bg-background px-3 py-2"
            >
              <div className="flex flex-col">
                <button
                  disabled={i === 0}
                  onClick={() => reorderAtalho(a.id, -1)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  disabled={i === ordenados.length - 1}
                  onClick={() => reorderAtalho(a.id, 1)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-base">
                {a.icone ?? "⚡"}
              </span>
              <div className="min-w-[140px] flex-1">
                <div className="text-sm font-medium">{a.nome}</div>
                <div className="text-[10px] text-muted-foreground">
                  {a.tipo} · {AREAS.find((x) => x.slug === a.area)?.nome} · {a.duracaoDias}d
                </div>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                <Switch
                  checked={a.ativo}
                  onCheckedChange={(v) => updateAtalho(a.id, { ativo: v })}
                />
                Ativo
              </label>
              <button
                onClick={() => {
                  if (confirm(`Excluir atalho "${a.nome}"?`)) removeAtalho(a.id);
                }}
                className="text-muted-foreground hover:text-destructive"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
