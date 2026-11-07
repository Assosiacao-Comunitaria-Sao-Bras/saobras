"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Acao = "INSERT" | "UPDATE" | "DELETE";

type Registro = {
  id: number;
  criado_em: string;
  usuario_email: string | null;
  usuario_nome: string | null;
  tabela: string;
  acao: Acao;
  descricao: string;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
};

type OperadorOpcao = { nome: string; email: string };

const POR_PAGINA = 100;

const TIPOS = [
  { valor: "", rotulo: "Todos os tipos" },
  { valor: "alunos", rotulo: "Alunos" },
  { valor: "matriculas", rotulo: "Matrículas" },
  { valor: "cursos", rotulo: "Cursos" },
  { valor: "turmas", rotulo: "Turmas" },
  { valor: "operadores", rotulo: "Operadores" },
];

const ACOES = [
  { valor: "", rotulo: "Todas as ações" },
  { valor: "INSERT", rotulo: "Criou" },
  { valor: "UPDATE", rotulo: "Editou" },
  { valor: "DELETE", rotulo: "Excluiu" },
];

const ESTILO_ACAO: Record<Acao, { rotulo: string; classe: string }> = {
  INSERT: { rotulo: "Criou", classe: "bg-green-50 text-green-700 border-green-100" },
  UPDATE: { rotulo: "Editou", classe: "bg-amber-50 text-amber-700 border-amber-100" },
  DELETE: { rotulo: "Excluiu", classe: "bg-red-50 text-red-700 border-red-100" },
};

const ROTULO_TABELA: Record<string, string> = {
  alunos: "Aluno",
  matriculas: "Matrícula",
  cursos: "Curso",
  turmas: "Turma",
  operadores: "Operador",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Bahia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function valorTexto(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function camposAlterados(r: Registro) {
  const antes = r.dados_antes ?? {};
  const depois = r.dados_depois ?? {};
  return Object.keys(depois)
    .filter((k) => JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map((k) => ({ campo: k, antes: antes[k], depois: depois[k] }));
}

export default function AuditoriaClient() {
  const [operadores, setOperadores] = useState<OperadorOpcao[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [temMais, setTemMais] = useState(false);
  const [abertos, setAbertos] = useState<Set<number>>(new Set());

  // Filtros
  const [operador, setOperador] = useState("");
  const [tipo, setTipo] = useState("");
  const [acao, setAcao] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    supabase
      .from("operadores")
      .select("nome, email")
      .order("nome", { ascending: true })
      .then(({ data }) => setOperadores((data ?? []) as OperadorOpcao[]));
  }, []);

  const carregar = useCallback(
    async (inicio: number) => {
      setCarregando(true);
      setErro(null);

      let query = supabase
        .from("auditoria")
        .select("*")
        .order("criado_em", { ascending: false })
        .order("id", { ascending: false })
        .range(inicio, inicio + POR_PAGINA - 1);

      if (operador) query = query.eq("usuario_email", operador.trim().toLowerCase());
      if (tipo) query = query.eq("tabela", tipo);
      if (acao) query = query.eq("acao", acao);
      if (de) query = query.gte("criado_em", `${de}T00:00:00-03:00`);
      if (ate) query = query.lte("criado_em", `${ate}T23:59:59.999-03:00`);
      if (busca.trim()) {
        query = query.ilike("descricao", `%${busca.trim().replace(/[%_\\]/g, "\\$&")}%`);
      }

      const { data, error } = await query;

      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }

      const lista = (data ?? []) as Registro[];
      setRegistros((anterior) => (inicio === 0 ? lista : [...anterior, ...lista]));
      setTemMais(lista.length === POR_PAGINA);
      setCarregando(false);
    },
    [operador, tipo, acao, de, ate, busca]
  );

  useEffect(() => {
    setAbertos(new Set());
    carregar(0);
  }, [carregar]);

  const alternar = (id: number) => {
    setAbertos((anterior) => {
      const novo = new Set(anterior);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const limparFiltros = () => {
    setOperador("");
    setTipo("");
    setAcao("");
    setDe("");
    setAte("");
    setBuscaDigitada("");
    setBusca("");
  };

  const campoClasse =
    "w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Atividades dos Operadores</h1>
        <p className="text-sm text-slate-500 mt-1">
          Veja quem cadastrou, editou ou excluiu alunos, matrículas, cursos, turmas e operadores.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setBusca(buscaDigitada);
            }}
            className="relative max-w-md"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar (ex.: nome do aluno) e apertar Enter..."
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            />
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select value={operador} onChange={(e) => setOperador(e.target.value)} className={campoClasse}>
              <option value="">Todos os operadores</option>
              {operadores.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.nome}
                </option>
              ))}
            </select>

            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campoClasse}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>

            <select value={acao} onChange={(e) => setAcao(e.target.value)} className={campoClasse}>
              {ACOES.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.rotulo}
                </option>
              ))}
            </select>

            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={campoClasse} title="Data inicial" />
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={campoClasse} title="Data final" />
          </div>

          <button
            type="button"
            onClick={limparFiltros}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpar filtros
          </button>
        </div>

        {erro && (
          <div className="m-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium">
            Erro ao carregar as atividades: {erro}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="w-8 px-3 py-4" />
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Data e hora</th>
                <th className="px-4 py-4 font-semibold">Operador</th>
                <th className="px-4 py-4 font-semibold">Ação</th>
                <th className="px-4 py-4 font-semibold">O que foi feito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.length === 0 && !carregando && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma atividade encontrada.
                  </td>
                </tr>
              )}

              {registros.map((r) => {
                const aberto = abertos.has(r.id);
                const estilo = ESTILO_ACAO[r.acao];
                const detalhes =
                  r.acao === "UPDATE"
                    ? camposAlterados(r).map((c) => ({ campo: c.campo, antes: c.antes, depois: c.depois }))
                    : Object.entries((r.acao === "INSERT" ? r.dados_depois : r.dados_antes) ?? {}).map(
                        ([campo, valor]) => ({ campo, antes: undefined, depois: valor })
                      );

                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => alternar(r.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-4 text-slate-400">
                        {aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{formatarData(r.criado_em)}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {r.usuario_nome || r.usuario_email || "—"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold border rounded-full ${estilo.classe}`}>
                          {estilo.rotulo} · {ROTULO_TABELA[r.tabela] ?? r.tabela}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{r.descricao}</td>
                    </tr>

                    {aberto && (
                      <tr key={`${r.id}-detalhe`} className="bg-slate-50">
                        <td />
                        <td colSpan={4} className="px-4 py-4">
                          <p className="text-xs font-semibold text-slate-500 mb-2">
                            {r.acao === "UPDATE" ? "O que mudou" : r.acao === "INSERT" ? "Dados criados" : "Dados que foram excluídos"}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700">
                            {detalhes.map((d) => (
                              <div key={d.campo} className="break-words">
                                <span className="font-semibold">{d.campo}:</span>{" "}
                                {r.acao === "UPDATE" ? (
                                  <>
                                    <span className="text-red-600">{valorTexto(d.antes)}</span>
                                    {" → "}
                                    <span className="text-green-700">{valorTexto(d.depois)}</span>
                                  </>
                                ) : (
                                  valorTexto(d.depois)
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {carregando && <p className="p-4 text-center text-sm text-slate-500">Carregando...</p>}

        {temMais && !carregando && (
          <div className="p-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => carregar(registros.length)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Carregar mais
            </button>
          </div>
        )}
      </div>
    </div>
  );
}