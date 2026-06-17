import { AreaSlug, areaNome, Criticidade } from "@/lib/domain";

export type StageCompletedPayload = {
  obrigacaoId: string;
  obrigacaoNome: string;
  areaOrigem: AreaSlug;
  areaDestino: AreaSlug | null;
  acaoEsperada: string;
  prazo?: string;
  prioridade: Criticidade;
  usuario: string;
};

/**
 * Dispatches a stage-completed notification to all configured channels.
 * Server route handles channel fan-out, dedupe and credential safety.
 */
export async function notifyStageCompleted(p: StageCompletedPayload): Promise<void> {
  const chave = `${p.obrigacaoId}:${p.areaOrigem}->${p.areaDestino ?? "fim"}`;
  try {
    await fetch("/api/public/notify/stage-completed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chave,
        obrigacaoId: p.obrigacaoId,
        obrigacaoNome: p.obrigacaoNome,
        areaOrigem: p.areaOrigem,
        areaOrigemNome: areaNome(p.areaOrigem),
        areaDestino: p.areaDestino,
        areaDestinoNome: p.areaDestino ? areaNome(p.areaDestino) : null,
        acaoEsperada: p.acaoEsperada,
        prazo: p.prazo,
        prioridade: p.prioridade,
        usuario: p.usuario,
        timestamp: new Date().toISOString(),
        link: typeof window !== "undefined"
          ? `${window.location.origin}/?impacto=${p.obrigacaoId}`
          : `/?impacto=${p.obrigacaoId}`,
      }),
    });
  } catch (e) {
    // Notificações são best-effort.
    console.warn("[notify] falhou", e);
  }
}
