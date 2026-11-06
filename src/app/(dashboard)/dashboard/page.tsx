import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [resCursos, resTurmas] = await Promise.all([
    supabase
      .from("cursos")
      .select("id, titulo")
      .order("titulo"),
    supabase
      .from("turmas")
      .select(
        "id, nome, curso_id, horario, turno, vagas, status, data_hora_inicio, dias_semana, cursos(titulo)"
      )
      .order("nome"),
  ]);

  return (
    <DashboardClient
      cursos={resCursos.data || []}
      turmas={resTurmas.data || []}
    />
  );
}
