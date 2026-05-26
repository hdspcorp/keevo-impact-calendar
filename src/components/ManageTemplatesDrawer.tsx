import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AREAS, AreaSlug } from "@/lib/domain";
import { useStore } from "@/lib/store";

export function ManageTemplatesDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { templates, addTemplate, updateTemplate, removeTemplate, reorderTemplate, session } =
    useStore();
  const isAdmin = session?.kind === "admin";
  const [tab, setTab] = React.useState<AreaSlug>("nexus");
  const [novo, setNovo] = React.useState("");

  const itens = templates
    .filter((t) => t.area === tab)
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>Configuração de checklists por área</SheetTitle>
          <SheetDescription>
            Estes itens são carregados automaticamente em toda nova obrigação. Marque "somente
            quando ação necessária" para itens que só aparecem se NEXUS marcar a estrela roxa.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5">
          {!isAdmin && (
            <div className="mb-4 rounded-xl border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Você está em modo visualização. Entre como <strong>admin</strong> para editar.
            </div>
          )}

          <Tabs value={tab} onValueChange={(v) => setTab(v as AreaSlug)}>
            <TabsList className="flex w-full flex-wrap gap-1 bg-secondary/60 p-1">
              {AREAS.map((a) => (
                <TabsTrigger key={a.slug} value={a.slug} className="flex-1 text-xs">
                  {a.nome}
                </TabsTrigger>
              ))}
            </TabsList>

            {AREAS.map((a) => (
              <TabsContent key={a.slug} value={a.slug} className="mt-4 space-y-2">
                {itens.length === 0 && (
                  <div className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    Sem itens configurados.
                  </div>
                )}
                {itens.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <button
                        disabled={!isAdmin || i === 0}
                        onClick={() => reorderTemplate(t.id, -1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        disabled={!isAdmin || i === itens.length - 1}
                        onClick={() => reorderTemplate(t.id, 1)}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    <Input
                      value={t.nome}
                      disabled={!isAdmin}
                      onChange={(e) => updateTemplate(t.id, { nome: e.target.value })}
                      className="h-8 text-xs"
                    />

                    <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Switch
                        checked={t.ativo}
                        disabled={!isAdmin}
                        onCheckedChange={(v) => updateTemplate(t.id, { ativo: v })}
                      />
                      Ativo
                    </label>
                    <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Switch
                        checked={t.obrigatorio}
                        disabled={!isAdmin}
                        onCheckedChange={(v) => updateTemplate(t.id, { obrigatorio: v })}
                      />
                      Obrigatório
                    </label>
                    <label className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Switch
                        checked={t.somenteAcaoNecessaria}
                        disabled={!isAdmin}
                        onCheckedChange={(v) =>
                          updateTemplate(t.id, { somenteAcaoNecessaria: v })
                        }
                      />
                      Só c/ ação necessária
                    </label>

                    <button
                      disabled={!isAdmin}
                      onClick={() => removeTemplate(t.id)}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {isAdmin && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!novo.trim()) return;
                      addTemplate({
                        area: a.slug,
                        nome: novo.trim(),
                        ativo: true,
                        obrigatorio: false,
                        somenteAcaoNecessaria: false,
                      });
                      setNovo("");
                    }}
                    className="mt-3 flex gap-2"
                  >
                    <Input
                      value={novo}
                      onChange={(e) => setNovo(e.target.value)}
                      placeholder={`Novo item para ${a.nome}...`}
                      className="h-9 text-xs"
                    />
                    <Button type="submit" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                  </form>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
