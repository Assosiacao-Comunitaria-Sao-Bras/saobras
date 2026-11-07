import { supabase } from "@/lib/supabase";

export const LIMITE_VAGAS_TURMA = 10;

export const MENSAGEM_TURMA_LOTADA =
  "Não é possível matricular: esta turma já está lotada. O limite de " +
  LIMITE_VAGAS_TURMA +
  " alunos matriculados foi alcançado.";

/**
 * Confere se ainda há vaga na turma.
 * Retorna a mensagem de aviso se a turma estiver lotada, ou null se houver vaga.
 * Conta apenas matrículas em andamento (não encerradas e sem desistência).
 */
export async function verificarVagaNaTurma(
  turmaId: string
): Promise<string | null> {
  const { count, error } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("turma_id", turmaId)
    .is("encerrada_em", null)
    .is("desistiu_em", null);

  if (error) {
    throw new Error(
      "Não foi possível verificar as vagas da turma: " + error.message
    );
  }

  if ((count ?? 0) >= LIMITE_VAGAS_TURMA) {
    return MENSAGEM_TURMA_LOTADA;
  }

  return null;
}
