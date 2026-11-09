import { supabase } from "./supabase";
import type { DadosDashboard } from "./dashboard-analise";

// Paginação explícita: os totais não ficam limitados à primeira página do banco.
export async function carregarDadosDashboard(signal: AbortSignal): Promise<DadosDashboard> {
  async function todos(tabela: string, campos: string): Promise<unknown[]> {
    const registros: unknown[] = [];
    for (let inicio = 0; ; inicio += 500) {
      const { data, error } = await supabase.from(tabela).select(campos)
        .order("id", { ascending: true }).range(inicio, inicio + 499).abortSignal(signal);
      if (error) throw new Error(`Não foi possível carregar ${tabela}. Tente atualizar os dados.`);
      if (signal.aborted) throw new DOMException("Consulta cancelada", "AbortError");
      registros.push(...(data ?? []));
      if (!data || data.length < 500) return registros;
    }
  }
  const [alunos, cursos, turmas, matriculas, presencas, operadores] = await Promise.all([
    todos("alunos", "id, nome_completo, criado_em, status_estudante, idade, data_nascimento, bairro, municipio"),
    todos("cursos", "id, titulo"),
    todos("turmas", "id, nome, curso_id, status, turno, horario, vagas, dias_semana, data_hora_inicio"),
    todos("matriculas", "id, aluno_id, curso_id, turma_id, data_matricula, encerrada_em, desistiu_em"),
    todos("presencas", "id, aluno_id, curso_id, turma_id, data_hora, status, metodo, operador_id"),
    todos("operadores", "id, nome"),
  ]);
  return { alunos, cursos, turmas, matriculas, presencas, operadores } as DadosDashboard;
}
