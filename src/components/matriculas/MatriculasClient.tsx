"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  baixarFichaAposMatricula,
  baixarFichaPorMatricula,
} from "@/lib/ficha-inscricao";
import {
  Plus,
  Trash2,
  Search,
  GraduationCap,
  X,
  Loader2,
  Calendar,
  FileDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Matricula = {
  id: string;
  aluno_id: string;
  curso_id: string;
  turma_id: string;
  data_matricula: string;
  encerrada_em?: string | null;
  motivo_encerramento?: string | null;
  alunos?: {
    nome_completo: string;
    cpf: string | null;
  };
  cursos?: {
    titulo: string;
  };
  turmas?: {
    nome: string;
    horario: string | null;
  };
};

type Aluno = {
  id: string;
  nome_completo: string;
  cpf: string | null;
};

type Turma = {
  id: string;
  nome: string;
  curso_id: string;
  horario: string | null;
  dias_semana: string[] | null;
  cursos?: {
    titulo: string;
  };
};

// ============================================================
// MASCARAR CPF
// Mostra somente os 4 últimos números
// Exemplo: 123.456.789-00 -> ***.***.**-8900
// ============================================================
function mascararCPF(cpf?: string | null) {
  if (!cpf) {
    return "CPF não informado";
  }

  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length < 4) {
    return "****";
  }

  const ultimosQuatro = numeros.slice(-4);

  return `***.***.**-${ultimosQuatro}`;
}

export default function MatriculasClient({
  matriculasIniciais,
}: {
  matriculasIniciais: any[];
}) {
  const router = useRouter();

  const [matriculas, setMatriculas] =
    useState<Matricula[]>(matriculasIniciais);

  const [searchTerm, setSearchTerm] = useState("");
  const [aba, setAba] = useState<"ativas" | "encerradas">("ativas");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [isLoadingFormDados, setIsLoadingFormDados] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [baixandoFichaId, setBaixandoFichaId] = useState<string | null>(null);

  // Form states
  const [selectedAluno, setSelectedAluno] = useState("");

  const [selectedTurma, setSelectedTurma] = useState("");

  const [alunoBusca, setAlunoBusca] = useState("");

  const [turmaBusca, setTurmaBusca] = useState("");

  useEffect(() => {
    setMatriculas(matriculasIniciais);
  }, [matriculasIniciais]);

  const abrirModal = async () => {
    setIsModalOpen(true);

    setSelectedAluno("");

    setSelectedTurma("");

    setAlunoBusca("");

    setTurmaBusca("");

    if (alunos.length === 0 || turmas.length === 0) {
      setIsLoadingFormDados(true);

      const [resAlunos, resTurmas] = await Promise.all([
        supabase
          .from("alunos")
          .select("id, nome_completo, cpf")
          .order("nome_completo"),

        supabase
          .from("turmas")
          .select(
            "id, nome, curso_id, horario, dias_semana, cursos(titulo)"
          )
          .eq("status", "ativa")
          .order("nome"),
      ]);

      if (resAlunos.data) {
        setAlunos(resAlunos.data);
      }

      // Format turmas
      if (resTurmas.data) {
        const formattedTurmas = resTurmas.data.map((t: any) => ({
          ...t,
          cursos: Array.isArray(t.cursos)
            ? t.cursos[0]
            : t.cursos,
        }));

        setTurmas(formattedTurmas);
      }

      setIsLoadingFormDados(false);
    }
  };

  // ============================================================
  // PESQUISA DE ALUNOS
  // Continua pesquisando pelo CPF COMPLETO internamente.
  // O CPF completo nunca é exibido.
  // ============================================================
  const alunosFiltradosDropdown = useMemo(() => {
    if (!alunoBusca) {
      return alunos;
    }

    const lower = alunoBusca.toLowerCase();

    return alunos.filter(
      (a) =>
        a.nome_completo.toLowerCase().includes(lower) ||
        (a.cpf && a.cpf.includes(lower))
    );
  }, [alunos, alunoBusca]);

  // ============================================================
  // LISTA DE TURMAS AGRUPADA POR CURSO (com pesquisa)
  // ============================================================
  const turmasAgrupadas = useMemo(() => {
    const norm = (t: string) =>
      t
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const termo = norm(turmaBusca.trim());

    const filtradas = termo
      ? turmas.filter((t) =>
          norm(
            [
              t.cursos?.titulo,
              t.nome,
              t.horario,
              (t.dias_semana || []).join(" "),
            ]
              .filter(Boolean)
              .join(" ")
          ).includes(termo)
        )
      : turmas;

    const grupos = new Map<string, Turma[]>();

    for (const t of filtradas) {
      const chave = t.cursos?.titulo || "Sem curso";
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(t);
    }

    return Array.from(grupos.entries()).sort(([a], [b]) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [turmas, turmaBusca]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAluno || !selectedTurma) {
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error("Usuário não logado");
      }

      const { data: op, error: opError } = await supabase
        .from("operadores")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (opError) {
        throw new Error(
          "Erro ao buscar operador: " + opError.message
        );
      }

      if (!op) {
        throw new Error(
          `Seu email (${user.email}) não está cadastrado na tabela de operadores. Cadastre-se lá primeiro para poder realizar matrículas.`
        );
      }

      const turmaObj = turmas.find(
        (t) => t.id === selectedTurma
      );

      if (!turmaObj) {
        throw new Error("Turma inválida");
      }

      // Check for duplicates
      const exists = matriculas.some(
        (m) =>
          m.aluno_id === selectedAluno &&
          m.turma_id === selectedTurma
      );

      if (exists) {
        alert(
          "Este aluno já está matriculado nesta turma!"
        );

        setIsSaving(false);

        return;
      }

      const { error } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: selectedAluno,
          turma_id: selectedTurma,
          curso_id: turmaObj.curso_id,
          operador_id: op.id,
          data_matricula: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      setIsModalOpen(false);

      router.refresh();

      const erroFicha = await baixarFichaAposMatricula(
        selectedAluno,
        selectedTurma
      );

      if (erroFicha) {
        alert(
          "A matrícula foi salva, mas não foi possível gerar a ficha de inscrição: " +
            erroFicha +
            "\n\nVocê pode baixá-la depois pelo ícone de ficha na lista de matrículas."
        );
      }
    } catch (err: any) {
      alert("Erro ao matricular: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBaixarFicha = async (id: string) => {
    if (baixandoFichaId) {
      return;
    }

    setBaixandoFichaId(id);

    try {
      await baixarFichaPorMatricula(id);
    } catch (err: any) {
      alert("Erro ao gerar a ficha de inscrição: " + err.message);
    } finally {
      setBaixandoFichaId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja cancelar esta matrícula? O histórico de presenças pode ser afetado."
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("matriculas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
      router.refresh();
    }
  };

  const matriculasDaAba = useMemo(
    () => matriculas.filter((m) => (aba === "ativas" ? !m.encerrada_em : !!m.encerrada_em)),
    [matriculas, aba]
  );
  const totalAtivas = useMemo(() => matriculas.filter((m) => !m.encerrada_em).length, [matriculas]);
  const totalEncerradas = matriculas.length - totalAtivas;

  const matriculasFiltradas = useMemo(() => {
    if (!searchTerm) {
      return matriculasDaAba;
    }

    const lower = searchTerm.toLowerCase();

    return matriculasDaAba.filter(
      (m) =>
        m.alunos?.nome_completo.toLowerCase().includes(lower) ||
        m.turmas?.nome.toLowerCase().includes(lower) ||
        m.cursos?.titulo.toLowerCase().includes(lower)
    );
  }, [matriculasDaAba, searchTerm]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Matrículas
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Vincule os alunos às turmas e cursos.
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />

          Nova Matrícula
        </button>
      </div>

      {/* FILTRO E TABELA */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="flex gap-1 border-b border-slate-200 bg-white px-4 pt-3">
          {([
            ["ativas", `Ativas (${totalAtivas})`],
            ["encerradas", `Encerradas (${totalEncerradas})`],
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              className={`rounded-t-md px-4 py-2 text-sm font-semibold transition-colors ${
                aba === valor
                  ? "border-x border-t border-slate-200 bg-slate-50 text-blue-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Buscar por aluno, curso ou turma..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Aluno
                </th>

                <th className="px-6 py-4 font-semibold">
                  Curso & Turma
                </th>

                <th className="px-6 py-4 font-semibold">
                  Data da Matrícula
                </th>

                <th className="px-6 py-4 font-semibold text-right">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {matriculasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nenhuma matrícula encontrada.
                  </td>
                </tr>
              ) : (
                matriculasFiltradas.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {m.alunos?.nome_completo
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {m.alunos?.nome_completo}
                          </p>

                          {/* CPF ANONIMIZADO */}
                          <p className="text-xs text-slate-500">
                            CPF:{" "}
                            {mascararCPF(
                              m.alunos?.cpf
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {m.cursos?.titulo}
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {m.turmas?.nome}{" "}
                        {m.turmas?.horario
                          ? `• ${m.turmas.horario}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />

                        {new Date(
                          m.data_matricula
                        ).toLocaleDateString("pt-BR")}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleBaixarFicha(m.id)}
                        disabled={!!baixandoFichaId}
                        className="p-1.5 mr-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                        title="Baixar ficha de inscrição (PDF)"
                      >
                        {baixandoFichaId === m.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(m.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Cancelar matrícula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA MATRÍCULA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />

                Nova Matrícula
              </h3>

              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="text-slate-400 hover:text-slate-600 bg-white rounded-md p-1 border shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSalvar}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 space-y-6 overflow-y-auto">
                {isLoadingFormDados ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />

                    <p>
                      Carregando alunos e turmas...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ALUNO SELECT */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">
                        1. Selecione o Aluno
                      </label>

                      <input
                        type="text"
                        placeholder="Pesquisar aluno por nome ou CPF..."
                        value={alunoBusca}
                        onChange={(e) =>
                          setAlunoBusca(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2"
                      />

                      <div className="border border-slate-200 rounded-md max-h-48 overflow-y-auto bg-slate-50">
                        {alunosFiltradosDropdown.length ===
                        0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            Nenhum aluno encontrado.
                          </div>
                        ) : (
                          alunosFiltradosDropdown.map(
                            (a) => (
                              <label
                                key={a.id}
                                className={`flex items-center gap-3 p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-blue-50 transition-colors ${
                                  selectedAluno ===
                                  a.id
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="aluno"
                                  value={a.id}
                                  checked={
                                    selectedAluno ===
                                    a.id
                                  }
                                  onChange={() =>
                                    setSelectedAluno(
                                      a.id
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600"
                                />

                                <div>
                                  <p className="font-bold text-slate-800 text-sm">
                                    {a.nome_completo}
                                  </p>

                                  {/* CPF ANONIMIZADO */}
                                  <p className="text-xs text-slate-500">
                                    {mascararCPF(a.cpf)}
                                  </p>
                                </div>
                              </label>
                            )
                          )
                        )}
                      </div>
                    </div>

                    {/* TURMA SELECT */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">
                        2. Selecione a Turma
                      </label>

                      <input
                        type="text"
                        placeholder="Pesquisar por curso, turma, horário ou dia..."
                        value={turmaBusca}
                        onChange={(e) =>
                          setTurmaBusca(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2"
                      />

                      <div className="border border-slate-200 rounded-md max-h-64 overflow-y-auto bg-slate-50">
                        {turmasAgrupadas.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500 text-center">
                            Nenhuma turma encontrada.
                          </div>
                        ) : (
                          turmasAgrupadas.map(
                            ([curso, lista]) => (
                              <div key={curso}>
                                <div className="sticky top-0 z-10 px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-600">
                                  {curso}
                                </div>

                                {lista.map((t) => (
                                  <label
                                    key={t.id}
                                    className={`flex items-start gap-3 p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-blue-50 transition-colors ${
                                      selectedTurma === t.id
                                        ? "bg-blue-50"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="turma"
                                      value={t.id}
                                      checked={
                                        selectedTurma === t.id
                                      }
                                      onChange={() =>
                                        setSelectedTurma(t.id)
                                      }
                                      className="mt-1 w-4 h-4 text-blue-600"
                                    />

                                    <div>
                                      <p className="font-bold text-slate-800 text-sm">
                                        {t.nome}
                                      </p>

                                      <p className="text-xs text-slate-500">
                                        {[
                                          t.horario,
                                          (t.dias_semana || []).length > 0
                                            ? (t.dias_semana || []).join(", ")
                                            : null,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ") ||
                                          "Horário não informado"}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    isLoadingFormDados ||
                    !selectedAluno ||
                    !selectedTurma
                  }
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}

                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
