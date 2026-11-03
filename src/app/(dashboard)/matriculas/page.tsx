import { createClient } from "@/lib/supabase/server";
import MatriculasClient from "@/components/matriculas/MatriculasClient";
import { redirect } from "next/navigation";

export default async function MatriculasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matriculas, error } = await supabase
    .from("matriculas")
    .select("*, alunos(nome_completo, cpf, status_estudante), cursos(titulo), turmas(nome, horario, status)")
    .order("data_matricula", { ascending: false });

  if (error) throw new Error("Não foi possível carregar as matrículas: " + error.message);

  return <MatriculasClient matriculasIniciais={matriculas || []} />;
}
