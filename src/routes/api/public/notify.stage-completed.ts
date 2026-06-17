import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  chave: z.string(),
  obrigacaoId: z.string(),
  obrigacaoNome: z.string(),
  areaOrigem: z.string(),
  areaOrigemNome: z.string(),
  areaDestino: z.string().nullable(),
  areaDestinoNome: z.string().nullable(),
  acaoEsperada: z.string(),
  prazo: z.string().optional(),
  prioridade: z.string(),
  usuario: z.string(),
  timestamp: z.string(),
  link: z.string(),
});

type Payload = z.infer<typeof Body>;

interface Channel {
  name: string;
  send(p: Payload): Promise<void>;
}

const discordChannel: Channel = {
  name: "discord",
  async send(p) {
    const url = process.env.DISCORD_WEBHOOK_URL;
    if (!url) return; // sem webhook configurado: no-op
    const corPrioridade =
      p.prioridade === "Alta" ? 0xe11d48 : p.prioridade === "Média" ? 0xf59e0b : 0x6366f1;
    const embed = {
      title: `✅ ${p.areaOrigemNome} concluiu uma etapa`,
      description: `**${p.obrigacaoNome}**`,
      color: corPrioridade,
      url: p.link,
      fields: [
        { name: "Próxima área", value: p.areaDestinoNome ?? "— fluxo concluído —", inline: true },
        { name: "Prioridade", value: p.prioridade, inline: true },
        ...(p.prazo ? [{ name: "Prazo", value: p.prazo, inline: true }] : []),
        { name: "Ação esperada", value: p.acaoEsperada },
        { name: "Por", value: p.usuario, inline: true },
      ],
      timestamp: p.timestamp,
    };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  },
};

const channels: Channel[] = [discordChannel];

export const Route = createFileRoute("/api/public/notify/stage-completed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: Payload;
        try {
          parsed = Body.parse(await request.json());
        } catch (e) {
          return new Response(JSON.stringify({ error: "invalid payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        for (const ch of channels) {
          const chave = `${ch.name}:${parsed.chave}`;
          const { data: exists } = await supabaseAdmin
            .from("notificacoes_enviadas")
            .select("id")
            .eq("chave", chave)
            .maybeSingle();
          if (exists) continue;
          try {
            await ch.send(parsed);
            await supabaseAdmin.from("notificacoes_enviadas").insert({
              chave,
              canal: ch.name,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payload: parsed as any,
            });
          } catch (err) {
            console.warn(`[notify:${ch.name}] erro`, err);
          }
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
