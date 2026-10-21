export type SecaoRelatorio = "resumo" | "cursos" | "turmas" | "alunos" | "registros";
export type TipoGrafico = "distribuicao" | "cursos" | "turmas" | "dias";
export type ConfiguracaoRelatorio = {
  titulo: string;
  secoes: SecaoRelatorio[];
  graficos: TipoGrafico[];
  orientacao: "portrait" | "landscape";
};

export const SECOES_RELATORIO: { id: SecaoRelatorio; nome: string; descricao: string }[] = [
  { id: "resumo", nome: "Resumo geral", descricao: "Totais, participantes e percentual de presença." },
  { id: "cursos", nome: "Por curso", descricao: "Presenças e faltas agrupadas por curso." },
  { id: "turmas", nome: "Por turma", descricao: "Compare os resultados das turmas selecionadas." },
  { id: "alunos", nome: "Por participante", descricao: "Frequência individual e número de chamadas." },
  { id: "registros", nome: "Registros detalhados", descricao: "Aluno, turma, data, situação e operador de cada lançamento." },
];

export const GRAFICOS_RELATORIO: { id: TipoGrafico; nome: string }[] = [
  { id: "distribuicao", nome: "Presenças e faltas" },
  { id: "cursos", nome: "Comparação por curso" },
  { id: "turmas", nome: "Comparação por turma" },
  { id: "dias", nome: "Evolução por dia" },
];

export const CONFIGURACAO_PADRAO: ConfiguracaoRelatorio = {
  titulo: "Relatório de frequência",
  secoes: ["resumo", "cursos", "alunos"],
  graficos: [],
  orientacao: "portrait",
};

export type TabelaRelatorio = { titulo: string; colunas: string[]; linhas: (string | number)[][] };
export type GraficoRelatorio = {
  id: TipoGrafico;
  titulo: string;
  descricao: string;
  itens: { rotulo: string; presencas: number; faltas: number }[];
};
export type RelatorioExportacao = {
  titulo: string;
  emitidoEm: string;
  filtros: string[];
  orientacao: "portrait" | "landscape";
  tabelas: TabelaRelatorio[];
  graficos: GraficoRelatorio[];
};

export function dataBrasil(valor: string) {
  return new Date(valor.length === 10 ? `${valor}T12:00:00-03:00` : valor)
    .toLocaleDateString("pt-BR", { timeZone: "America/Bahia" });
}

export function emissaoBrasil(valor: string) {
  return new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "medium" });
}

export function nomeArquivoRelatorio(titulo: string, emitidoEm: string, extensao: "csv" | "pdf") {
  const nome = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "relatorio";
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(emitidoEm));
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((item) => item.type === tipo)?.value ?? "";
  return `${nome}_${parte("year")}-${parte("month")}-${parte("day")}_${parte("hour")}-${parte("minute")}-${parte("second")}.${extensao}`;
}

export function gerarCSVRelatorio(relatorio: RelatorioExportacao) {
  const campos = [...new Set(relatorio.tabelas.flatMap((tabela) => tabela.colunas))];
  const escapar = (valor: string | number) => {
    let texto = String(valor);
    if (/^[\s]*[=+@-]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const linhas: (string | number)[][] = [["Relatório", "Emissão (America/Bahia)", "Filtros", "Bloco", ...campos]];
  for (const tabela of relatorio.tabelas) {
    for (const linha of tabela.linhas) {
      linhas.push([relatorio.titulo, emissaoBrasil(relatorio.emitidoEm), relatorio.filtros.join(" | "), tabela.titulo,
        ...campos.map((campo) => {
          const indice = tabela.colunas.indexOf(campo);
          return indice === -1 ? "" : linha[indice] ?? "";
        }),
      ]);
    }
  }
  return "\uFEFF" + linhas.map((linha) => linha.map(escapar).join(";")).join("\r\n");
}

export function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
