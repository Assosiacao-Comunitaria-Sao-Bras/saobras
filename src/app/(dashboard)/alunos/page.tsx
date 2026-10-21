import { createClient } from "@/lib/supabase/server";
import { AlunosClient } from "@/components/alunos/AlunosClient";
import type { RegistroFrequenciaAluno } from "@/lib/alunos-situacao";

export const revalidate = 0; // Disable cache during development

export default async function AlunosPage() {
  const supabase = await createClient();

  async function buscarPaginas<T>(consulta: (inicio: number, fim: number) => PromiseLike<{
    data: T[] | null; error: { message: string } | null;
  }>) {
    const registros: T[] = [];
    for (let inicio = 0; ; inicio += 1000) {
      const { data, error } = await consulta(inicio, inicio + 999);
      if (error) throw new Error(error.message);
      registros.push(...(data ?? []));
      if (!data || data.length < 1000) return registros;
    }
  }

  const [alunosResult, frequenciaResult] = await Promise.allSettled([
    buscarPaginas((inicio, fim) => supabase.from("alunos")
      .select("*, matriculas(*, cursos(titulo), turmas(nome))")
      .order("nome_completo").order("id").range(inicio, fim)),
    buscarPaginas<RegistroFrequenciaAluno>((inicio, fim) => supabase.from("presencas")
      .select("id, aluno_id, curso_id, turma_id, data_hora, status")
      .lte("data_hora", new Date().toISOString())
      .order("id").range(inicio, fim)),
  ]);

  if (alunosResult.status === "rejected") {
    return (
      <div className="w-full">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100">
          Não foi possível carregar os alunos. Atualize a página para tentar novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AlunosClient
        alunos={alunosResult.value}
        registrosFrequencia={frequenciaResult.status === "fulfilled" ? frequenciaResult.value : []}
        erroFrequencia={frequenciaResult.status === "rejected" ? "Frequência indisponível" : undefined}
      />
    </div>
  );
}
