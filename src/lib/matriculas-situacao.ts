type SituacaoMatricula = {
  encerrada_em?: string | null;
  desistiu_em?: string | null;
  alunos?: { status_estudante?: boolean | null } | null;
  turmas?: { status?: string | null } | null;
};

// Dados ausentes não comprovam atividade; o registro continua no histórico.
export function matriculaEstaAtiva(matricula: SituacaoMatricula): boolean {
  return !matricula.encerrada_em
    && !matricula.desistiu_em
    && matricula.alunos?.status_estudante === true
    && matricula.turmas?.status === "ativa";
}

export type MotivoInativa = "encerrada" | "desistencia" | "turma_encerrada" | "aluno_inativo";

// Primeiro motivo que tira a matrícula da relação atual (null se estiver ativa).
// Cada matrícula inativa recebe um único motivo, na ordem de prioridade abaixo,
// para que a soma dos motivos feche com o total de inativas.
export function motivoMatriculaInativa(matricula: SituacaoMatricula): MotivoInativa | null {
  if (matriculaEstaAtiva(matricula)) return null;
  if (matricula.encerrada_em) return "encerrada";
  if (matricula.desistiu_em) return "desistencia";
  if (matricula.turmas?.status !== "ativa") return "turma_encerrada";
  return "aluno_inativo";
}
