"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ChevronLeft, ChevronRight, Eye, FileText, LoaderCircle, SlidersHorizontal } from "lucide-react";
import {
  baixarArquivo, emissaoBrasil, gerarCSVRelatorio, nomeArquivoRelatorio,
  GRAFICOS_RELATORIO, SECOES_RELATORIO,
  type ConfiguracaoRelatorio, type RelatorioExportacao, type TabelaRelatorio,
} from "@/lib/relatorios-exportacao";
import "./relatorio-dashboard.css";

type Props = {
  relatorio: RelatorioExportacao | null;
  configuracao: ConfiguracaoRelatorio;
  onChange: (configuracao: ConfiguracaoRelatorio) => void;
  indisponivel: boolean;
};

function TabelaPrevia({ tabela }: { tabela: TabelaRelatorio }) {
  const [pagina, setPagina] = useState(0);
  const paginas = Math.max(1, Math.ceil(tabela.linhas.length / 25));
  const atual = Math.min(pagina, paginas - 1);
  const inicio = atual * 25;
  return <section className="bi-report-table-section" aria-label={tabela.titulo}>
    <div className="bi-report-table-title"><h3>{tabela.titulo}</h3><span>{tabela.linhas.length.toLocaleString("pt-BR")} linhas</span></div>
    <div className="bi-report-table-scroll" tabIndex={0} aria-label={`Tabela ${tabela.titulo}. Role horizontalmente para consultar todas as colunas.`}>
      <table><thead><tr>{tabela.colunas.map((coluna, index) => <th scope="col" key={`${coluna}-${index}`}>{coluna}</th>)}</tr></thead>
        <tbody>{tabela.linhas.slice(inicio, inicio + 25).map((linha, index) => <tr key={inicio + index}>{tabela.colunas.map((_, coluna) => <td key={coluna}>{linha[coluna] ?? "—"}</td>)}</tr>)}
          {!tabela.linhas.length && <tr><td colSpan={tabela.colunas.length}>Sem dados para os filtros aplicados.</td></tr>}
        </tbody></table>
    </div>
    {paginas > 1 && <div className="bi-report-pagination"><span>Linhas {inicio + 1}–{Math.min(inicio + 25, tabela.linhas.length)} de {tabela.linhas.length}. Todas serão exportadas.</span><div><button type="button" disabled={atual === 0} onClick={() => setPagina(atual - 1)} aria-label={`Página anterior de ${tabela.titulo}`}><ChevronLeft size={16} /></button><span>{atual + 1} / {paginas}</span><button type="button" disabled={atual === paginas - 1} onClick={() => setPagina(atual + 1)} aria-label={`Próxima página de ${tabela.titulo}`}><ChevronRight size={16} /></button></div></div>}
  </section>;
}

export function RelatorioDashboard({ relatorio, configuracao, onChange, indisponivel }: Props) {
  const chave = useMemo(() => JSON.stringify(relatorio), [relatorio]);
  const [operacao, setOperacao] = useState<{ chave: string; tipo: "preview" | "download"; id: number } | null>(null);
  const [pdf, setPDF] = useState<{ chave: string; blob: Blob; url: string } | null>(null);
  const [exibirPDF, setExibirPDF] = useState(false);
  const [erro, setErro] = useState<{ chave: string; mensagem: string } | null>(null);
  const versao = useRef(0);
  const urls = useRef(new Set<string>());
  const valido = !!relatorio && !!configuracao.titulo.trim() && configuracao.secoes.length > 0 && !indisponivel;
  const ocupado = operacao?.chave === chave;
  const pdfAtual = pdf?.chave === chave && valido ? pdf : null;

  useEffect(() => {
    versao.current += 1;
    return () => { versao.current += 1; };
  }, [chave, indisponivel]);

  useEffect(() => {
    const objetos = urls.current;
    // The viewer state must follow the lifetime of its external blob URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPDF(null);
    return () => {
      objetos.forEach((url) => URL.revokeObjectURL(url));
      objetos.clear();
    };
  }, [chave]);

  async function prepararPDF(tipo: "preview" | "download") {
    if (!valido || !relatorio || ocupado) return;
    const snapshot = relatorio;
    if (pdfAtual) {
      if (tipo === "preview") setExibirPDF(true);
      else baixarArquivo(pdfAtual.blob, nomeArquivoRelatorio(snapshot.titulo, snapshot.emitidoEm, "pdf"));
      return;
    }
    const requisicao = ++versao.current;
    setErro(null);
    setOperacao({ chave, tipo, id: requisicao });
    try {
      const { criarPDFRelatorio } = await import("@/lib/relatorios-pdf");
      if (requisicao !== versao.current) return;
      const blob = criarPDFRelatorio(snapshot).output("blob");
      if (requisicao !== versao.current) return;
      const url = URL.createObjectURL(blob);
      urls.current.add(url);
      setPDF({ chave, blob, url });
      if (tipo === "preview") setExibirPDF(true);
      else baixarArquivo(blob, nomeArquivoRelatorio(snapshot.titulo, snapshot.emitidoEm, "pdf"));
    } catch {
      if (requisicao === versao.current) setErro({ chave, mensagem: "Não foi possível gerar o PDF. Tente novamente ou exporte os dados em CSV." });
    } finally {
      setOperacao((atual) => atual?.id === requisicao ? null : atual);
    }
  }

  function exportarCSV() {
    if (!valido || !relatorio) return;
    try {
      baixarArquivo(new Blob([gerarCSVRelatorio(relatorio)], { type: "text/csv;charset=utf-8;" }), nomeArquivoRelatorio(relatorio.titulo, relatorio.emitidoEm, "csv"));
      setErro(null);
    } catch {
      setErro({ chave, mensagem: "Não foi possível exportar o CSV. Tente novamente." });
    }
  }

  return <div className="bi-report">
    <aside className="bi-report-settings" aria-label="Configurações do relatório">
      <div className="bi-report-heading"><SlidersHorizontal size={20} /><div><h2>Monte seu relatório</h2><p>Os filtros do dashboard já estão aplicados.</p></div></div>
      <label className="bi-report-field">Nome do relatório<input maxLength={120} value={configuracao.titulo} onChange={(event) => onChange({ ...configuracao, titulo: event.target.value })} placeholder="Ex.: Acompanhamento das oficinas" /></label>
      <label className="bi-report-field">Formato do PDF<select value={configuracao.orientacao} onChange={(event) => onChange({ ...configuracao, orientacao: event.target.value as ConfiguracaoRelatorio["orientacao"] })}><option value="portrait">A4 · Retrato</option><option value="landscape">A4 · Paisagem</option></select></label>
      <fieldset><legend>Informações incluídas</legend>{SECOES_RELATORIO.map((secao) => <label className="bi-report-choice" key={secao.id}><input type="checkbox" checked={configuracao.secoes.includes(secao.id)} onChange={() => onChange({ ...configuracao, secoes: configuracao.secoes.includes(secao.id) ? configuracao.secoes.filter((id) => id !== secao.id) : [...configuracao.secoes, secao.id] })} /><span><strong>{secao.nome}</strong><small>{secao.descricao}</small></span></label>)}</fieldset>
      <fieldset><legend>Gráficos no PDF</legend>{GRAFICOS_RELATORIO.map((grafico) => <label className="bi-report-choice bi-report-choice-compact" key={grafico.id}><input type="checkbox" checked={configuracao.graficos.includes(grafico.id)} onChange={() => onChange({ ...configuracao, graficos: configuracao.graficos.includes(grafico.id) ? configuracao.graficos.filter((id) => id !== grafico.id) : [...configuracao.graficos, grafico.id] })} /><span>{grafico.nome}</span></label>)}<p className="bi-report-note">O CSV inclui os dados dos blocos selecionados. Os gráficos aparecem na prévia e no PDF.</p></fieldset>
      {(!configuracao.titulo.trim() || !configuracao.secoes.length) && <p className="bi-report-warning" role="alert">Informe um nome e selecione pelo menos um bloco de informações.</p>}
      <div className="bi-report-actions"><button type="button" className="bi-report-primary" disabled={!valido || ocupado} onClick={() => prepararPDF("preview")}>{ocupado ? <LoaderCircle className="bi-report-spin" size={17} /> : <Eye size={17} />}{ocupado ? "Preparando PDF…" : "Pré-visualizar PDF"}</button><div><button type="button" disabled={!valido || ocupado} onClick={() => prepararPDF("download")}><FileText size={16} />Baixar PDF</button><button type="button" disabled={!valido || ocupado} onClick={exportarCSV}><ArrowDownToLine size={16} />Exportar CSV</button></div></div>
      <p className="bi-report-note">O arquivo inclui o nome do relatório, os filtros e a data e hora de emissão.</p>
      {erro?.chave === chave && <p role="alert" className="bi-report-warning">{erro.mensagem}</p>}
    </aside>
    <section className="bi-report-preview" aria-label="Prévia do relatório" aria-busy={ocupado}>
      <div className="bi-report-preview-top"><div><span className="bi-report-eyebrow">PRÉVIA DO RELATÓRIO</span><p>{pdfAtual && exibirPDF ? "Visualização do arquivo PDF que será baixado." : "Confira os dados. Abra a prévia em PDF para conferir a paginação."}</p></div>{pdfAtual && <div className="bi-report-preview-options"><button type="button" onClick={() => setExibirPDF(!exibirPDF)}>{exibirPDF ? "Ver dados" : "Ver PDF"}</button><a href={pdfAtual.url} target="_blank" rel="noopener noreferrer">Abrir PDF ↗</a></div>}</div>
      {!valido ? <div className="bi-report-empty"><FileText size={36} /><h3>Prepare sua prévia</h3><p>{indisponivel ? "A prévia ficará disponível após o carregamento dos dados e a correção dos filtros, se necessário." : "Dê um nome ao relatório e escolha as informações que deseja incluir."}</p></div>
        : pdfAtual && exibirPDF ? <div className="bi-report-pdf"><iframe src={pdfAtual.url} title={`Prévia PDF: ${relatorio!.titulo}`} /><p>Se o navegador não exibir o documento, use <a href={pdfAtual.url} target="_blank" rel="noopener noreferrer">Abrir PDF em uma nova aba</a>.</p></div>
        : <article className="bi-report-paper">
          <header><span>POLO DE CIÊNCIA E TECNOLOGIA · SÃO BRÁS</span><h2>{relatorio!.titulo}</h2><p>Emitido em {emissaoBrasil(relatorio!.emitidoEm)} · horário de Brasília</p></header>
          <section className="bi-report-applied"><h3>Filtros aplicados</h3><ul>{relatorio!.filtros.map((filtro, index) => <li key={index}>{filtro}</li>)}</ul><p>Frequência = presenças ÷ (presenças + faltas) nos registros selecionados.</p></section>
          {relatorio!.graficos.map((grafico) => {
            const maximo = Math.max(1, ...grafico.itens.map((item) => item.presencas + item.faltas));
            return <section className="bi-report-chart" key={grafico.id} aria-label={grafico.titulo}><h3>{grafico.titulo}</h3><p>{grafico.descricao}</p><div className="bi-report-legend"><span><i style={{ background: "#109664" }} />Presenças</span><span><i style={{ background: "#dc414b" }} />Faltas</span></div>{grafico.itens.length ? grafico.itens.map((item, index) => <div className="bi-report-bar" key={`${item.rotulo}-${index}`}><div><strong>{item.rotulo}</strong><span>{item.presencas} presença(s) · {item.faltas} falta(s)</span></div><div role="img" aria-label={`${item.rotulo}: ${item.presencas} presenças e ${item.faltas} faltas`}><i style={{ width: `${item.presencas / maximo * 100}%`, background: "#109664" }} /><i style={{ width: `${item.faltas / maximo * 100}%`, background: "#dc414b" }} /></div></div>) : <p>Sem registros para os filtros aplicados.</p>}</section>;
          })}
          {relatorio!.tabelas.map((tabela, index) => <TabelaPrevia key={`${tabela.titulo}-${index}`} tabela={tabela} />)}
          <footer>Sistema do Polo Digital · Os arquivos usam exatamente os filtros e blocos desta prévia.</footer>
        </article>}
    </section>
  </div>;
}
