"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Filter, Search, Settings2, Users } from "lucide-react";
import type { Aluno } from "./AlunosClient";
import { calcularSituacaoAluno, normalizarBusca, STATUS_ALUNO, type RegistroFrequenciaAluno, type StatusAluno } from "@/lib/alunos-situacao";

export function StatusAlunoBadge({ status }: { status: StatusAluno }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_ALUNO[status].cor}`}>
      {status === "desistente" ? <AlertCircle className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {STATUS_ALUNO[status].label}
    </span>
  );
}

export function AlunosOverview({ alunos, frequencias, erroFrequencia, limite, onLimiteChange, onSelect, onCreate }: {
  alunos: Aluno[];
  frequencias: Map<string, RegistroFrequenciaAluno[]>;
  erroFrequencia?: string;
  limite: number;
  onLimiteChange: (valor: number) => void;
  onSelect: (aluno: Aluno) => void;
  onCreate: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<StatusAluno | "todos">("todos");
  const [curso, setCurso] = useState("");
  const [turma, setTurma] = useState("");
  const [ordem, setOrdem] = useState("nome");
  const [visualizacao, setVisualizacao] = useState("compacta");
  const [pagina, setPagina] = useState(1);

  const cursos = useMemo(() => {
    const mapa = new Map<string, string>();
    alunos.forEach((aluno) => aluno.matriculas?.forEach((matricula) => {
      const relacao = Array.isArray(matricula.cursos) ? matricula.cursos[0] : matricula.cursos;
      mapa.set(matricula.curso_id, relacao?.titulo || "Curso sem título");
    }));
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [alunos]);

  const turmas = useMemo(() => {
    const mapa = new Map<string, string>();
    alunos.forEach((aluno) => aluno.matriculas?.forEach((matricula) => {
      if (!matricula.turma_id || (curso && matricula.curso_id !== curso)) return;
      const relacao = Array.isArray(matricula.turmas) ? matricula.turmas[0] : matricula.turmas;
      mapa.set(matricula.turma_id, relacao?.nome || "Turma sem nome");
    }));
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [alunos, curso]);

  const base = useMemo(() => {
    const termo = normalizarBusca(busca);
    const numeros = termo.replace(/\D/g, "");
    return alunos.flatMap((aluno) => {
      const correspondeBusca = normalizarBusca(aluno.nome_completo).includes(termo) ||
        (!!numeros && ((aluno.cpf ?? "").replace(/\D/g, "").includes(numeros) ||
          (aluno.telefone ?? "").replace(/\D/g, "").includes(numeros)));
      if (!correspondeBusca) return [];
      const matriculas = (aluno.matriculas ?? []).filter((matricula) =>
        (!curso || matricula.curso_id === curso) && (!turma || matricula.turma_id === turma));
      if ((curso || turma) && !matriculas.length) return [];
      return [{ aluno, situacao: calcularSituacaoAluno(matriculas, frequencias.get(aluno.id) ?? [], limite) }];
    });
  }, [alunos, busca, curso, turma, frequencias, limite]);

  const contagens = { todos: base.length, frequente: 0, matriculado: 0, inativo: 0, desistente: 0, encerrado: 0 };
  base.forEach(({ situacao }) => { contagens[situacao.status]++; });
  const filtrados = base.filter(({ situacao }) => status === "todos" || situacao.status === status)
    .sort((a, b) => ordem === "recentes"
      ? b.aluno.criado_em.localeCompare(a.aluno.criado_em)
      : a.aluno.nome_completo.localeCompare(b.aluno.nome_completo, "pt-BR") * (ordem === "nome-desc" ? -1 : 1));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / 30));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * 30, paginaAtual * 30);
  const filtrosAtivos = !!busca || !!curso || !!turma || status !== "todos";
  const limparFiltros = () => { setBusca(""); setCurso(""); setTurma(""); setStatus("todos"); setPagina(1); };
  const campo = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Alunos</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe os alunos e encontre quem precisa de atenção.</p>
        </div>
        <button type="button" onClick={onCreate} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">+ Novo Aluno</button>
      </div>

      {erroFrequencia && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>Não foi possível consultar a frequência. Os alunos com matrícula aparecem como matriculados até a atualização dos dados.
            <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Tentar novamente</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section aria-labelledby="titulo-filtros" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="titulo-filtros" className="flex items-center gap-2 text-sm font-bold"><Filter className="h-4 w-4 text-blue-600" />Mesa de filtros</h2>
            <button type="button" onClick={limparFiltros} disabled={!filtrosAtivos} className="text-xs font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">Limpar filtros</button>
          </div>
          <label className="block text-xs font-medium text-slate-600" htmlFor="busca-alunos">Buscar aluno</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="busca-alunos" type="search" placeholder="Nome, CPF ou telefone" value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} className={`${campo} pl-9`} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-slate-600">Status
              <select value={status} onChange={(e) => { setStatus(e.target.value as StatusAluno | "todos"); setPagina(1); }} className={campo}>
                <option value="todos">Todos os status</option>
                {Object.entries(STATUS_ALUNO).map(([valor, item]) => <option key={valor} value={valor}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Curso
              <select value={curso} onChange={(e) => { setCurso(e.target.value); setTurma(""); setPagina(1); }} className={campo}>
                <option value="">Todos os cursos</option>
                {cursos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Turma
              <select value={turma} onChange={(e) => { setTurma(e.target.value); setPagina(1); }} className={campo}>
                <option value="">Todas as turmas</option>
                {turmas.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section aria-labelledby="titulo-configuracoes" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 id="titulo-configuracoes" className="mb-4 flex items-center gap-2 text-sm font-bold"><Settings2 className="h-4 w-4 text-blue-600" />Mesa de configuração</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Frequência mínima
              <select value={limite} onChange={(e) => { onLimiteChange(Number(e.target.value)); setPagina(1); }} className={campo}>
                <option value={30}>30% ou mais</option><option value={40}>40% ou mais</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Visualização
              <select value={visualizacao} onChange={(e) => setVisualizacao(e.target.value)} className={campo}>
                <option value="compacta">Nome e status</option><option value="detalhada">Tabela completa</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Frequência = presenças ÷ (presenças + faltas) nas chamadas registradas das matrículas sem desistência. Abaixo de {limite}%, o aluno permanece matriculado.</p>
          <p className="mt-1 text-xs text-slate-500">A desistência é registrada nos detalhes da matrícula.</p>
        </section>
      </div>

      <div aria-label="Filtrar por situação do aluno" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {(["todos", "frequente", "matriculado", "inativo", "desistente", "encerrado"] as const).map((valor) => (
          <button type="button" key={valor} aria-pressed={status === valor} onClick={() => { setStatus(valor); setPagina(1); }} className={`rounded-xl border p-4 text-left transition-colors ${valor === "todos" ? "border-slate-200 bg-white text-slate-500" : STATUS_ALUNO[valor].cor} ${status === valor ? "ring-2 ring-current ring-offset-1" : "hover:shadow-sm"}`}>
            <span className="text-xs font-medium">{valor === "todos" ? "Todos os alunos" : STATUS_ALUNO[valor].label}</span>
            <span className="mt-1 block text-2xl font-bold text-slate-800">{contagens[valor]}</span>
          </button>
        ))}
      </div>

      <section aria-labelledby="titulo-lista" className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h2 id="titulo-lista" className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-blue-600" />Alunos</h2>
            <p aria-live="polite" className="mt-1 text-xs text-slate-500">{filtrados.length} de {alunos.length} alunos · clique no nome para ver os detalhes</p></div>
          <label className="flex items-center gap-2 text-xs text-slate-500">Ordenar por
            <select value={ordem} onChange={(e) => { setOrdem(e.target.value); setPagina(1); }} className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700">
              <option value="nome">Nome: A–Z</option><option value="nome-desc">Nome: Z–A</option><option value="recentes">Cadastro mais recente</option>
            </select>
          </label>
        </div>
        {!visiveis.length ? (
          <div className="px-5 py-14 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">{alunos.length ? "Nenhum aluno encontrado com estes filtros." : "Nenhum aluno cadastrado no momento."}</p>
            {filtrosAtivos && <button type="button" onClick={limparFiltros} className="mt-3 text-sm font-semibold text-blue-600">Limpar filtros</button>}</div>
        ) : visualizacao === "compacta" ? (
          <ul className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {visiveis.map(({ aluno, situacao }) => (
              <li key={aluno.id}>
                <button type="button" onClick={() => onSelect(aluno)} className="flex h-full w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-blue-500">
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">{aluno.nome_completo}</span>
                  <StatusAlunoBadge status={situacao.status} />
                  {situacao.desistencias > 0 && situacao.status !== "desistente" && <span className="flex basis-full items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5" />Desistência registrada em outro curso/turma</span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Nome do aluno</th><th className="px-5 py-3">CPF</th><th className="px-5 py-3">Bairro</th><th className="px-5 py-3">Telefone</th><th className="px-5 py-3">Frequência</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{visiveis.map(({ aluno, situacao }) => (
              <tr key={aluno.id} className="hover:bg-slate-50"><td className="px-5 py-4"><button type="button" onClick={() => onSelect(aluno)} className="flex items-center gap-2 text-left font-semibold text-blue-700 hover:underline">{aluno.nome_completo}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" /></button></td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">{aluno.cpf ? `***.***.***-${aluno.cpf.replace(/\D/g, "").slice(-2)}` : "Não informado"}</td>
                <td className="px-5 py-4 text-slate-500">{aluno.bairro || "Não informado"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{aluno.telefone || "Não informado"}</td>
                <td className="px-5 py-4 text-slate-500">{erroFrequencia ? "Indisponível" : situacao.percentual === null ? "Sem chamadas" : `${situacao.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</td>
                <td className="px-5 py-4"><StatusAlunoBadge status={situacao.status} />{situacao.desistencias > 0 && situacao.status !== "desistente" && <p className="mt-1 text-xs text-red-600">Desistência em outro curso/turma</p>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {totalPaginas > 1 && <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>Página {paginaAtual} de {totalPaginas}</span><div className="flex gap-2"><button type="button" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Anterior</button><button type="button" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Próxima</button></div></div>}
      </section>
    </div>
  );
}
