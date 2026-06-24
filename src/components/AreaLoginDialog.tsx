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
import { AreaSlug } from "@/lib/domain";
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
  void forceArea;
  const [user, setUser] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  React.useEffect(() => {
    void presetEmail;
  }, []);
  const presetEmail = "";
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
          <DialogTitle>Entrar</DialogTitle>
          <DialogDescription>
            Acesse com suas credenciais para visualizar e editar as informações
            da sua área.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handle} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usr">Usuário ou e-mail</Label>
            <Input
              id="usr"
              value={user}
              onChange={(e) => setUser(e.target.value)}
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
            />
          </div>

          {err && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {err}
            </div>
          )}

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
