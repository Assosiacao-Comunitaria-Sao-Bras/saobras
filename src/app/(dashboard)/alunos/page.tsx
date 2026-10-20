import { createClient } from "@/lib/supabase/server";
import { AlunosClient } from "@/components/alunos/AlunosClient";

export const revalidate = 0; // Disable cache during development

export default async function AlunosPage() {
  const supabase = await createClient();

  const { data: alunos, error } = await supabase
    .from("alunos")
    .select(`
      *,
      matriculas (
        id
      )
    `)
    .order("nome_completo", { ascending: true });

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100">
          Erro ao carregar alunos: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AlunosClient alunos={alunos || []} />
    </div>
  );
}
