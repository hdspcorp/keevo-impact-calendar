import * as React from "react";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { DEFAULT_APP_SETTINGS } from "@/lib/domain";
import { KeevoLogo } from "@/components/KeevoLogo";
import { toast } from "sonner";

const PRESETS: Array<{ label: string; value: string; preview: string }> = [
  { label: "Roxo Keevo", value: "0.46 0.22 295", preview: "oklch(0.46 0.22 295)" },
  { label: "Azul oceano", value: "0.50 0.18 245", preview: "oklch(0.50 0.18 245)" },
  { label: "Verde esmeralda", value: "0.55 0.16 160", preview: "oklch(0.55 0.16 160)" },
  { label: "Coral", value: "0.62 0.20 25", preview: "oklch(0.62 0.20 25)" },
  { label: "Âmbar", value: "0.70 0.18 70", preview: "oklch(0.70 0.18 70)" },
];

export function AdminSettingsPage() {
  const { settings, updateSettings } = useStore();
  const [local, setLocal] = React.useState(settings);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => setLocal(settings), [settings]);

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo precisa ter no máximo 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocal((s) => ({ ...s, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const salvar = () => {
    updateSettings(local);
    toast.success("Configurações salvas.");
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Personalize o nome, identidade visual e cor do calendário.
        </p>
      </header>

      <div className="space-y-5 rounded-2xl border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-nome">Nome do calendário</Label>
            <Input
              id="set-nome"
              value={local.nomeCalendario}
              onChange={(e) => setLocal({ ...local, nomeCalendario: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-sub">Subtítulo</Label>
            <Input
              id="set-sub"
              value={local.subtitulo}
              onChange={(e) => setLocal({ ...local, subtitulo: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-background">
              {local.logoDataUrl ? (
                <img
                  src={local.logoDataUrl}
                  alt="Logo"
                  className="max-h-14 max-w-14 object-contain"
                />
              ) : (
                <KeevoLogo size={32} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {local.logoDataUrl ? "Trocar logo" : "Enviar logo"}
                </Button>
                {local.logoDataUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => setLocal({ ...local, logoDataUrl: null })}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                PNG, JPG, SVG ou WebP — máximo 2 MB. Aparece no topo do calendário.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cor primária</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active = p.value === local.corPrimaria;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setLocal({ ...local, corPrimaria: p.value })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                    active
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ background: p.preview }}
                  />
                  {p.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            A cor escolhida é aplicada em botões, badges e destaques.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setLocal(DEFAULT_APP_SETTINGS);
            updateSettings(DEFAULT_APP_SETTINGS);
            toast.success("Configurações restauradas para o padrão.");
          }}
        >
          Restaurar padrão
        </Button>
        <Button onClick={salvar}>Salvar alterações</Button>
      </div>
    </section>
  );
}
