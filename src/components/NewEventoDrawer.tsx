import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { AREAS, AreaSlug, RelevanciaEvento, TipoEvento, TIPOS_EVENTO } from "@/lib/domain";
import { toast } from "sonner";

export function NewEventoDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addEvento, session } = useStore();
  const [f, setF] = React.useState({
    titulo: "",
    area: (session?.kind === "area" ? session.area : "marketing") as AreaSlug,
    tipo: "Campanha" as TipoEvento,
    dataInicio: "",
    dataFim: "",
    descricao: "",
    responsavel: session?.nome ?? "",
    relevancia: "Média" as RelevanciaEvento,
    geraConflito: true,
    observacoes: "",
  });

  React.useEffect(() => {
    if (open && session) {
      setF((s) => ({
        ...s,
        area: session.kind === "area" ? session.area : s.area,
        responsavel: s.responsavel || session.nome,
      }));
    }
  }, [open, session]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.titulo || !f.dataInicio) {
      toast.error("Informe título e data inicial.");
      return;
    }
    addEvento({
      titulo: f.titulo,
      area: f.area,
      tipo: f.tipo,
      dataInicio: f.dataInicio,
      dataFim: f.dataFim || undefined,
      descricao: f.descricao,
      responsavel: f.responsavel,
      relevancia: f.relevancia,
      geraConflito: f.geraConflito,
      observacoes: f.observacoes || undefined,
    });
    toast.success("Evento adicionado ao calendário.");
    onOpenChange(false);
    setF({
      titulo: "",
      area: f.area,
      tipo: "Campanha",
      dataInicio: "",
      dataFim: "",
      descricao: "",
      responsavel: f.responsavel,
      relevancia: "Média",
      geraConflito: true,
      observacoes: "",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>Novo evento</SheetTitle>
          <SheetDescription>
            Cadastre eventos por área (campanhas, lives, treinamentos, lançamentos). Eles aparecem
            no calendário e no controle de conflitos.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={f.titulo}
              onChange={(e) => setF({ ...f, titulo: e.target.value })}
              placeholder="Ex.: Campanha do IR"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Área responsável</Label>
              <Select value={f.area} onValueChange={(v: AreaSlug) => setF({ ...f, area: v })}>
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
              <Label>Tipo</Label>
              <Select value={f.tipo} onValueChange={(v: TipoEvento) => setF({ ...f, tipo: v })}>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={f.dataInicio}
                onChange={(e) => setF({ ...f, dataInicio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data final (opcional)</Label>
              <Input
                type="date"
                value={f.dataFim}
                onChange={(e) => setF({ ...f, dataFim: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input
                value={f.responsavel}
                onChange={(e) => setF({ ...f, responsavel: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Relevância</Label>
              <Select
                value={f.relevancia}
                onValueChange={(v: RelevanciaEvento) => setF({ ...f, relevancia: v })}
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
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={f.descricao}
              onChange={(e) => setF({ ...f, descricao: e.target.value })}
              placeholder="O que é esse evento?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea
              rows={2}
              value={f.observacoes}
              onChange={(e) => setF({ ...f, observacoes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-amber-50/50 px-3 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">Pode gerar conflito?</div>
              <div className="text-[11px] text-muted-foreground">
                Sinaliza o evento como concorrente com ações de outras áreas no mesmo período.
              </div>
            </div>
            <Switch
              checked={f.geraConflito}
              onCheckedChange={(v) => setF({ ...f, geraConflito: v })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar evento</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
