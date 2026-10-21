"use client";

import { BarChart3, Download, FileText, Settings2 } from "lucide-react";
import { GRAFICOS_RELATORIO, SECOES_RELATORIO, type ConfiguracaoRelatorio as Configuracao } from "@/lib/relatorios-exportacao";

export function ConfiguracaoRelatorio({ valor, onChange, pronto, carregando, exportando, pendente, quantidade, emitidoEm, onPDF, onCSV }: {
  valor: Configuracao;
  onChange: (configuracao: Configuracao) => void;
  pronto: boolean;
  carregando: boolean;
  exportando: boolean;
  pendente: boolean;
  quantidade: number;
  emitidoEm: string;
  onPDF: () => void;
  onCSV: () => void;
}) {
  const valido = valor.titulo.trim().length > 0 && valor.secoes.length > 0;
  const desabilitado = !pronto || carregando || exportando || pendente || !valido || !quantidade;
  const campo = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="configuracao-relatorio-titulo">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Settings2 className="h-5 w-5 text-blue-600" />
        <div><h2 id="configuracao-relatorio-titulo" className="font-semibold text-slate-900">2. Monte o relatório</h2><p className="text-xs text-slate-500">Combine os blocos e escolha o que vai aparecer na prévia e nos arquivos.</p></div>
      </div>
      <div className="space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)]">
          <label className="text-xs font-semibold text-slate-600">Nome do relatório
            <input value={valor.titulo} maxLength={120} onChange={(event) => onChange({ ...valor, titulo: event.target.value })} placeholder="Ex.: Frequência mensal - Microsoft Office" className={campo} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Formato da página PDF
            <select value={valor.orientacao} onChange={(event) => onChange({ ...valor, orientacao: event.target.value as Configuracao["orientacao"] })} className={campo}><option value="portrait">A4 - Retrato</option><option value="landscape">A4 - Paisagem</option></select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-800">Informações incluídas <span className="font-normal text-slate-500">· escolha uma ou mais</span></legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SECOES_RELATORIO.map((secao) => <label key={secao.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${valor.secoes.includes(secao.id) ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
              <input type="checkbox" checked={valor.secoes.includes(secao.id)} onChange={() => onChange({ ...valor, orientacao: secao.id === "registros" && !valor.secoes.includes(secao.id) ? "landscape" : valor.orientacao, secoes: valor.secoes.includes(secao.id) ? valor.secoes.filter((id) => id !== secao.id) : [...valor.secoes, secao.id] })} className="mt-0.5 h-4 w-4 shrink-0" />
              <span><span className="block text-sm font-semibold text-slate-800">{secao.nome}</span><span className="mt-1 block text-xs text-slate-500">{secao.descricao}</span></span>
            </label>)}
          </div>
          {valor.secoes.includes("registros") && <p className="mt-2 text-xs text-slate-500">Paisagem é recomendada para acomodar as colunas dos registros detalhados. Você pode alterar o formato acima.</p>}
        </fieldset>
        <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-800"><BarChart3 className="h-4 w-4 text-blue-600" />Gráficos opcionais</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {GRAFICOS_RELATORIO.map((grafico) => <label key={grafico.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={valor.graficos.includes(grafico.id)} onChange={() => onChange({ ...valor, graficos: valor.graficos.includes(grafico.id) ? valor.graficos.filter((id) => id !== grafico.id) : [...valor.graficos, grafico.id] })} className="h-4 w-4" />{grafico.nome}</label>)}
          </div>
          <p className="mt-3 text-xs text-slate-500">Os gráficos usam os mesmos filtros da consulta e aparecem na prévia e no PDF. O CSV contém os dados dos blocos selecionados.</p>
        </fieldset>
        {!valido && <p role="alert" className="text-sm text-amber-700">Informe um nome e selecione pelo menos um bloco de informações.</p>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            <p>Nome e data/hora de emissão são incluídos nos arquivos.</p>
            <p className="mt-1">{!pronto ? "Aplique os filtros para preparar a prévia." : pendente ? "Os filtros foram alterados. Atualize a prévia antes de exportar." : `${quantidade} registro(s) na consulta atual.`}</p>
            {emitidoEm && <p className="mt-1">Última emissão: {emitidoEm} (horário de Brasília).</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCSV} disabled={desabilitado} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50"><Download className="h-4 w-4" />Exportar CSV</button>
            <button type="button" onClick={onPDF} disabled={desabilitado} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><FileText className="h-4 w-4" />{exportando ? "Gerando PDF..." : "Exportar PDF"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
