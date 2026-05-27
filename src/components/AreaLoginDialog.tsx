import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { AreaSlug, MOCK_USERS } from "@/lib/domain";
import { toast } from "sonner";

export function AreaLoginDialog({
  open,
  onOpenChange,
  forceArea,
  onAuthenticated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  forceArea?: AreaSlug;
  onAuthenticated?: () => void;
}) {
  const { login } = useStore();
  const presetEmail = forceArea
    ? MOCK_USERS.find((u) => u.area === forceArea)?.email ?? ""
    : "";
  const [user, setUser] = React.useState(presetEmail);
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setUser(presetEmail);
      setPass("");
      setErr(null);
    }
  }, [open, presetEmail]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const s = login(user.trim(), pass);
    if (!s) {
      setErr("Usuário ou senha inválidos.");
      return;
    }
    if (forceArea && s.kind === "area" && s.area !== forceArea) {
      setErr(`Esta conta só pode editar a área correspondente.`);
      return;
    }
    toast.success(`Bem-vindo, ${s.nome}`);
    onOpenChange(false);
    onAuthenticated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar para editar</DialogTitle>
          <DialogDescription>
            Cada área usa suas próprias credenciais. Após entrar, você poderá
            editar somente a seção da sua área.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handle} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usr">E-mail</Label>
            <Input
              id="usr"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="ex.: nexus@keevo.com"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Senha</Label>
            <Input
              id="pwd"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {err && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {err}
            </div>
          )}

          <div className="rounded-xl border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Contas demo</strong> (senha = parte
            antes do @):
            <ul className="mt-1 space-y-0.5">
              {MOCK_USERS.map((u) => (
                <li key={u.email}>
                  <code>{u.email}</code> · {u.nome}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Entrar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
