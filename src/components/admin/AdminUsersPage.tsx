import * as React from "react";
import {
  Plus,
  Trash2,
  KeyRound,
  Copy,
  ShieldCheck,
  User as UserIcon,
  Power,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AREAS, AreaSlug, UsuarioGerenciado } from "@/lib/domain";

function areaLabel(a: AreaSlug | undefined) {
  return AREAS.find((x) => x.slug === a)?.nome ?? "—";
}

export function AdminUsersPage() {
  const { usuarios, addUsuario, updateUsuario, removeUsuario, resetUsuarioSenha } = useStore();
  const [editing, setEditing] = React.useState<UsuarioGerenciado | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState<UsuarioGerenciado | null>(null);
  const [resetInfo, setResetInfo] = React.useState<{ usr: UsuarioGerenciado; pass: string } | null>(
    null
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie quem acessa o calendário, suas áreas e permissões.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Login</th>
              <th className="px-4 py-2 text-left">Papel</th>
              <th className="px-4 py-2 text-left">Área</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum usuário cadastrado ainda. Clique em
                  <strong className="px-1 text-foreground">Novo usuário</strong>
                  para começar.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                  {u.email}
                </td>
                <td className="px-4 py-2.5">
                  {u.kind === "admin" ? (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <UserIcon className="h-3 w-3" /> Área
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{areaLabel(u.area)}</td>
                <td className="px-4 py-2.5">
                  {u.ativo ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-zinc-300 text-zinc-500">
                      Inativo
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setEditing(u)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 gap-1"
                      onClick={() => {
                        const nova = resetUsuarioSenha(u.id);
                        setResetInfo({ usr: u, pass: nova });
                      }}
                      title="Redefinir senha"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Senha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 gap-1"
                      onClick={() => updateUsuario(u.id, { ativo: !u.ativo })}
                      title={u.ativo ? "Desativar" : "Reativar"}
                    >
                      <Power className="h-3.5 w-3.5" /> {u.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDel(u)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Observação: os usuários iniciais (<code>ADMIN/ADMIN</code> e contas demo de cada área)
        continuam disponíveis para login mesmo que esta lista esteja vazia. Os usuários cadastrados
        aqui são compartilhados entre todos que abrirem o calendário.
      </p>

      <UsuarioFormDialog
        open={creating || !!editing}
        editing={editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSubmit={(data) => {
          if (editing) {
            updateUsuario(editing.id, data);
            toast.success("Usuário atualizado.");
          } else {
            addUsuario(data);
            toast.success("Usuário cadastrado.");
          }
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o acesso de <strong>{confirmDel?.nome}</strong> ({confirmDel?.email})
              imediatamente. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDel) removeUsuario(confirmDel.id);
                setConfirmDel(null);
                toast.success("Usuário removido.");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resetInfo} onOpenChange={(v) => !v && setResetInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Senha redefinida</DialogTitle>
            <DialogDescription>
              Copie a senha temporária abaixo e envie por e-mail para {resetInfo?.usr.nome}. Por
              segurança, ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">{resetInfo?.pass}</span>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              onClick={() => {
                if (resetInfo?.pass) {
                  navigator.clipboard?.writeText(resetInfo.pass);
                  toast.success("Senha copiada.");
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O envio automático de e-mail será ligado quando a integração de e-mail for configurada.
          </p>
          <DialogFooter>
            <Button onClick={() => setResetInfo(null)}>Pronto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function UsuarioFormDialog({
  open,
  editing,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  editing: UsuarioGerenciado | null;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: Omit<UsuarioGerenciado, "id" | "criadoEm" | "ativo">) => void;
}) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [kind, setKind] = React.useState<"admin" | "area">("area");
  const [area, setArea] = React.useState<AreaSlug>("nexus");

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setNome(editing.nome);
      setEmail(editing.email);
      setPass(editing.pass);
      setKind(editing.kind);
      setArea(editing.area ?? "nexus");
    } else {
      setNome("");
      setEmail("");
      setPass("");
      setKind("area");
      setArea("nexus");
    }
  }, [open, editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !pass.trim()) {
      toast.error("Preencha nome, e-mail/login e senha.");
      return;
    }
    onSubmit({
      nome: nome.trim(),
      email: email.trim(),
      pass: pass.trim(),
      kind,
      area: kind === "area" ? area : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize informações ou troque o papel do usuário."
              : "Cadastre quem terá acesso ao calendário."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="u-nome">Nome</Label>
            <Input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-mail / login</Label>
            <Input
              id="u-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex.: maria@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-pass">Senha {editing && <span className="text-muted-foreground">(altera ao salvar)</span>}</Label>
            <Input id="u-pass" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "admin" | "area")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select
                value={area}
                onValueChange={(v) => setArea(v as AreaSlug)}
                disabled={kind !== "area"}
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
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
