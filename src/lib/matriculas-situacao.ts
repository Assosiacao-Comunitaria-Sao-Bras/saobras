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
