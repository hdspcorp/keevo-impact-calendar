import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AdminChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { changeAdminPassword } = useStore();
  const [atual, setAtual] = React.useState("");
  const [nova, setNova] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAtual("");
      setNova("");
      setConfirm("");
      setErr(null);
    }
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (nova.length < 4) {
      setErr("A nova senha precisa ter ao menos 4 caracteres.");
      return;
    }
    if (nova !== confirm) {
      setErr("A confirmação não confere com a nova senha.");
      return;
    }
    const ok = changeAdminPassword(atual, nova);
    if (!ok) {
      setErr("Senha atual inválida.");
      return;
    }
    toast.success("Senha do administrador atualizada.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar minha senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para o usuário administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="atual">Senha atual</Label>
            <Input
              id="atual"
              type="password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              type="password"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf">Confirmar nova senha</Label>
            <Input
              id="conf"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {err && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {err}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar nova senha</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
