import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  BookOpen,
  CheckSquare,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { redirect } from "next/navigation";
import { matriculaEstaAtiva, motivoMatriculaInativa } from "@/lib/matriculas-situacao";
import { turmaEstaNaGrade } from "@/lib/grade-semanal";
import { CartaoCursos, CartaoMatriculas } from "@/components/dashboard/CartoesExpansiveis";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    matriculas,
    resAlunos,
    resCursos,
    resTurmas,
    resPresencasAtivas,
    resFaltasAtivas,
  ] = await Promise.all([
    // Todas as matrículas (o Supabase limita cada consulta a 1000 linhas,
    // então buscamos em blocos). A classificação usa a mesma regra da página
    // de matrículas: ativa = sem encerramento/desistência, aluno e turma ativos.
    buscarTodasMatriculas(supabase),

    // Total de alunos cadastrados.
    supabase
      .from("alunos")
      .select("*", { count: "exact", head: true }),

    // Cursos cadastrados (para separar os que têm turma na grade dos que não têm).
    supabase.from("cursos").select("id, titulo").order("titulo", { ascending: true }),

    // Turmas com os campos necessários para saber se aparecem na grade semanal.
    supabase
      .from("turmas")
      .select("id, curso_id, status, turno, horario, data_hora_inicio, dias_semana"),

    // Presenças registradas nas turmas ativas.
    supabase
      .from("presencas")
      .select("id, turmas!inner(status)", {
        count: "exact",
        head: true,
      })
      .eq("turmas.status", "ativa")
      .eq("status", "presente"),

    // Faltas registradas nas turmas ativas.
    supabase
      .from("presencas")
      .select("id, turmas!inner(status)", {
        count: "exact",
        head: true,
      })
      .eq("turmas.status", "ativa")
      .eq("status", "falta"),
  ]);

  // Matrículas: ativas x inativas (com o motivo de cada inativa).
  const matriculasAtivas = matriculas.filter(matriculaEstaAtiva).length;
  const matriculasInativas = matriculas.length - matriculasAtivas;
  const contagemMotivos = { encerrada: 0, desistencia: 0, turma_encerrada: 0, aluno_inativo: 0 };
  matriculas.forEach((m) => {
    const motivo = motivoMatriculaInativa(m);
    if (motivo) contagemMotivos[motivo]++;
  });
  const motivosInativas = [
    { rotulo: "Matrícula encerrada", quantidade: contagemMotivos.encerrada },
    { rotulo: "Desistência", quantidade: contagemMotivos.desistencia },
    { rotulo: "Turma encerrada", quantidade: contagemMotivos.turma_encerrada },
    { rotulo: "Aluno inativo ou sem dados", quantidade: contagemMotivos.aluno_inativo },
  ];

  // Turmas e cursos: só entra o que aparece na grade semanal.
  const turmasNaGrade = (resTurmas.data ?? []).filter(turmaEstaNaGrade);
  const turmasPorCurso = new Map<string, number>();
  turmasNaGrade.forEach((t) =>
    turmasPorCurso.set(t.curso_id, (turmasPorCurso.get(t.curso_id) ?? 0) + 1)
  );
  const todosCursos = resCursos.data ?? [];
  const cursosAtivos = todosCursos
    .filter((c) => turmasPorCurso.has(c.id))
    .map((c) => ({ titulo: c.titulo, turmas: turmasPorCurso.get(c.id) ?? 0 }));
  const cursosInativos = todosCursos
    .filter((c) => !turmasPorCurso.has(c.id))
    .map((c) => ({ titulo: c.titulo }));

  const alunos = resAlunos.count ?? 0;
  const presencas = resPresencasAtivas.count ?? 0;
  const faltas = resFaltasAtivas.count ?? 0;

  const metricas = [
    {
      titulo: "Turmas na grade semanal",
      valor: turmasNaGrade.length,
      detalhe: "Somente turmas que aparecem na grade",
      icon: GraduationCap,
      cor: "violet",
    },
    {
      titulo: "Alunos cadastrados",
      valor: alunos,
      detalhe: "Total de participantes cadastrados",
      icon: Users,
      cor: "amber",
    },
    {
      titulo: "Presenças nas turmas ativas",
      valor: presencas,
      detalhe: "Registros de presença em turmas ativas",
      icon: CheckSquare,
      cor: "emerald",
    },
    {
      titulo: "Faltas nas turmas ativas",
      valor: faltas,
      detalhe: "Registros de falta em turmas ativas",
      icon: ClipboardList,
      cor: "blue",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Visão geral
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Acompanhe os principais números do Polo de Ciência e Tecnologia.
          </p>
        </div>

        <Link
          href="/matriculas"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Gerenciar matrículas
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CartaoMatriculas
          ativas={matriculasAtivas}
          inativas={matriculasInativas}
          motivos={motivosInativas}
        />

        {metricas.map(({ titulo, valor, detalhe, icon: Icon, cor }) => (
          <div
            key={titulo}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {titulo}
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  {valor}
                </p>

                <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
              </div>

              <div
                className={`rounded-xl p-3 ${
                  cor === "blue"
                    ? "bg-blue-50 text-blue-700"
                    : cor === "emerald"
                      ? "bg-emerald-50 text-emerald-700"
                      : cor === "violet"
                        ? "bg-violet-50 text-violet-700"
                        : "bg-amber-50 text-amber-700"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}

        <CartaoCursos ativos={cursosAtivos} inativos={cursosInativos} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Acesso rápido
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Module
            href="/cursos"
            title="Turmas"
            description="Consultar a grade e acessar as turmas."
            icon={BookOpen}
          />

          <Module
            href="/matriculas"
            title="Matrículas"
            description="Consultar e gerenciar matrículas ativas e encerradas."
            icon={GraduationCap}
          />

          <Module
            href="/alunos"
            title="Alunos"
            description="Consultar e atualizar os cadastros dos alunos."
            icon={Users}
          />

          <Module
            href="/checkin"
            title="Check-in"
            description="Registrar e acompanhar a frequência das turmas."
            icon={CheckSquare}
          />
        </div>
      </div>
    </div>
  );
}

function Module({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2.5 text-blue-700">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="font-bold text-slate-900 group-hover:text-blue-700">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

// Busca todas as matrículas em blocos de 1000 (limite padrão do Supabase).
async function buscarTodasMatriculas(supabase: ClienteSupabase) {
  const TAMANHO = 1000;
  const todas: Parameters<typeof matriculaEstaAtiva>[0][] = [];

  for (let inicio = 0; ; inicio += TAMANHO) {
    const { data, error } = await supabase
      .from("matriculas")
      .select("*, alunos(status_estudante), turmas(status)")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO - 1);

    if (error) throw new Error("Não foi possível carregar as matrículas: " + error.message);

    todas.push(...((data ?? []) as Parameters<typeof matriculaEstaAtiva>[0][]));
    if (!data || data.length < TAMANHO) break;
  }

  return todas;
}
