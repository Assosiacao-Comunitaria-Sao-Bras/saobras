"use client";

import { Fragment, useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, BookOpen, Clock, X, Save, Archive, RotateCcw, ChevronDown, ChevronUp, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export type Curso = {
  id: string;
  titulo: string;
  descricao: string | null;
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
  data_hora_inicio: string | null;
  data_hora_fim: string | null;
  vagas?: number;
  status?: string | null;
  criado_em?: string | null;
  data_encerramento?: string | null;
  cursos?: { titulo: string } | null;
};

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const LIMITE_VAGAS = 10;
const TURNOS = ["Manhã", "Tarde"];
const HORARIOS = [
  { turno: "Manhã", label: "08:30–09:30", inicio: "08:30", fim: "09:30" },
  { turno: "Manhã", label: "08:30–10:00", inicio: "08:30", fim: "10:00" },
  { turno: "Manhã", label: "09:30–10:30", inicio: "09:30", fim: "10:30" },
  { turno: "Manhã", label: "10:00–11:30", inicio: "10:00", fim: "11:30" },
  { turno: "Manhã", label: "10:30–11:30", inicio: "10:30", fim: "11:30" },
  { turno: "Tarde", label: "14:30–15:30", inicio: "14:30", fim: "15:30" },
  { turno: "Tarde", label: "14:30–16:00", inicio: "14:30", fim: "16:00" },
  { turno: "Tarde", label: "15:30–16:30", inicio: "15:30", fim: "16:30" },
  { turno: "Tarde", label: "16:00–17:30", inicio: "16:00", fim: "17:30" },
  { turno: "Tarde", label: "16:30–17:30", inicio: "16:30", fim: "17:30" },
] as const;

function getHorarioByLabel(label: string) {
  return HORARIOS.find((h) => h.label === label);
}

function getHorarioLabel(turma: Turma) {
  if (turma.horario) {
    const horarioSalvo = turma.horario.replace(/\s*[-–]\s*/g, "–");
    const h = HORARIOS.find((h) => h.label === horarioSalvo);
    if (h) return h.label;

    // Mantém compatibilidade com horários antigos salvos no banco.
    const horariosAntigos: Record<string, string> = {
      "08:30–10:00": "08:30–10:00",
      "10:00–11:30": "10:00–11:30",
      "14:30–16:00": "14:30–16:00",
      "16:00–17:30": "16:00–17:30",
    };
    if (horariosAntigos[horarioSalvo]) return horariosAntigos[horarioSalvo];

    return turma.horario;
  }
  if (turma.data_hora_inicio) {
    const data = new Date(turma.data_hora_inicio);
    const horaBrasil = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(data);
    
    if (turma.turno === "Manhã") {
      if (horaBrasil === "08:30") return "08:30–10:00";
      if (horaBrasil === "09:30") return "09:30–10:30";
      if (horaBrasil === "10:00") return "10:00–11:30";
      if (horaBrasil === "10:30") return "10:30–11:30";
    }
    if (turma.turno === "Tarde") {
      if (horaBrasil === "14:30") return "14:30–16:00";
      if (horaBrasil === "15:30") return "15:30–16:30";
      if (horaBrasil === "16:00") return "16:00–17:30";
      if (horaBrasil === "16:30") return "16:30–17:30";
    }
  }
  return turma.turno === "Manhã" ? "08:30–10:00" : "14:30–16:00";
}

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

function ListaAlunos({ alunos }: { alunos: AlunoDaTurma[] }) {
  if (alunos.length === 0) {
    return (
      <p className="text-sm italic text-slate-500">
        Nenhum aluno matriculado nesta turma.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
      {alunos.map((a, i) => (
        <li
          key={a.matricula_id}
          className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
        >
          <span className="min-w-0 truncate font-medium text-slate-800">
            {i + 1}. {a.nome}
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {a.cpf || "sem CPF"} · matrícula {formatarData(a.data_matricula)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CursosClient({ cursos, turmas: serverTurmas }: { cursos: Curso[], turmas: Turma[] }) {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>(serverTurmas);
  const [vagasOcupadas, setVagasOcupadas] = useState<Record<string, number>>({});
  const [alunosPorTurma, setAlunosPorTurma] = useState<Record<string, AlunoDaTurma[]>>({});
  const [turmaExpandida, setTurmaExpandida] = useState<string | null>(null);
  
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
    if (!editingTurma?.nome || !editingTurma?.curso_id || !editingTurma?.turno || !editingTurma?.horario) {
      alert("Preencha nome, curso, turno e horário!");
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
        horario: turma.horario || "08:30–09:30",
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
      const primeiroHorario = turno === "Manhã" ? "08:30–09:30" : "14:30–15:30";
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
            <button onClick={() => { setEditingTurma({ nome: "", curso_id: "", turno: "Manhã", horario: "08:30–09:30", dias_semana: [], vagas: LIMITE_VAGAS }); setIsTurmaModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
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
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
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
                        <div className="w-full h-full flex flex-col gap-2 min-h-[100px]">
                          {turmasNoDia.map(turma => {
                            const turmaColor = COLOR_THEMES[getColorForId(turma.curso_id)];
                            const match = turma.nome.match(/\b([A-Za-z])\b/);
                            const watermark = match ? match[1].toUpperCase() : null;

                            return (
                              <div 
                                key={turma.id} 
                                onClick={() => { setEditingTurma({...turma, horario: getHorarioLabel(turma)}); setIsTurmaModalOpen(true); }} 
                                className={`group relative overflow-hidden flex-1 flex flex-col items-start justify-center p-3 rounded-md cursor-pointer transition-all text-left border-l-4 shadow-sm ${turmaColor.gridCard}`}
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
                                <div className={`text-xs font-medium line-clamp-1 mb-2 relative z-10 ${turmaColor.gridTextSub}`}>{(Array.isArray(turma.cursos) ? turma.cursos[0]?.titulo : turma.cursos?.titulo) || "Curso Indefinido"}</div>
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
                  {turmasEncerradas.map((turma) => (
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
                          <ListaAlunos alunos={alunosPorTurma[turma.id] || []} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                  {turmasEncerradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500 bg-slate-50/50">
                        Nenhuma turma encerrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="px-5 py-3 text-xs text-slate-500 border-t border-slate-200 bg-slate-50">
                Os alunos, matrículas e a frequência de cada turma encerrada continuam disponíveis em Relatórios e no Dashboard.
              </p>
            </div>
          )}
        </div>
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
                    <ListaAlunos alunos={alunosPorTurma[editingTurma.id] || []} />
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
