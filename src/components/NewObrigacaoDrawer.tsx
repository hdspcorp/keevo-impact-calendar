import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { Criticidade, Periodicidade, STATUS_GERAL, StatusGeral } from "@/lib/domain";
import { Star } from "lucide-react";
import { toast } from "sonner";

export function NewObrigacaoDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addObrigacao } = useStore();
  const [f, setF] = React.useState({
    nome: "",
    tipo: "Mensal" as Periodicidade,
    linhaModulo: "",
    dataVencimento: "",
    criticidade: "Média" as Criticidade,
    impacto: "",
    resumo: "",
    statusGeral: "Não iniciada" as StatusGeral,
    acaoNecessaria: false,
  });

  const reset = () =>
    setF({
      nome: "",
      tipo: "Mensal",
      linhaModulo: "",
      dataVencimento: "",
      criticidade: "Média",
      impacto: "",
      resumo: "",
      statusGeral: "Não iniciada",
      acaoNecessaria: false,
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome || !f.dataVencimento || !f.linhaModulo) {
      toast.error("Preencha nome, linha/módulo e data de vencimento.");
      return;
    }
    addObrigacao(f);
    toast.success("Obrigação criada e distribuída no mês correspondente.");
    onOpenChange(false);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>Nova obrigação</SheetTitle>
          <SheetDescription>
            Ao salvar, o checklist padrão de todas as áreas será carregado automaticamente.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label>Nome da obrigação</Label>
            <Input
              value={f.nome}
              onChange={(e) => setF({ ...f, nome: e.target.value })}
              placeholder="Ex.: Pagamento de Salários"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Periodicidade</Label>
              <Select value={f.tipo} onValueChange={(v: Periodicidade) => setF({ ...f, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                  <SelectItem value="Eventual">Eventual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Linha / módulo</Label>
              <Input
                value={f.linhaModulo}
                onChange={(e) => setF({ ...f, linhaModulo: e.target.value })}
                placeholder="Ex.: Folha de Pagamento"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de vencimento</Label>
              <Input
                type="date"
                value={f.dataVencimento}
                onChange={(e) => setF({ ...f, dataVencimento: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Criticidade</Label>
              <Select value={f.criticidade} onValueChange={(v: Criticidade) => setF({ ...f, criticidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Impacto</Label>
            <Textarea
              rows={2}
              value={f.impacto}
              onChange={(e) => setF({ ...f, impacto: e.target.value })}
              placeholder="O que esse tema impacta?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Resumo</Label>
            <Textarea
              rows={3}
              value={f.resumo}
              onChange={(e) => setF({ ...f, resumo: e.target.value })}
              placeholder="Detalhes, observações principais..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status inicial</Label>
            <Select value={f.statusGeral} onValueChange={(v: StatusGeral) => setF({ ...f, statusGeral: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_GERAL.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-primary/[0.04] px-3 py-3">
            <div className="flex items-center gap-2">
              <Star className={f.acaoNecessaria ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4 text-muted-foreground"} />
              <div>
                <div className="text-sm font-medium text-foreground">Há ação necessária?</div>
                <div className="text-[11px] text-muted-foreground">Quando ativo, o card recebe estrela roxa.</div>
              </div>
            </div>
            <Switch
              checked={f.acaoNecessaria}
              onCheckedChange={(v) => setF({ ...f, acaoNecessaria: v })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar obrigação</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
