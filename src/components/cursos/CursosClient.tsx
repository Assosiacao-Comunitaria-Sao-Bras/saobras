"use client";

import { Fragment, useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, BookOpen, Clock, X, Save, Archive, RotateCcw, ChevronDown, ChevronUp, Users, CheckCircle2, XCircle, ClipboardList, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DIAS_SEMANA, HORARIOS, HORARIOS_DESATIVADOS, getHorarioByLabel, getHorarioLabel } from "@/lib/grade-semanal";

export type Curso = {
  id: string;
  titulo: string;
  descricao: string | null;
  carga_horaria?: number | null;
  criado_por?: string | null;
  criado_em?: string;
};

export type Turma = {
  id: string;
  nome: string;
  curso_id: string;
  dias_semana: string[] | null;
  turno: string | null;
  horario: string | null;
  professor?: string | null;
  data_hora_inicio: string | null;
  data_hora_fim: string | null;
  vagas?: number;
  status?: string | null;
  criado_em?: string | null;
  data_encerramento?: string | null;
  cursos?: { titulo: string } | null;
};

const LIMITE_VAGAS = 10;
const PROFESSORES = [
  "Elias Brito Lima Machado",
  "Beatriz Santos Silva Pinho",
  "Emerson Lucas Sacramento Lima",
  "Gustavo Bezerra Nonato",
];
const TURNOS = ["Manhã", "Tarde"];

function criarDatasHorario(horarioLabel: string) {
  const horario = getHorarioByLabel(horarioLabel);
  if (!horario) throw new Error("Horário selecionado é inválido.");
  
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  
  const inicio = `${ano}-${mes}-${dia}T${horario.inicio}:00-03:00`;
  const fim = `${ano}-${mes}-${dia}T${horario.fim}:00-03:00`;
  
  return { inicio, fim };
}

const COLOR_THEMES = {
  blue: {
    cardBorder: 'border-t-blue-500',
    gridCard: 'bg-blue-50 border-blue-400 hover:bg-blue-100',
    gridTextSub: 'text-blue-700',
    listCard: 'border-l-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  green: {
    cardBorder: 'border-t-emerald-500',
    gridCard: 'bg-emerald-50 border-emerald-400 hover:bg-emerald-100',
    gridTextSub: 'text-emerald-700',
    listCard: 'border-l-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  orange: {
    cardBorder: 'border-t-orange-500',
    gridCard: 'bg-orange-50 border-orange-400 hover:bg-orange-100',
    gridTextSub: 'text-orange-700',
    listCard: 'border-l-orange-400',
    badge: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  red: {
    cardBorder: 'border-t-red-500',
    gridCard: 'bg-red-50 border-red-400 hover:bg-red-100',
    gridTextSub: 'text-red-700',
    listCard: 'border-l-red-400',
    badge: 'bg-red-100 text-red-700 border-red-200'
  }
};

const getColorKeys = () => ["blue", "green", "orange", "red"] as const;
const getColorForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const keys = getColorKeys();
  return keys[Math.abs(hash) % keys.length];
};

function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function turmaEncerrada(turma: Turma) {
  return turma.status === "encerrada";
}

type AlunoDaTurma = {
  matricula_id: string;
  aluno_id: string | null;
  nome: string;
  cpf: string | null;
  data_matricula: string | null;
};

type ResumoFreq = { presentes: number; faltas: number };

type RegistroFreq = {
  id: string;
  turma_id: string;
  data_hora: string;
  status: string | null;
  turmas?:
    | { nome: string; status?: string | null; data_encerramento?: string | null; cursos?: { titulo: string } | { titulo: string }[] | null }
    | { nome: string; status?: string | null; data_encerramento?: string | null; cursos?: { titulo: string } | { titulo: string }[] | null }[]
    | null;
};

function statusEhFalta(status: string | null | undefined) {
  return String(status || "presente").toLowerCase().trim() === "falta";
}

function percentualFreq(r?: ResumoFreq) {
  if (!r) return null;
  const total = r.presentes + r.faltas;
  if (!total) return null;
  return Math.round((r.presentes / total) * 100);
}

function corPercentual(p: number | null) {
  if (p === null) return "bg-slate-100 text-slate-500 border-slate-200";
  if (p >= 75) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (p >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function formatarDataSessao(valor: string) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Busca todas as linhas de uma consulta, paginando (o Supabase limita ~1000 por vez).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buscarTudo<T = any>(montar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const passo = 1000;
  const todos: T[] = [];
  for (let de = 0; ; de += passo) {
    const { data, error } = await montar(de, de + passo - 1);
    if (error) throw error;
    todos.push(...(data || []));
    if (!data || data.length < passo) break;
  }
  return todos;
}

function ListaAlunos({
  alunos,
  frequencia,
  onVerFrequencia,
}: {
  alunos: AlunoDaTurma[];
  frequencia?: Record<string, ResumoFreq>;
  onVerFrequencia: (aluno: AlunoDaTurma) => void;
}) {
  if (alunos.length === 0) {
    return (
      <p className="text-sm italic text-slate-500">
        Nenhum aluno matriculado nesta turma.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
      {alunos.map((a, i) => {
        const resumo = a.aluno_id ? frequencia?.[a.aluno_id] : undefined;
        const pct = percentualFreq(resumo);
        return (
          <li key={a.matricula_id}>
            <button
              type="button"
              disabled={!a.aluno_id}
              onClick={() => onVerFrequencia(a)}
              title="Ver frequência do aluno"
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-800">
                  {i + 1}. {a.nome}
                </span>
                <span className="block text-xs text-slate-500">
                  {a.cpf || "sem CPF"} · matrícula {formatarData(a.data_matricula)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {resumo && (resumo.presentes + resumo.faltas) > 0 && (
                  <span className="text-xs text-slate-500">
                    {resumo.presentes} pres. · {resumo.faltas} falta(s)
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${corPercentual(pct)}`}>
                  <ClipboardList className="h-3 w-3" />
                  {pct === null ? "Frequência" : `${pct}%`}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function chaveMes(valor: string) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "0000-00";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}

function rotuloMes(chave: string) {
  const d = new Date(`${chave}-15T12:00:00`);
  if (Number.isNaN(d.getTime())) return "Sem data";
  const t = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Data (AAAA-MM-DD) no fuso de Brasília, para comparar com os filtros de data.
function dataISOBrasil(valor?: string | null) {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function BarraFreq({ pct }: { pct: number | null }) {
  const cor = pct === null ? "bg-slate-300" : pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct ?? 0}%` }} />
    </div>
  );
}

function ModalFrequenciaAluno({
  aluno,
  turmaDestaqueId,
  onClose,
}: {
  aluno: { aluno_id: string; nome: string; cpf: string | null };
  turmaDestaqueId: string;
  onClose: () => void;
}) {
  const [registros, setRegistros] = useState<RegistroFreq[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [abertas, setAbertas] = useState<Record<string, boolean>>({ [turmaDestaqueId]: true });
  // undefined = usa o padrão (mês mais recente da turma aberta fica expandido)
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await buscarTudo<RegistroFreq>((de, ate) =>
          supabase
            .from("presencas")
            .select("id, turma_id, data_hora, status, turmas(nome, status, data_encerramento, cursos(titulo))")
            .eq("aluno_id", aluno.aluno_id)
            .order("data_hora", { ascending: true })
            .range(de, ate) as unknown as PromiseLike<{ data: RegistroFreq[] | null; error: { message: string } | null }>
        );
        if (ativo) setRegistros(dados);
      } catch (e) {
        console.error("Erro ao carregar frequência do aluno:", e);
        if (ativo) setErro("Não foi possível carregar a frequência deste aluno.");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [aluno.aluno_id]);

  // Agrupa os registros por turma
  const grupos = (() => {
    const mapa = new Map<
      string,
      { turmaId: string; nome: string; curso: string; encerrada: boolean; encerradaEm: string | null; registros: RegistroFreq[] }
    >();
    (registros || []).forEach((r) => {
      const t = Array.isArray(r.turmas) ? r.turmas[0] : r.turmas;
      const c = t?.cursos ? (Array.isArray(t.cursos) ? t.cursos[0] : t.cursos) : null;
      if (!mapa.has(r.turma_id)) {
        mapa.set(r.turma_id, {
          turmaId: r.turma_id,
          nome: t?.nome || "Turma removida",
          curso: c?.titulo || "Curso indefinido",
          encerrada: t?.status === "encerrada",
          encerradaEm: t?.data_encerramento ?? null,
          registros: [],
        });
      }
      mapa.get(r.turma_id)!.registros.push(r);
    });
    return Array.from(mapa.values()).sort((a, b) => {
      if (a.turmaId === turmaDestaqueId) return -1;
      if (b.turmaId === turmaDestaqueId) return 1;
      const ua = a.registros[a.registros.length - 1]?.data_hora || "";
      const ub = b.registros[b.registros.length - 1]?.data_hora || "";
      return ub.localeCompare(ua);
    });
  })();

  const resumir = (lista: RegistroFreq[]): ResumoFreq => ({
    presentes: lista.filter((r) => !statusEhFalta(r.status)).length,
    faltas: lista.filter((r) => statusEhFalta(r.status)).length,
  });

  const totalGeral = resumir(registros || []);
  const pctGeral = percentualFreq(totalGeral);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">{aluno.nome}</h3>
            <p className="text-xs text-slate-500">{aluno.cpf || "sem CPF"} · frequência por turma</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {!erro && registros === null && <p className="text-sm text-slate-500">Carregando frequência...</p>}

          {registros && registros.length === 0 && (
            <p className="text-sm italic text-slate-500">Nenhum registro de frequência para este aluno.</p>
          )}

          {registros && registros.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2">
                  <p className="text-xl font-bold text-emerald-700">{totalGeral.presentes}</p>
                  <p className="text-xs text-emerald-700">Presenças (geral)</p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50 p-2">
                  <p className="text-xl font-bold text-red-700">{totalGeral.faltas}</p>
                  <p className="text-xs text-red-700">Faltas (geral)</p>
                </div>
                <div className={`rounded-md border p-2 ${corPercentual(pctGeral)}`}>
                  <p className="text-xl font-bold">{pctGeral === null ? "—" : `${pctGeral}%`}</p>
                  <p className="text-xs">Frequência geral</p>
                </div>
              </div>

              {grupos.map((g) => {
                const r = resumir(g.registros);
                const pct = percentualFreq(r);
                const aberta = !!abertas[g.turmaId];
                return (
                  <div
                    key={g.turmaId}
                    className={`rounded-md border ${g.turmaId === turmaDestaqueId ? "border-blue-300" : "border-slate-200"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setAbertas((prev) => ({ ...prev, [g.turmaId]: !prev[g.turmaId] }))}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-800">
                          {g.nome}
                          {g.turmaId === turmaDestaqueId && (
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                              turma aberta
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {g.curso} · {g.encerrada ? `encerrada em ${formatarData(g.encerradaEm)}` : "em andamento"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {r.presentes} pres. · {r.faltas} falta(s)
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${corPercentual(pct)}`}>
                          {pct === null ? "—" : `${pct}%`}
                        </span>
                        {aberta ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </span>
                    </button>

                    <div className="px-3 pb-2">
                      <BarraFreq pct={pct} />
                    </div>

                    {aberta && (
                      <div className="space-y-1.5 border-t border-slate-100 p-2">
                        {(() => {
                          const porMes = new Map<string, RegistroFreq[]>();
                          g.registros.forEach((reg) => {
                            const k = chaveMes(reg.data_hora);
                            if (!porMes.has(k)) porMes.set(k, []);
                            porMes.get(k)!.push(reg);
                          });
                          const chaves = Array.from(porMes.keys()).sort().reverse();
                          return chaves.map((k, idx) => {
                            const lista = porMes.get(k)!;
                            const rm = resumir(lista);
                            const pm = percentualFreq(rm);
                            const idMes = `${g.turmaId}|${k}`;
                            const padrao = g.turmaId === turmaDestaqueId && idx === 0;
                            const mesAberto = mesesAbertos[idMes] ?? padrao;
                            return (
                              <div key={k} className="rounded border border-slate-200 bg-slate-50/60">
                                <button
                                  type="button"
                                  onClick={() => setMesesAbertos((prev) => ({ ...prev, [idMes]: !mesAberto }))}
                                  className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-slate-100"
                                >
                                  <span className="text-xs font-semibold text-slate-700">{rotuloMes(k)}</span>
                                  <span className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500">
                                      {rm.presentes} pres. · {rm.faltas} falta(s)
                                    </span>
                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${corPercentual(pm)}`}>
                                      {pm === null ? "—" : `${pm}%`}
                                    </span>
                                    {mesAberto ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                  </span>
                                </button>
                                {mesAberto && (
                                  <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto border-t border-slate-200 p-2 sm:grid-cols-3">
                                    {lista.map((reg) => {
                                      const falta = statusEhFalta(reg.status);
                                      return (
                                        <div
                                          key={reg.id}
                                          className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${
                                            falta
                                              ? "border-red-200 bg-red-50 text-red-700"
                                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          }`}
                                        >
                                          {falta ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                          {formatarDataSessao(reg.data_hora)} · {falta ? "Falta" : "Presente"}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 p-3">
          <button onClick={onClose} className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CursosClient({ cursos, turmas: serverTurmas }: { cursos: Curso[], turmas: Turma[] }) {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>(serverTurmas);
  const [vagasOcupadas, setVagasOcupadas] = useState<Record<string, number>>({});
  const [alunosPorTurma, setAlunosPorTurma] = useState<Record<string, AlunoDaTurma[]>>({});
  const [turmaExpandida, setTurmaExpandida] = useState<string | null>(null);
  const [freqPorTurma, setFreqPorTurma] = useState<Record<string, Record<string, ResumoFreq>>>({});
  const [alunoFrequencia, setAlunoFrequencia] = useState<
    { aluno_id: string; nome: string; cpf: string | null; turmaId: string } | null
  >(null);

  // Ao expandir uma turma encerrada, carrega o resumo de frequência de cada aluno nela.
  useEffect(() => {
    if (!turmaExpandida) return;
    let ativo = true;
    (async () => {
      try {
        const dados = await buscarTudo<{ aluno_id: string; status: string | null }>((de, ate) =>
          supabase
            .from("presencas")
            .select("aluno_id, status")
            .eq("turma_id", turmaExpandida)
            .range(de, ate) as unknown as PromiseLike<{ data: { aluno_id: string; status: string | null }[] | null; error: { message: string } | null }>
        );
        const resumo: Record<string, ResumoFreq> = {};
        dados.forEach((r) => {
          if (!resumo[r.aluno_id]) resumo[r.aluno_id] = { presentes: 0, faltas: 0 };
          if (statusEhFalta(r.status)) resumo[r.aluno_id].faltas++;
          else resumo[r.aluno_id].presentes++;
        });
        if (ativo) setFreqPorTurma((prev) => ({ ...prev, [turmaExpandida]: resumo }));
      } catch (e) {
        console.error("Erro ao carregar frequência da turma:", e);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [turmaExpandida]);
  
  useEffect(() => {
    setTurmas(serverTurmas);
  }, [serverTurmas]);

  useEffect(() => {
    let ativo = true;

    const carregarVagas = async () => {
      if (!serverTurmas || serverTurmas.length === 0) {
        if (ativo) {
          setVagasOcupadas({});
          setAlunosPorTurma({});
        }
        return;
      }

      const turmaIds = serverTurmas.map((turma) => turma.id);

      const { data, error } = await supabase
        .from("matriculas")
        .select("id, turma_id, aluno_id, data_matricula, alunos(nome_completo, cpf)")
        .in("turma_id", turmaIds);

      if (error) {
        console.error("Erro ao carregar quantidade de alunos por turma:", error);
        return;
      }

      const contagem: Record<string, number> = {};
      const listas: Record<string, AlunoDaTurma[]> = {};

      turmaIds.forEach((id) => {
        contagem[id] = 0;
        listas[id] = [];
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data || []).forEach((matricula: any) => {
        const turmaId = matricula.turma_id as string | null;
        if (!turmaId || !listas[turmaId]) return;

        contagem[turmaId] = (contagem[turmaId] || 0) + 1;

        const aluno = Array.isArray(matricula.alunos)
          ? matricula.alunos[0]
          : matricula.alunos;

        listas[turmaId].push({
          matricula_id: matricula.id,
          aluno_id: matricula.aluno_id ?? null,
          nome: aluno?.nome_completo || "Aluno sem nome",
          cpf: aluno?.cpf ?? null,
          data_matricula: matricula.data_matricula ?? null,
        });
      });

      Object.values(listas).forEach((lista) =>
        lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      );

      if (ativo) {
        setVagasOcupadas(contagem);
        setAlunosPorTurma(listas);
      }
    };

    carregarVagas();

    const canal = supabase
      .channel("grade-semanal-matriculas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matriculas" },
        () => {
          carregarVagas();
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [serverTurmas]);

  const getVagasDisponiveis = (turma: Turma) => {
    const ocupadas = vagasOcupadas[turma.id] || 0;
    return Math.max(0, LIMITE_VAGAS - ocupadas);
  };

  const turmasAtivas = turmas.filter((t) => !turmaEncerrada(t));
  const turmasEncerradas = turmas
    .filter((t) => turmaEncerrada(t))
    .sort((a, b) =>
      (b.data_encerramento || "").localeCompare(a.data_encerramento || "")
    );

  const [mostrarEncerradas, setMostrarEncerradas] = useState(false);

  // Filtros das turmas encerradas
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroDe, setFiltroDe] = useState("");
  const [filtroAte, setFiltroAte] = useState("");

  const filtrosAtivos = !!(filtroBusca || filtroCurso || filtroDe || filtroAte);
  const limparFiltros = () => {
    setFiltroBusca("");
    setFiltroCurso("");
    setFiltroDe("");
    setFiltroAte("");
  };

  const cursosDasEncerradas = Array.from(
    new Map(
      turmasEncerradas.map((t) => {
        const titulo =
          (Array.isArray(t.cursos) ? t.cursos[0]?.titulo : t.cursos?.titulo) ||
          cursos.find((c) => c.id === t.curso_id)?.titulo ||
          "Curso indefinido";
        return [t.curso_id, titulo] as const;
      })
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));

  const turmasEncerradasFiltradas = turmasEncerradas.filter((t) => {
    if (filtroCurso && t.curso_id !== filtroCurso) return false;

    const dia = dataISOBrasil(t.data_encerramento);
    if (filtroDe && (!dia || dia < filtroDe)) return false;
    if (filtroAte && (!dia || dia > filtroAte)) return false;

    if (filtroBusca) {
      const termo = semAcento(filtroBusca);
      const nomesAlunos = (alunosPorTurma[t.id] || []).map((a) => a.nome).join(" ");
      const alvo = semAcento(`${t.nome} ${nomesAlunos}`);
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<"cursos" | "turmas">("turmas");

  const [isCursoModalOpen, setIsCursoModalOpen] = useState(false);
  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Partial<Curso> | null>(null);
  const [editingTurma, setEditingTurma] = useState<Partial<Turma> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurso?.titulo) return;
    setIsSaving(true);

    const payload = {
      titulo: editingCurso.titulo,
      descricao: editingCurso.descricao,
      // Só envia a carga horária quando informada/alterada (compatível com banco sem a coluna)
      ...(editingCurso.carga_horaria !== undefined
        ? { carga_horaria: editingCurso.carga_horaria }
        : {}),
    };

    let error;
    if (editingCurso.id) {
      const { error: updateError } = await supabase.from("cursos").update(payload).eq("id", editingCurso.id);
      error = updateError;
    } else {
      const insertPayload = {
        ...payload,
        criado_em: new Date().toISOString(),
      };
      const { error: insertError } = await supabase.from("cursos").insert([insertPayload]);
      error = insertError;
    }

    setIsSaving(false);
    if (error) {
      alert("Erro ao salvar curso: " + error.message);
      return;
    }
    setIsCursoModalOpen(false);
    router.refresh();
  };

  const handleDeleteCurso = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    const { error } = await supabase.from("cursos").delete().eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else router.refresh();
  };

  const handleSaveTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTurma?.nome || !editingTurma?.curso_id || !editingTurma?.professor || !editingTurma?.turno || !editingTurma?.horario) {
      alert("Preencha nome, curso, professor, turno e horário!");
      return;
    }
    setIsSaving(true);

    const { inicio, fim } = criarDatasHorario(editingTurma.horario);

    const payload = {
      nome: editingTurma.nome,
      curso_id: editingTurma.curso_id,
      turno: editingTurma.turno,
      dias_semana: editingTurma.dias_semana || [],
      horario: editingTurma.horario,
      professor: editingTurma.professor,
      data_hora_inicio: inicio,
      data_hora_fim: fim,
      vagas: LIMITE_VAGAS
    };

    let error;
    if (editingTurma.id) {
      const { error: updateError } = await supabase.from("turmas").update(payload).eq("id", editingTurma.id);
      error = updateError;
    } else {
      const insertPayload = {
        ...payload,
        status: "ativa",
        criado_em: new Date().toISOString(),
      };
      const { error: insertError } = await supabase.from("turmas").insert([insertPayload]);
      error = insertError;
    }

    setIsSaving(false);
    if (error) {
      alert("Erro ao salvar turma: " + error.message);
      return;
    }
    setIsTurmaModalOpen(false);
    router.refresh();
  };

  // Excluir só é permitido para turma SEM nenhum aluno e SEM frequência.
  // Turma com histórico deve ser ENCERRADA (nada é apagado).
  const handleDeleteTurma = async (id: string) => {
    const { count: totalMatriculas, error: errMat } = await supabase
      .from("matriculas")
      .select("id", { count: "exact", head: true })
      .eq("turma_id", id);

    const { count: totalPresencas, error: errPres } = await supabase
      .from("presencas")
      .select("id", { count: "exact", head: true })
      .eq("turma_id", id);

    if (errMat || errPres) {
      alert("Não foi possível verificar o histórico da turma. Use \"Encerrar turma\" para não perder dados.");
      return;
    }

    if ((totalMatriculas || 0) > 0 || (totalPresencas || 0) > 0) {
      alert(
        `Esta turma tem ${totalMatriculas || 0} matrícula(s) e ${totalPresencas || 0} registro(s) de frequência.\n\nPara não perder o histórico, use "Encerrar turma" em vez de excluir.`
      );
      return;
    }

    if (!confirm("Esta turma não tem alunos nem frequência. Excluir definitivamente?")) return;
    const { error } = await supabase.from("turmas").delete().eq("id", id);
    if (error) alert("Erro ao excluir: " + error.message);
    else {
      setIsTurmaModalOpen(false);
      router.refresh();
    }
  };

  // Encerra a turma: ela sai da grade, mas alunos, matrículas e frequência continuam salvos.
  const handleEncerrarTurma = async (turma: Partial<Turma>, abrirNova = false) => {
    if (!turma.id) return;

    const alunos = vagasOcupadas[turma.id] || 0;
    const mensagem = abrirNova
      ? `Encerrar a turma "${turma.nome}" (${alunos} aluno(s)) e abrir uma nova no mesmo horário?\n\nOs alunos, matrículas e a frequência da turma encerrada continuam salvos no histórico.`
      : `Encerrar a turma "${turma.nome}" (${alunos} aluno(s))?\n\nEla sai da grade, mas os alunos, matrículas e a frequência continuam salvos no histórico. A data de hoje será registrada como data de encerramento.`;

    if (!confirm(mensagem)) return;

    const { error } = await supabase
      .from("turmas")
      .update({
        status: "encerrada",
        data_encerramento: new Date().toISOString(),
      })
      .eq("id", turma.id);

    if (error) {
      alert("Erro ao encerrar turma: " + error.message);
      return;
    }

    if (abrirNova) {
      // Mantém o modal aberto já preenchido para criar a nova turma
      setEditingTurma({
        nome: "",
        curso_id: turma.curso_id,
        turno: turma.turno || "Manhã",
        horario: turma.horario && HORARIOS.some((h) => h.label === turma.horario) ? turma.horario : (turma.turno === "Tarde" ? "14:30–16:00" : "08:30–10:00"),
        professor: turma.professor || "",
        dias_semana: turma.dias_semana || [],
        vagas: LIMITE_VAGAS,
      });
      setIsTurmaModalOpen(true);
    } else {
      setIsTurmaModalOpen(false);
    }

    router.refresh();
  };

  const handleReabrirTurma = async (turma: Turma) => {
    if (!confirm(`Reabrir a turma "${turma.nome}"? Ela volta para a grade semanal.`)) return;

    const { error } = await supabase
      .from("turmas")
      .update({ status: "ativa", data_encerramento: null })
      .eq("id", turma.id);

    if (error) alert("Erro ao reabrir turma: " + error.message);
    else router.refresh();
  };

  const toggleDiaSemana = (dia: string) => {
    setEditingTurma(prev => {
      if (!prev) return prev;
      const current = prev.dias_semana || [];
      const updated = current.includes(dia) ? current.filter(d => d !== dia) : [...current, dia];
      return { ...prev, dias_semana: updated };
    });
  };

  const alterarTurno = (turno: string) => {
    setEditingTurma(prev => {
      if (!prev) return prev;
      const primeiroHorario = turno === "Manhã" ? "08:30–10:00" : "14:30–16:00";
      return { ...prev, turno, horario: primeiroHorario };
    });
  };

  const getTurmasForCell = (horarioLabel: string, dia: string) => {
    return turmasAtivas.filter(t => {
      const tHorario = getHorarioLabel(t);
      return tHorario === horarioLabel && (t.dias_semana || []).includes(dia);
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cursos e Turmas</h1>
          <p className="text-sm text-slate-500 mt-1">Organize os cursos, turmas, horários e dias das aulas.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "cursos" ? (
            <button onClick={() => { setEditingCurso({ titulo: "", descricao: "" }); setIsCursoModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Curso
            </button>
          ) : (
            <button onClick={() => { setEditingTurma({ nome: "", curso_id: "", professor: "", turno: "Manhã", horario: "08:30–10:00", dias_semana: [], vagas: LIMITE_VAGAS }); setIsTurmaModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Turma
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab("turmas")} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "turmas" ? "border-emerald-500 text-emerald-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
          <Calendar className="w-4 h-4" /> Grade Semanal
        </button>
        <button onClick={() => setActiveTab("cursos")} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "cursos" ? "border-blue-500 text-blue-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
          <BookOpen className="w-4 h-4" /> Cursos (Disciplinas)
        </button>
      </div>

      {activeTab === "cursos" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Curso</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4 text-center">Carga Horária</th>
                  <th className="px-6 py-4 text-center">Turmas Ativas</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cursos.map(curso => {
                  const turmasDoCurso = turmasAtivas.filter(t => t.curso_id === curso.id);
                  const cursoColor = COLOR_THEMES[getColorForId(curso.id)];

                  return (
                    <tr key={curso.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${cursoColor.badge} border`} title="Cor de identificação do curso" />
                        {curso.titulo}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-md truncate">
                        {curso.descricao || <span className="italic text-slate-400">Sem descrição</span>}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-700">
                        {curso.carga_horaria ? `${curso.carga_horaria}h` : <span className="italic text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                          {turmasDoCurso.length} {turmasDoCurso.length === 1 ? 'turma' : 'turmas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCurso(curso); setIsCursoModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar curso"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteCurso(curso.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Excluir curso"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {cursos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                      Nenhum curso cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "turmas" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 w-32 border-r border-slate-200 text-center"><Clock className="w-4 h-4 inline-block mr-1"/> Horário</th>
                {DIAS_SEMANA.map(dia => (
                  <th key={dia} className="px-4 py-4 border-r border-slate-200 text-center uppercase tracking-wider text-xs">{dia}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {HORARIOS.map(horario => (
                <tr key={horario.label}>
                  <td className="px-4 py-6 border-r border-slate-200 bg-slate-50 text-center font-bold text-slate-700 align-middle">
                    {horario.label}<br/>
                    <span className="text-xs font-normal text-slate-500">{horario.turno}</span>
                  </td>
                  {DIAS_SEMANA.map(dia => {
                    const turmasNoDia = getTurmasForCell(horario.label, dia);
                    return (
                      <td key={dia} className="p-2 border-r border-slate-200 align-top bg-white min-h-[140px] h-[140px]">
                        <div className="w-full flex flex-col gap-2 min-h-[124px]">
                          {turmasNoDia.map(turma => {
                            const turmaColor = COLOR_THEMES[getColorForId(turma.curso_id)];
                            const match = turma.nome.match(/\b([A-Za-z])\b/);
                            const watermark = match ? match[1].toUpperCase() : null;

                            return (
                              <div 
                                key={turma.id} 
                                onClick={() => { setEditingTurma({...turma, horario: getHorarioLabel(turma)}); setIsTurmaModalOpen(true); }} 
                                className={`group relative overflow-hidden flex-auto shrink-0 flex flex-col items-start justify-center p-3 rounded-md cursor-pointer transition-all text-left border-l-4 shadow-sm ${turmaColor.gridCard}`}
                              >
                                {watermark && (
                                  <div className="absolute -right-2 -bottom-4 text-7xl font-black text-black opacity-10 pointer-events-none select-none z-0">
                                    {watermark}
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEncerrarTurma(turma);
                                  }}
                                  className="absolute top-1.5 right-1.5 p-1 text-slate-500 hover:text-amber-700 hover:bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                  title="Encerrar turma (mantém o histórico)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <div className="font-bold text-slate-800 text-sm leading-tight mb-1 pr-5 relative z-10">{turma.nome}</div>
                                <div className={`text-xs font-medium break-words mb-2 relative z-10 ${turmaColor.gridTextSub}`}>{(Array.isArray(turma.cursos) ? turma.cursos[0]?.titulo : turma.cursos?.titulo) || "Curso Indefinido"}</div>
                                {turma.professor && <div className={`text-[11px] break-words mb-2 relative z-10 ${turmaColor.gridTextSub}`}>Prof. {turma.professor}</div>}
                                <div className={`mt-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border relative z-10 ${turmaColor.badge}`}>
                                  {getVagasDisponiveis(turma)} vagas · {vagasOcupadas[turma.id] || 0} alunos
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TURMAS ENCERRADAS (HISTÓRICO) */}
      {activeTab === "turmas" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarEncerradas((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
          >
            <span className="flex items-center gap-2 font-bold text-slate-700">
              <Archive className="w-4 h-4 text-amber-600" />
              Turmas encerradas
              <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                {turmasEncerradas.length}
              </span>
            </span>
            {mostrarEncerradas ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {mostrarEncerradas && (
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Buscar turma ou aluno</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={filtroBusca}
                      onChange={(e) => setFiltroBusca(e.target.value)}
                      placeholder="Nome da turma ou do aluno"
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Curso</label>
                  <select
                    value={filtroCurso}
                    onChange={(e) => setFiltroCurso(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todos os cursos</option>
                    {cursosDasEncerradas.map(([id, titulo]) => (
                      <option key={id} value={id}>{titulo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Encerrada a partir de</label>
                  <input
                    type="date"
                    value={filtroDe}
                    max={filtroAte || undefined}
                    onChange={(e) => setFiltroDe(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Encerrada até</label>
                  <input
                    type="date"
                    value={filtroAte}
                    min={filtroDe || undefined}
                    onChange={(e) => setFiltroAte(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  {turmasEncerradasFiltradas.length} de {turmasEncerradas.length} turma(s)
                </span>
                {filtrosAtivos && (
                  <button type="button" onClick={limparFiltros} className="font-medium text-blue-600 hover:text-blue-800">
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          )}

          {mostrarEncerradas && (
            <div className="overflow-x-auto border-t border-slate-200">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Turma</th>
                    <th className="px-5 py-3">Curso</th>
                    <th className="px-5 py-3">Horário</th>
                    <th className="px-5 py-3 text-center">Criada em</th>
                    <th className="px-5 py-3 text-center">Encerrada em</th>
                    <th className="px-5 py-3 text-center">Alunos</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {turmasEncerradasFiltradas.map((turma) => (
                    <Fragment key={turma.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{turma.nome}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {(Array.isArray(turma.cursos) ? turma.cursos[0]?.titulo : turma.cursos?.titulo) || "Curso Indefinido"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {(turma.dias_semana || []).join(", ") || "—"}
                        <br />
                        <span className="text-xs text-slate-400">{getHorarioLabel(turma)}</span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600">{formatarData(turma.criado_em)}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{formatarData(turma.data_encerramento)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setTurmaExpandida(turmaExpandida === turma.id ? null : turma.id)}
                          className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-200"
                          title="Ver alunos da turma"
                        >
                          <Users className="w-3 h-3" /> {vagasOcupadas[turma.id] || 0}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleReabrirTurma(turma)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                          title="Reabrir turma"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                        </button>
                      </td>
                    </tr>
                    {turmaExpandida === turma.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-5 py-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Alunos da turma {turma.nome}
                          </p>
                          <ListaAlunos
                            alunos={alunosPorTurma[turma.id] || []}
                            frequencia={freqPorTurma[turma.id]}
                            onVerFrequencia={(a) =>
                              a.aluno_id &&
                              setAlunoFrequencia({ aluno_id: a.aluno_id, nome: a.nome, cpf: a.cpf, turmaId: turma.id })
                            }
                          />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                  {turmasEncerradasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500 bg-slate-50/50">
                        {turmasEncerradas.length === 0 ? "Nenhuma turma encerrada ainda." : "Nenhuma turma encontrada com esses filtros."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-200 bg-slate-50">
                Clique em um aluno para ver a frequência dele. Os dados de cada turma ficam salvos separadamente, mesmo que o aluno entre em outras turmas depois.
              </p>
            </div>
          )}
        </div>
      )}

      {alunoFrequencia && (
        <ModalFrequenciaAluno
          aluno={alunoFrequencia}
          turmaDestaqueId={alunoFrequencia.turmaId}
          onClose={() => setAlunoFrequencia(null)}
        />
      )}

      {/* MODAL CURSO */}
      {isCursoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">{editingCurso?.id ? "Editar Curso" : "Novo Curso"}</h3>
              <button onClick={() => setIsCursoModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveCurso} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Curso</label>
                <input required type="text" value={editingCurso?.titulo || ""} onChange={e => setEditingCurso(prev => ({...prev, titulo: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea rows={3} value={editingCurso?.descricao || ""} onChange={e => setEditingCurso(prev => ({...prev, descricao: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carga Horária (horas)</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ex.: 20"
                  value={editingCurso?.carga_horaria ?? ""}
                  onChange={e => setEditingCurso(prev => ({...prev, carga_horaria: e.target.value === "" ? null : Math.max(1, parseInt(e.target.value, 10) || 1)}))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                {editingCurso?.id && (
                  <button type="button" onClick={() => handleDeleteCurso(editingCurso.id!)} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md mr-auto">Excluir</button>
                )}
                <button type="button" onClick={() => setIsCursoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TURMA */}
      {isTurmaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">{editingTurma?.id ? "Editar Turma" : "Nova Turma"}</h3>
              <button onClick={() => setIsTurmaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveTurma} className="p-4 space-y-5">
              {editingTurma?.id && editingTurma.criado_em && (
                <p className="text-xs text-slate-500">Turma criada em {formatarData(editingTurma.criado_em)}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Curso Vinculado</label>
                <select required value={editingTurma?.curso_id || ""} onChange={e => setEditingTurma(prev => ({...prev, curso_id: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="" disabled>Selecione um curso</option>
                  {cursos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome/Identificador da Turma</label>
                  <input required type="text" placeholder="Ex: Turma A" value={editingTurma?.nome || ""} onChange={e => setEditingTurma(prev => ({...prev, nome: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Vagas</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={LIMITE_VAGAS}
                    value={LIMITE_VAGAS}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-700 text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Cada turma possui limite de 10 vagas.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Professor(a)</label>
                <select required value={editingTurma?.professor || ""} onChange={e => setEditingTurma(prev => ({...prev, professor: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                  <option value="" disabled>Selecione o professor</option>
                  {PROFESSORES.map(nome => <option key={nome} value={nome}>{nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Turno</label>
                <div className="flex gap-4">
                  {TURNOS.map(t => (
                    <label key={t} className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${editingTurma?.turno === t ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" name="turno" value={t} checked={editingTurma?.turno === t} onChange={() => alterarTurno(t)} className="hidden" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              {editingTurma?.turno && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Horário</label>
                  <select required value={editingTurma?.horario || ""} onChange={e => setEditingTurma(prev => ({...prev, horario: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm">
                    {HORARIOS.filter(h => h.turno === editingTurma.turno).map(h => (
                      <option key={h.label} value={h.label}>{h.label}</option>
                    ))}
                    {editingTurma.horario && HORARIOS_DESATIVADOS.some(h => h.label === editingTurma.horario) && (
                      <option value={editingTurma.horario} disabled>{editingTurma.horario} (horário desativado)</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const isSelected = (editingTurma?.dias_semana || []).includes(dia);
                    return (
                      <button key={dia} type="button" onClick={() => toggleDiaSemana(dia)} className={`px-3 py-1.5 text-sm font-medium border rounded-full transition-colors ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                        {dia}
                      </button>
                    )
                  })}
                </div>
                {(!editingTurma?.dias_semana || editingTurma.dias_semana.length === 0) && (
                  <p className="text-xs text-red-500 mt-2">Selecione ao menos um dia da semana.</p>
                )}
              </div>

              {editingTurma?.id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Alunos matriculados ({(alunosPorTurma[editingTurma.id] || []).length}/{LIMITE_VAGAS})
                  </label>
                  <div className="max-h-48 overflow-y-auto">
                    <ListaAlunos
                      alunos={alunosPorTurma[editingTurma.id] || []}
                      onVerFrequencia={(a) =>
                        a.aluno_id &&
                        editingTurma.id &&
                        setAlunoFrequencia({ aluno_id: a.aluno_id, nome: a.nome, cpf: a.cpf, turmaId: editingTurma.id })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                {editingTurma?.id && (
                  <div className="mr-auto flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEncerrarTurma(editingTurma, true)} className="px-3 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200">Encerrar e abrir nova</button>
                    <button type="button" onClick={() => handleEncerrarTurma(editingTurma)} className="px-3 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200">Encerrar turma</button>
                    <button type="button" onClick={() => handleDeleteTurma(editingTurma.id!)} className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md">Excluir</button>
                  </div>
                )}
                <button type="button" onClick={() => setIsTurmaModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Cancelar</button>
                <button type="submit" disabled={isSaving || (editingTurma?.dias_semana?.length || 0) === 0} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-4 h-4"/> Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
