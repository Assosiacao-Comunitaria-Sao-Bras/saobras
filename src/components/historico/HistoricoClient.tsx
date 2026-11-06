"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  RotateCcw,
  Clock3,
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Layers3,
  School,
  AlertTriangle,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { turmaEstaNaGrade } from "@/lib/grade-semanal";
import { motivoMatriculaInativa } from "@/lib/matriculas-situacao";

type Curso = {
  id: string;
  titulo: string;
};

type Turma = {
  id: string;
  nome: string;
  curso_id: string;
  horario?: string | null;
  turno?: string | null;
  vagas?: number | null;
  status?: string | null;
  data_hora_inicio?: string | null;
  dias_semana?: string[] | null;
  cursos?: { titulo: string } | { titulo: string }[] | null;
};

type Aluno = {
  id: string;
  nome_completo: string;
  cpf?: string | null;
};

type Matricula = {
  id: string;
  aluno_id: string;
  curso_id: string;
  turma_id: string;
  data_matricula?: string | null;
  encerrada_em?: string | null;
  desistiu_em?: string | null;
  alunos?:
    | { nome_completo: string; status_estudante?: boolean | null }
    | { nome_completo: string; status_estudante?: boolean | null }[]
    | null;
  turmas?:
    | { status?: string | null }
    | { status?: string | null }[]
    | null;
};

type PresencaRegistro = {
  id: string;
  aluno_id: string;
  curso_id: string;
  turma_id: string;
  data_hora: string;
  metodo: string | null;
  operador_id: string | null;
  status: string | null;

  alunos:
    | {
        nome_completo: string;
        cpf: string | null;
      }
    | {
        nome_completo: string;
        cpf: string | null;
      }[]
    | null;

  cursos:
    | { titulo: string }
    | { titulo: string }[]
    | null;

  turmas:
    | {
        nome: string;
      }
    | {
        nome: string;
      }[]
    | null;

  operadores:
    | {
        nome: string;
      }
    | {
        nome: string;
      }[]
    | null;
};

type TurmaResumo = {
  id: string;
  nome: string;
  curso: string;
  horario: string;
  turno: string;
  alunos: number;
  vagas: number;
  ocupacao: number;
  presentes: number;
  faltas: number;
  registros: number;
  frequencia: number;
};

function pegarRelacao<T>(
  valor: T | T[] | null | undefined
): T | null {
  if (!valor) return null;

  return Array.isArray(valor)
    ? valor[0] || null
    : valor;
}

function normalizarStatus(
  status: string | null
) {
  return String(status || "presente")
    .toLowerCase()
    .trim();
}

function ehPresenca(
  status: string | null
) {
  const valor = normalizarStatus(status);

  return (
    valor === "presente" ||
    valor === "presença" ||
    valor === "presenca"
  );
}

function ehFalta(
  status: string | null
) {
  return normalizarStatus(status) === "falta";
}

function percentual(
  valor: number,
  total: number
) {
  if (!total) return 0;

  return Math.round(
    (valor / total) * 100
  );
}

function formatarData(
  data: string
) {
  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "pt-BR"
  );
}

function formatarHora(
  data: string
) {
  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function nomeHorario(
  turma: Turma
) {
  if (turma.horario) {
    return turma.horario;
  }

  if (turma.turno) {
    return turma.turno;
  }

  return "Horário não informado";
}

export default function HistoricoClient({
  cursos,
  turmas,
}: {
  cursos: Curso[];
  turmas: Turma[];
}) {
  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [matriculas, setMatriculas] =
    useState<Matricula[]>([]);

  const [presencas, setPresencas] =
    useState<PresencaRegistro[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [busca, setBusca] =
    useState("");

  const [cursoFiltro, setCursoFiltro] =
    useState("");

  const [turmaFiltro, setTurmaFiltro] =
    useState("");

  const [horarioFiltro, setHorarioFiltro] =
    useState("");

  const [abaHorario, setAbaHorario] =
    useState("todos");

  const [matriculasAbertas, setMatriculasAbertas] =
    useState(false);

  const [cursosAbertos, setCursosAbertos] =
    useState(false);

  const [abaCursos, setAbaCursos] =
    useState<"ativos" | "inativos">("ativos");

  async function carregarDados() {
    setCarregando(true);

    try {
      const [
        alunosRes,
        matriculasRes,
        presencasRes,
      ] = await Promise.all([
        supabase
          .from("alunos")
          .select(
            "id, nome_completo, cpf"
          ),

        supabase
          .from("matriculas")
          .select(
            "id, aluno_id, curso_id, turma_id, data_matricula, encerrada_em, desistiu_em, alunos(nome_completo, status_estudante), turmas(status)"
          ),

        supabase
          .from("presencas")
          .select(
            "id, aluno_id, curso_id, turma_id, data_hora, metodo, operador_id, status, alunos(nome_completo, cpf), cursos(titulo), turmas(nome), operadores(nome)"
          )
          .order(
            "data_hora",
            {
              ascending: false,
            }
          )
          .limit(5000),
      ]);

      if (alunosRes.error) {
        console.error(
          "Erro ao carregar alunos:",
          alunosRes.error
        );
      }

      if (matriculasRes.error) {
        console.error(
          "Erro ao carregar matrículas:",
          matriculasRes.error
        );
      }

      if (presencasRes.error) {
        console.error(
          "Erro ao carregar presenças:",
          presencasRes.error
        );
      }

      setAlunos(
        (alunosRes.data ||
          []) as Aluno[]
      );

      setMatriculas(
        (matriculasRes.data ||
          []) as Matricula[]
      );

      setPresencas(
        (presencasRes.data ||
          []) as unknown as PresencaRegistro[]
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  /*
   * ALUNOS EM MAIS DE UMA TURMA
   */
  const alunosPorTurma = useMemo(() => {
    const mapa = new Map<
      string,
      Set<string>
    >();

    matriculas.forEach(
      (matricula) => {
        if (!mapa.has(matricula.aluno_id)) {
          mapa.set(
            matricula.aluno_id,
            new Set()
          );
        }

        mapa
          .get(matricula.aluno_id)!
          .add(matricula.turma_id);
      }
    );

    return mapa;
  }, [matriculas]);

  const alunosEmMaisDeUmaTurma =
    useMemo(() => {
      let total = 0;

      alunosPorTurma.forEach(
        (turmasDoAluno) => {
          if (turmasDoAluno.size > 1) {
            total++;
          }
        }
      );

      return total;
    }, [alunosPorTurma]);

  const alunosEmUmaTurma =
    useMemo(() => {
      let total = 0;

      alunosPorTurma.forEach(
        (turmasDoAluno) => {
          if (turmasDoAluno.size === 1) {
            total++;
          }
        }
      );

      return total;
    }, [alunosPorTurma]);

  /*
   * ALUNOS POR TURMA
   */
  const matriculadosPorTurma =
    useMemo(() => {
      const mapa: Record<
        string,
        Set<string>
      > = {};

      matriculas.forEach(
        (matricula) => {
          if (!mapa[matricula.turma_id]) {
            mapa[matricula.turma_id] =
              new Set<string>();
          }

          mapa[
            matricula.turma_id
          ].add(
            matricula.aluno_id
          );
        }
      );

      return mapa;
    }, [matriculas]);

  /*
   * FREQUÊNCIA POR TURMA
   */
  const frequenciaPorTurma =
    useMemo(() => {
      const mapa: Record<
        string,
        {
          presentes: number;
          faltas: number;
        }
      > = {};

      presencas.forEach(
        (presenca) => {
          if (
            !mapa[presenca.turma_id]
          ) {
            mapa[presenca.turma_id] = {
              presentes: 0,
              faltas: 0,
            };
          }

          if (
            ehPresenca(
              presenca.status
            )
          ) {
            mapa[
              presenca.turma_id
            ].presentes++;
          }

          if (
            ehFalta(
              presenca.status
            )
          ) {
            mapa[
              presenca.turma_id
            ].faltas++;
          }
        }
      );

      return mapa;
    }, [presencas]);

  /*
   * RESUMO DAS TURMAS
   */
  const resumoTurmas =
    useMemo<TurmaResumo[]>(() => {
      return turmas.map(
        (turma) => {
          const curso =
            pegarRelacao(
              turma.cursos
            ) ||
            cursos.find(
              (curso) =>
                curso.id ===
                turma.curso_id
            );

          const alunos =
            matriculadosPorTurma[
              turma.id
            ]?.size || 0;

          const vagas =
            Number(turma.vagas) ||
            0;

          const ocupacao =
            vagas > 0
              ? Math.min(
                  100,
                  percentual(
                    alunos,
                    vagas
                  )
                )
              : 0;

          const frequencia =
            frequenciaPorTurma[
              turma.id
            ] || {
              presentes: 0,
              faltas: 0,
            };

          const registros =
            frequencia.presentes +
            frequencia.faltas;

          return {
            id: turma.id,
            nome: turma.nome,
            curso:
              curso?.titulo ||
              "Curso não informado",
            horario:
              turma.horario ||
              "Horário não informado",
            turno:
              turma.turno ||
              "Não informado",
            alunos,
            vagas,
            ocupacao,
            presentes:
              frequencia.presentes,
            faltas:
              frequencia.faltas,
            registros,
            frequencia:
              percentual(
                frequencia.presentes,
                registros
              ),
          };
        }
      );
    }, [
      turmas,
      cursos,
      matriculadosPorTurma,
      frequenciaPorTurma,
    ]);

  /*
   * TURMAS FILTRADAS
   */
  const turmasFiltradas =
    useMemo(() => {
      return resumoTurmas.filter(
        (turma) => {
          const termo =
            busca
              .trim()
              .toLowerCase();

          const bateBusca =
            !termo ||
            turma.nome
              .toLowerCase()
              .includes(termo) ||
            turma.curso
              .toLowerCase()
              .includes(termo);

          const bateCurso =
            !cursoFiltro ||
            turmas.find(
              (t) =>
                t.id === turma.id
            )?.curso_id ===
              cursoFiltro;

          const bateTurma =
            !turmaFiltro ||
            turma.id ===
              turmaFiltro;

          const bateHorario =
            !horarioFiltro ||
            turma.horario ===
              horarioFiltro;

          return (
            bateBusca &&
            bateCurso &&
            bateTurma &&
            bateHorario
          );
        }
      );
    }, [
      resumoTurmas,
      busca,
      cursoFiltro,
      turmaFiltro,
      horarioFiltro,
      turmas,
    ]);

  /*
   * ALUNOS COM MATRÍCULA ATIVA
   * Mesma regra da página de Matrículas (sem encerramento, sem desistência,
   * aluno ativo e turma ativa).
   */
  const alunosComMatriculaAtiva =
    useMemo(() => {
      const ids = new Set<string>();

      matriculas.forEach(
        (matricula) => {
          const motivo =
            motivoMatriculaInativa({
              encerrada_em:
                matricula.encerrada_em,
              desistiu_em:
                matricula.desistiu_em,
              alunos: pegarRelacao(
                matricula.alunos
              ),
              turmas: pegarRelacao(
                matricula.turmas
              ),
            });

          if (!motivo) {
            ids.add(
              matricula.aluno_id
            );
          }
        }
      );

      return ids;
    }, [matriculas]);

  /*
   * PRESENÇAS E FALTAS
   * Só dos alunos que têm matrícula ativa.
   */
  const presencasDeAtivos =
    useMemo(
      () =>
        presencas.filter(
          (p) =>
            alunosComMatriculaAtiva.has(
              p.aluno_id
            )
        ),
      [presencas, alunosComMatriculaAtiva]
    );

  const totalPresencas =
    useMemo(
      () =>
        presencasDeAtivos.filter(
          (p) =>
            ehPresenca(
              p.status
            )
        ).length,
      [presencasDeAtivos]
    );

  const totalFaltas =
    useMemo(
      () =>
        presencasDeAtivos.filter(
          (p) =>
            ehFalta(
              p.status
            )
        ).length,
      [presencasDeAtivos]
    );

  const totalRegistros =
    totalPresencas +
    totalFaltas;

  const frequenciaGeral =
    percentual(
      totalPresencas,
      totalRegistros
    );

  /*
   * HORÁRIOS
   */
  const horarios =
    useMemo(() => {
      const lista =
        resumoTurmas.map(
          (turma) =>
            turma.horario
        );

      return Array.from(
        new Set(
          lista.filter(
            (item) =>
              item &&
              item !==
                "Horário não informado"
          )
        )
      ).sort();
    }, [resumoTurmas]);

  /*
   * TURMAS AGRUPADAS POR HORÁRIO
   */
  const turmasPorHorario =
    useMemo(() => {
      const grupos: Record<
        string,
        TurmaResumo[]
      > = {};

      resumoTurmas.forEach(
        (turma) => {
          const horario =
            turma.horario ||
            "Horário não informado";

          if (!grupos[horario]) {
            grupos[horario] = [];
          }

          grupos[horario].push(
            turma
          );
        }
      );

      return grupos;
    }, [resumoTurmas]);

  /*
   * ALUNOS POR CURSO
   */
  const alunosPorCurso =
    useMemo(() => {
      return cursos
        .map((curso) => {
          const ids =
            new Set<string>();

          matriculas.forEach(
            (matricula) => {
              if (
                matricula.curso_id ===
                curso.id
              ) {
                ids.add(
                  matricula.aluno_id
                );
              }
            }
          );

          return {
            curso:
              curso.titulo,
            total: ids.size,
          };
        })
        .filter(
          (item) =>
            item.total > 0
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [
      cursos,
      matriculas,
    ]);

  /*
   * FREQUÊNCIA POR CURSO
   */
  const frequenciaPorCurso =
    useMemo(() => {
      return cursos
        .map((curso) => {
          let presentes = 0;
          let faltas = 0;

          presencas.forEach(
            (presenca) => {
              if (
                presenca.curso_id !==
                curso.id
              ) {
                return;
              }

              if (
                ehPresenca(
                  presenca.status
                )
              ) {
                presentes++;
              }

              if (
                ehFalta(
                  presenca.status
                )
              ) {
                faltas++;
              }
            }
          );

          const total =
            presentes + faltas;

          return {
            curso:
              curso.titulo,
            presentes,
            faltas,
            frequencia:
              percentual(
                presentes,
                total
              ),
          };
        })
        .filter(
          (item) =>
            item.presentes +
              item.faltas >
            0
        )
        .sort(
          (a, b) =>
            b.frequencia -
            a.frequencia
        );
    }, [
      cursos,
      presencas,
    ]);

  /*
   * ÚLTIMOS REGISTROS
   */
  const atividadesRecentes =
    useMemo(() => {
      return presencas
        .slice()
        .sort(
          (a, b) =>
            new Date(
              b.data_hora
            ).getTime() -
            new Date(
              a.data_hora
            ).getTime()
        )
        .slice(0, 8)
        .map((item) => {
          const aluno =
            pegarRelacao(
              item.alunos
            );

          const curso =
            pegarRelacao(
              item.cursos
            );

          const turma =
            pegarRelacao(
              item.turmas
            );

          return {
            id: item.id,
            aluno:
              aluno?.nome_completo ||
              "Aluno não identificado",
            curso:
              curso?.titulo ||
              "Curso não identificado",
            turma:
              turma?.nome ||
              "Turma não identificada",
            status:
              ehFalta(
                item.status
              )
                ? "Falta"
                : "Presença",
            data:
              item.data_hora,
          };
        });
    }, [presencas]);

  /*
   * RANKING DAS TURMAS
   */
  const rankingTurmas =
    useMemo(() => {
      return [...resumoTurmas]
        .filter(
          (turma) =>
            turma.registros > 0
        )
        .sort(
          (a, b) =>
            b.frequencia -
            a.frequencia
        );
    }, [resumoTurmas]);

  /*
   * OCUPAÇÃO
   */
  const turmasLotadas =
    resumoTurmas.filter(
      (turma) =>
        turma.vagas > 0 &&
        turma.alunos >=
          turma.vagas
    ).length;

  const turmasSemVaga =
    resumoTurmas.filter(
      (turma) =>
        turma.vagas === 0
    ).length;

  /*
   * MATRÍCULAS ATIVAS X INATIVAS
   * Mesma regra da página de Matrículas: ativa = sem encerramento,
   * sem desistência, aluno ativo e turma ativa.
   */
  const resumoMatriculas =
    useMemo(() => {
      const motivos = {
        encerrada: 0,
        desistencia: 0,
        turma_encerrada: 0,
        aluno_inativo: 0,
      };

      let ativas = 0;

      matriculas.forEach(
        (matricula) => {
          const motivo =
            motivoMatriculaInativa({
              encerrada_em:
                matricula.encerrada_em,
              desistiu_em:
                matricula.desistiu_em,
              alunos: pegarRelacao(
                matricula.alunos
              ),
              turmas: pegarRelacao(
                matricula.turmas
              ),
            });

          if (motivo) {
            motivos[motivo]++;
          } else {
            ativas++;
          }
        }
      );

      return {
        ativas,
        inativas:
          matriculas.length - ativas,
        motivos,
      };
    }, [matriculas]);

  /*
   * TURMAS E CURSOS DA GRADE SEMANAL
   * Só conta o que aparece na grade semanal de Cursos e Turmas.
   */
  const turmasNaGrade =
    useMemo(
      () =>
        turmas.filter(
          turmaEstaNaGrade
        ),
      [turmas]
    );

  const turmasNaGradeLotadas =
    useMemo(() => {
      const ids = new Set(
        turmasNaGrade.map(
          (turma) => turma.id
        )
      );

      return resumoTurmas.filter(
        (turma) =>
          ids.has(turma.id) &&
          turma.vagas > 0 &&
          turma.alunos >=
            turma.vagas
      ).length;
    }, [turmasNaGrade, resumoTurmas]);

  const cursosPorGrade =
    useMemo(() => {
      const contagem = new Map<
        string,
        number
      >();

      turmasNaGrade.forEach(
        (turma) => {
          contagem.set(
            turma.curso_id,
            (contagem.get(
              turma.curso_id
            ) || 0) + 1
          );
        }
      );

      return {
        ativos: cursos
          .filter((curso) =>
            contagem.has(curso.id)
          )
          .map((curso) => ({
            id: curso.id,
            titulo: curso.titulo,
            turmas:
              contagem.get(
                curso.id
              ) || 0,
          })),
        inativos: cursos.filter(
          (curso) =>
            !contagem.has(curso.id)
        ),
      };
    }, [cursos, turmasNaGrade]);

  /*
   * LIMPAR FILTROS
   */
  function limparFiltros() {
    setBusca("");
    setCursoFiltro("");
    setTurmaFiltro("");
    setHorarioFiltro("");
    setAbaHorario("todos");
  }

  const turmasDaAba =
    abaHorario === "todos"
      ? turmasFiltradas
      : turmasFiltradas.filter(
          (turma) =>
            turma.horario ===
            abaHorario
        );

  return (
    <div className="min-h-full bg-slate-50 px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* CABEÇALHO */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <BarChart3 className="h-4 w-4" />
              Painel de gestão
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Visão geral de alunos, matrículas, turmas,
              horários e frequência.
            </p>
          </div>

          <button
            onClick={carregarDados}
            disabled={carregando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={
                carregando
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />

            Atualizar
          </button>
        </div>

        {/* CARDS PRINCIPAIS */}
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <DashboardCard
            icon={Users}
            title="Alunos"
            value={alunos.length}
            description="Alunos cadastrados"
          />

          <DashboardCard
            icon={ClipboardList}
            title="Matrículas"
            value={resumoMatriculas.ativas}
            description="Ativas"
            aberto={matriculasAbertas}
            onClick={() =>
              setMatriculasAbertas(
                (valor) => !valor
              )
            }
          />

          <DashboardCard
            icon={Layers3}
            title="Turmas"
            value={turmasNaGrade.length}
            description={`Na grade semanal · ${turmasNaGradeLotadas} lotada(s)`}
          />

          <DashboardCard
            icon={TrendingUp}
            title="Frequência"
            value={`${frequenciaGeral}%`}
            description={`${totalPresencas} presenças`}
            destaque
          />

        </div>

        {/* DETALHE DAS MATRÍCULAS: ATIVAS X INATIVAS */}
        {matriculasAbertas && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">
                Matrículas: total, ativas e inativas
              </h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Total
                </div>

                <div className="mt-1 text-3xl font-bold text-blue-800">
                  {matriculas.length}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Ativas
                </div>

                <div className="mt-1 text-3xl font-bold text-emerald-800">
                  {resumoMatriculas.ativas}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Inativas
                </div>

                <div className="mt-1 text-3xl font-bold text-slate-700">
                  {resumoMatriculas.inativas}
                </div>
              </div>

            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${percentual(
                      resumoMatriculas.ativas,
                      matriculas.length
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-xs text-slate-500">
                {percentual(
                  resumoMatriculas.ativas,
                  matriculas.length
                )}
                % das matrículas estão ativas
              </p>
            </div>

            {resumoMatriculas.inativas > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Por que estão inativas
                </p>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoMini
                    label="Matrícula encerrada"
                    value={resumoMatriculas.motivos.encerrada}
                  />
                  <InfoMini
                    label="Desistência"
                    value={resumoMatriculas.motivos.desistencia}
                  />
                  <InfoMini
                    label="Turma encerrada"
                    value={resumoMatriculas.motivos.turma_encerrada}
                  />
                  <InfoMini
                    label="Aluno inativo ou sem dados"
                    value={resumoMatriculas.motivos.aluno_inativo}
                  />
                </div>
              </div>
            )}

          </section>
        )}

        {/* SEGUNDA LINHA DE INDICADORES */}
        <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SmallMetric
            icon={UserPlus}
            title="Alunos em mais de uma turma"
            value={alunosEmMaisDeUmaTurma}
            description={
              alunos.length
                ? `${percentual(
                    alunosEmMaisDeUmaTurma,
                    alunos.length
                  )}% dos alunos`
                : "Sem dados"
            }
            tone="purple"
          />

          <SmallMetric
            icon={CheckCircle2}
            title="Presenças"
            value={totalPresencas}
            description="De alunos com matrícula ativa"
            tone="green"
          />

          <SmallMetric
            icon={XCircle}
            title="Faltas"
            value={totalFaltas}
            description="De alunos com matrícula ativa"
            tone="red"
          />

          <SmallMetric
            icon={School}
            title="Cursos ativos"
            value={cursosPorGrade.ativos.length}
            description="Com turma na grade"
            tone="blue"
            aberto={cursosAbertos}
            onClick={() =>
              setCursosAbertos(
                (valor) => !valor
              )
            }
          />

        </div>

        {/* DETALHE DOS CURSOS: ATIVOS X INATIVOS */}
        {cursosAbertos && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-slate-900">
                Cursos: ativos e inativos
              </h2>

              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {(
                  [
                    {
                      id: "ativos",
                      rotulo: "Ativos",
                      total: cursosPorGrade.ativos.length,
                    },
                    {
                      id: "inativos",
                      rotulo: "Inativos",
                      total: cursosPorGrade.inativos.length,
                    },
                  ] as const
                ).map((aba) => (
                  <button
                    key={aba.id}
                    type="button"
                    onClick={() => setAbaCursos(aba.id)}
                    className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                      abaCursos === aba.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {aba.rotulo} ({aba.total})
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {abaCursos === "ativos" &&
                cursosPorGrade.ativos.map((curso) => (
                  <li
                    key={curso.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">
                      {curso.titulo}
                    </span>

                    <span className="shrink-0 text-xs text-emerald-700">
                      {curso.turmas}{" "}
                      {curso.turmas === 1 ? "turma" : "turmas"}
                    </span>
                  </li>
                ))}

              {abaCursos === "inativos" &&
                cursosPorGrade.inativos.map((curso) => (
                  <li
                    key={curso.id}
                    className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    {curso.titulo}
                  </li>
                ))}
            </ul>

            {abaCursos === "ativos" &&
              cursosPorGrade.ativos.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  Nenhum curso com turma na grade.
                </p>
              )}

            {abaCursos === "inativos" &&
              cursosPorGrade.inativos.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  Todos os cursos têm turma na grade.
                </p>
              )}

            <p className="mt-3 text-[11px] text-slate-400">
              Ativo = curso com pelo menos uma turma na grade semanal.
              Inativo = curso cadastrado sem turma na grade.
            </p>

          </section>
        )}

        {/* DESTAQUE: ALUNOS EM VÁRIAS TURMAS */}
        <section className="mt-6 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <UserPlus className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Alunos em mais de uma turma
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Existem{" "}
                  <strong className="text-purple-700">
                    {alunosEmMaisDeUmaTurma}
                  </strong>{" "}
                  aluno(s) matriculado(s) em duas ou mais turmas.
                  Isso ajuda a identificar alunos com múltiplas
                  matrículas e acompanhar melhor a carga de aulas.
                </p>
              </div>

            </div>

            <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm ring-1 ring-purple-100">

              <div className="text-3xl font-bold text-purple-700">
                {alunosEmMaisDeUmaTurma}
              </div>

              <div className="text-xs font-medium text-slate-500">
                alunos em múltiplas turmas
              </div>

            </div>

          </div>

        </section>

        {/* FILTROS */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Filtros
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Refine a visão das turmas.
              </p>
            </div>

            <button
              onClick={limparFiltros}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </button>

          </div>

          <div className="grid gap-3 md:grid-cols-4">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={busca}
                onChange={(e) =>
                  setBusca(e.target.value)
                }
                placeholder="Buscar turma ou curso..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={cursoFiltro}
              onChange={(e) => {
                setCursoFiltro(
                  e.target.value
                );
                setTurmaFiltro("");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              <option value="">
                Todos os cursos
              </option>

              {cursos.map((curso) => (
                <option
                  key={curso.id}
                  value={curso.id}
                >
                  {curso.titulo}
                </option>
              ))}
            </select>

            <select
              value={turmaFiltro}
              onChange={(e) =>
                setTurmaFiltro(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              <option value="">
                Todas as turmas
              </option>

              {turmas
                .filter(
                  (turma) =>
                    !cursoFiltro ||
                    turma.curso_id ===
                      cursoFiltro
                )
                .map((turma) => (
                  <option
                    key={turma.id}
                    value={turma.id}
                  >
                    {turma.nome}
                  </option>
                ))}
            </select>

            <select
              value={horarioFiltro}
              onChange={(e) =>
                setHorarioFiltro(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              <option value="">
                Todos os horários
              </option>

              {horarios.map(
                (horario) => (
                  <option
                    key={horario}
                    value={horario}
                  >
                    {horario}
                  </option>
                )
              )}
            </select>

          </div>
        </section>

        {/* GRÁFICOS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* ALUNOS POR CURSO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="font-bold text-slate-900">
                  Alunos por curso
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Quantidade de alunos distintos matriculados.
                </p>
              </div>

              <GraduationCap className="h-5 w-5 text-emerald-500" />

            </div>

            <div className="space-y-4">

              {alunosPorCurso.length === 0 ? (
                <EmptyState text="Nenhuma matrícula encontrada." />
              ) : (
                alunosPorCurso.map(
                  (item, index) => {
                    const maior =
                      alunosPorCurso[0]
                        ?.total || 1;

                    const largura =
                      Math.round(
                        (item.total /
                          maior) *
                          100
                      );

                    return (
                      <div
                        key={item.curso}
                      >

                        <div className="mb-1.5 flex items-center justify-between gap-3">

                          <span className="truncate text-sm font-medium text-slate-700">
                            {index + 1}.{" "}
                            {item.curso}
                          </span>

                          <span className="shrink-0 text-sm font-bold text-slate-900">
                            {item.total}
                          </span>

                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{
                              width: `${largura}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </section>

          {/* FREQUÊNCIA POR CURSO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="font-bold text-slate-900">
                  Frequência por curso
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Comparação entre presença e falta.
                </p>
              </div>

              <BarChart3 className="h-5 w-5 text-blue-500" />

            </div>

            <div className="space-y-5">

              {frequenciaPorCurso.length === 0 ? (
                <EmptyState text="Ainda não existem registros de frequência." />
              ) : (
                frequenciaPorCurso.map(
                  (item) => (
                    <div
                      key={item.curso}
                    >

                      <div className="mb-1.5 flex items-center justify-between gap-3">

                        <span className="truncate text-sm font-medium text-slate-700">
                          {item.curso}
                        </span>

                        <span className="font-bold text-slate-900">
                          {item.frequencia}%
                        </span>

                      </div>

                      <div className="flex h-3 overflow-hidden rounded-full bg-red-100">

                        <div
                          className="bg-emerald-500"
                          style={{
                            width: `${item.frequencia}%`,
                          }}
                        />

                      </div>

                      <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">

                        <span>
                          {item.presentes} presentes
                        </span>

                        <span>
                          {item.faltas} faltas
                        </span>

                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </section>

        </div>

        {/* TURMAS POR HORÁRIO */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <Clock3 className="h-5 w-5 text-indigo-500" />

                  <h2 className="font-bold text-slate-900">
                    Turmas por horário
                  </h2>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Organize as turmas conforme os horários cadastrados.
                </p>

              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  onClick={() =>
                    setAbaHorario(
                      "todos"
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    abaHorario ===
                    "todos"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todos
                </button>

                {horarios.map(
                  (horario) => (
                    <button
                      key={horario}
                      onClick={() =>
                        setAbaHorario(
                          horario
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        abaHorario ===
                        horario
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {horario}
                    </button>
                  )
                )}

              </div>

            </div>

          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">

            {turmasDaAba.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState text="Nenhuma turma encontrada para esse horário." />
              </div>
            ) : (
              turmasDaAba.map(
                (turma) => (
                  <div
                    key={turma.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-white"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <h3 className="truncate font-bold text-slate-900">
                          {turma.nome}
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {turma.curso}
                        </p>

                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                        <Clock3 className="h-3 w-3" />
                        {turma.horario}
                      </span>

                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">

                      <InfoMini
                        label="Alunos"
                        value={turma.alunos}
                      />

                      <InfoMini
                        label="Presença"
                        value={`${turma.frequencia}%`}
                      />

                      <InfoMini
                        label="Faltas"
                        value={turma.faltas}
                      />

                    </div>

                    <div className="mt-4">

                      <div className="mb-1 flex justify-between text-[11px] text-slate-500">

                        <span>
                          Ocupação
                        </span>

                        <span className="font-semibold">
                          {turma.vagas
                            ? `${turma.alunos}/${turma.vagas}`
                            : `${turma.alunos} alunos`}
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${
                              turma.vagas
                                ? Math.min(
                                    100,
                                    turma.ocupacao
                                  )
                                : 0
                            }%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </section>

        {/* RANKING + OCUPAÇÃO */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* RANKING */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">

              <div className="flex items-center gap-2">

                <TrendingUp className="h-5 w-5 text-emerald-500" />

                <div>

                  <h2 className="font-bold text-slate-900">
                    Ranking de frequência
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Turmas com melhor percentual de presença.
                  </p>

                </div>

              </div>

            </div>

            <div className="divide-y divide-slate-100">

              {rankingTurmas.length === 0 ? (
                <EmptyState text="Ainda não existem dados suficientes." />
              ) : (
                rankingTurmas
                  .slice(0, 6)
                  .map(
                    (turma, index) => (
                      <div
                        key={turma.id}
                        className="flex items-center gap-3 p-4"
                      >

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="truncate text-sm font-semibold text-slate-800">
                            {turma.nome}
                          </div>

                          <div className="mt-0.5 truncate text-xs text-slate-400">
                            {turma.curso}
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-sm font-bold text-emerald-600">
                            {turma.frequencia}%
                          </div>

                          <div className="text-[10px] text-slate-400">
                            frequência
                          </div>

                        </div>

                      </div>
                    )
                  )
              )}

            </div>

          </section>

          {/* OCUPAÇÃO */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">

              <div className="flex items-center gap-2">

                <Users className="h-5 w-5 text-blue-500" />

                <div>

                  <h2 className="font-bold text-slate-900">
                    Ocupação das turmas
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Distribuição das vagas disponíveis.
                  </p>

                </div>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 p-5">

              <div className="rounded-xl bg-blue-50 p-5">

                <Users className="h-5 w-5 text-blue-600" />

                <div className="mt-3 text-3xl font-bold text-blue-700">
                  {resumoTurmas.reduce(
                    (total, turma) =>
                      total +
                      turma.alunos,
                    0
                  )}
                </div>

                <div className="mt-1 text-xs text-blue-700/70">
                  alunos em turmas
                </div>

              </div>

              <div className="rounded-xl bg-orange-50 p-5">

                <AlertTriangle className="h-5 w-5 text-orange-600" />

                <div className="mt-3 text-3xl font-bold text-orange-700">
                  {turmasLotadas}
                </div>

                <div className="mt-1 text-xs text-orange-700/70">
                  turmas lotadas
                </div>

              </div>

              <div className="rounded-xl bg-emerald-50 p-5">

                <UserCheck className="h-5 w-5 text-emerald-600" />

                <div className="mt-3 text-3xl font-bold text-emerald-700">
                  {resumoTurmas.reduce(
                    (total, turma) =>
                      total +
                      Math.max(
                        0,
                        turma.vagas -
                          turma.alunos
                      ),
                    0
                  )}
                </div>

                <div className="mt-1 text-xs text-emerald-700/70">
                  vagas restantes
                </div>

              </div>

              <div className="rounded-xl bg-slate-100 p-5">

                <BookOpen className="h-5 w-5 text-slate-600" />

                <div className="mt-3 text-3xl font-bold text-slate-700">
                  {turmasSemVaga}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  sem limite informado
                </div>

              </div>

            </div>

          </section>

        </div>

        {/* ATIVIDADE RECENTE */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5">

            <div className="flex items-center gap-2">

              <CalendarDays className="h-5 w-5 text-emerald-600" />

              <div>

                <h2 className="font-bold text-slate-900">
                  Frequência recente
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Últimos registros de presença e falta.
                </p>

              </div>

            </div>

          </div>

          {atividadesRecentes.length ===
          0 ? (
            <EmptyState text="Ainda não existem registros de frequência." />
          ) : (
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">

              {atividadesRecentes.map(
                (atividade) => {
                  const presente =
                    atividade.status ===
                    "Presença";

                  return (
                    <div
                      key={
                        atividade.id
                      }
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-2">

                        <div className="min-w-0">

                          <div className="truncate text-sm font-bold text-slate-800">
                            {
                              atividade.aluno
                            }
                          </div>

                          <div className="mt-1 truncate text-xs text-slate-500">
                            {
                              atividade.turma
                            }
                          </div>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                            presente
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {
                            atividade.status
                          }
                        </span>

                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">

                        <CalendarDays className="h-3.5 w-3.5" />

                        {
                          formatarData(
                            atividade.data
                          )
                        }

                        <span>•</span>

                        <Clock3 className="h-3.5 w-3.5" />

                        {
                          formatarHora(
                            atividade.data
                          )
                        }

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTES AUXILIARES
============================================================ */

function DashboardCard({
  icon: Icon,
  title,
  value,
  description,
  destaque = false,
  onClick,
  aberto = false,
}: {
  icon: typeof Users;
  title: string;
  value: string | number;
  description: string;
  destaque?: boolean;
  onClick?: () => void;
  aberto?: boolean;
}) {
  const classes = `rounded-2xl border p-5 text-left shadow-sm ${
    destaque
      ? "border-emerald-200 bg-emerald-50"
      : "border-slate-200 bg-white"
  } ${onClick ? "w-full cursor-pointer transition hover:bg-slate-50" : ""}`;

  const corpo = (
    <>

      <div className="flex items-center justify-between">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            destaque
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {destaque && (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        )}

      </div>

      <div className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-700">
        {title}
      </div>

      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
        {description}

        {onClick && (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${
              aberto ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={aberto}
      className={classes}
    >
      {corpo}
    </button>
  ) : (
    <div className={classes}>{corpo}</div>
  );
}

function SmallMetric({
  icon: Icon,
  title,
  value,
  description,
  tone,
  onClick,
  aberto = false,
}: {
  icon: typeof Users;
  title: string;
  value: string | number;
  description: string;
  tone:
    | "purple"
    | "green"
    | "red"
    | "blue";
  onClick?: () => void;
  aberto?: boolean;
}) {
  const classes = {
    purple:
      "bg-purple-50 text-purple-600",
    green:
      "bg-emerald-50 text-emerald-600",
    red:
      "bg-red-50 text-red-600",
    blue:
      "bg-blue-50 text-blue-600",
  };

  const caixa =
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" +
    (onClick
      ? " w-full cursor-pointer text-left transition hover:bg-slate-50"
      : "");

  const corpo = (
    <>

      <div className="flex items-start gap-3">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${classes[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <div className="text-xs font-medium text-slate-500">
            {title}
          </div>

          <div className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            {description}

            {onClick && (
              <ChevronDown
                className={`h-3 w-3 shrink-0 transition-transform ${
                  aberto ? "rotate-180" : ""
                }`}
              />
            )}
          </div>

        </div>

      </div>

    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={aberto}
      className={caixa}
    >
      {corpo}
    </button>
  ) : (
    <div className={caixa}>{corpo}</div>
  );
}

function InfoMini({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white p-2.5 text-center ring-1 ring-slate-100">

      <div className="text-sm font-bold text-slate-800">
        {value}
      </div>

      <div className="mt-0.5 text-[10px] text-slate-400">
        {label}
      </div>

    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-10 text-center">

      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <BookOpen className="h-5 w-5 text-slate-400" />
      </div>

      <p className="mt-3 text-sm text-slate-400">
        {text}
      </p>

    </div>
  );
}
