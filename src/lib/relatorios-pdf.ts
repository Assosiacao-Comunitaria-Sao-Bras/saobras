import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { emissaoBrasil, type RelatorioExportacao } from "./relatorios-exportacao";

export function criarPDFRelatorio(relatorio: RelatorioExportacao) {
  const doc = new jsPDF({ orientation: relatorio.orientacao, unit: "mm", format: "a4", compress: true });
  doc.setProperties({ title: relatorio.titulo, author: "Polo de Ciência e Tecnologia - São Brás", creator: "Sistema do Polo Digital", subject: "Relatório de frequência" });
  doc.setCreationDate(new Date(relatorio.emitidoEm));
  const margem = 14;
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const util = largura - margem * 2;
  doc.setFont("helvetica", "bold").setFontSize(15);
  const titulo: string[] = doc.splitTextToSize(relatorio.titulo, util);
  const fimCabecalho = 26 + titulo.length * 6;
  let y = fimCabecalho + 7;

  function cabecalho() {
    doc.setFillColor(255, 255, 255).rect(0, 0, largura, fimCabecalho + 2, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(23, 55, 106);
    doc.text("PREFEITURA DE FEIRA DE SANTANA | POLO DE CIÊNCIA E TECNOLOGIA - SÃO BRÁS", margem, 12);
    doc.setFillColor(255, 207, 50).rect(margem, 15, util, 1.2, "F");
    doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(23, 55, 106);
    doc.text(titulo, margem, 23, { lineHeightFactor: 1.13 });
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(85, 100, 120);
    doc.text(`Emitido em ${emissaoBrasil(relatorio.emitidoEm)} - horário de Brasília (UTC-03:00)`, margem, fimCabecalho - 2);
  }

  function espaco(necessario: number) {
    if (y + necessario > altura - 18) {
      doc.addPage();
      y = fimCabecalho + 7;
      return true;
    }
    return false;
  }

  function texto(valor: string, tamanho = 8) {
    doc.setFont("helvetica", "normal").setFontSize(tamanho).setTextColor(85, 100, 120);
    const linhas: string[] = doc.splitTextToSize(valor, util);
    for (const linha of linhas) {
      espaco(5);
      doc.text(linha, margem, y);
      y += 4.5;
    }
  }

  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(23, 55, 106);
  doc.text("Filtros aplicados", margem, y);
  y += 6;
  relatorio.filtros.forEach((filtro) => texto(filtro));
  texto("Frequência = presenças / (presenças + faltas). Os percentuais consideram somente os registros incluídos pelos filtros.", 7.5);
  y += 4;

  for (const grafico of relatorio.graficos) {
    espaco(55);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(23, 55, 106);
    doc.text(grafico.titulo, margem, y);
    y += 6;
    texto(grafico.descricao, 8);
    doc.setFontSize(7.5).setTextColor(85, 100, 120);
    doc.setFillColor(16, 150, 100).rect(margem, y - 2, 3, 3, "F");
    doc.text("Presenças", margem + 5, y + 0.5);
    doc.setFillColor(220, 65, 75).rect(margem + 28, y - 2, 3, 3, "F");
    doc.text("Faltas", margem + 33, y + 0.5);
    y += 7;
    const maximo = Math.max(1, ...grafico.itens.map((item) => item.presencas + item.faltas));
    for (const item of grafico.itens) {
      doc.setFont("helvetica", "normal").setFontSize(8);
      const rotulo: string[] = doc.splitTextToSize(item.rotulo, util);
      if (espaco(rotulo.length * 4 + 29)) {
        doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(23, 55, 106);
        doc.text(`${grafico.titulo} (continuação)`, margem, y);
        y += 7;
        doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(85, 100, 120);
        doc.text("Verde: presenças | Vermelho: faltas", margem, y);
        y += 7;
      }
      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.setTextColor(40, 55, 75).text(rotulo, margem, y);
      y += rotulo.length * 4;
      doc.setFillColor(237, 242, 248).rect(margem, y, util, 3.5, "F");
      const presentes = item.presencas / maximo * util;
      const faltas = item.faltas / maximo * util;
      if (presentes) doc.setFillColor(16, 150, 100).rect(margem, y, presentes, 3.5, "F");
      if (faltas) doc.setFillColor(220, 65, 75).rect(margem + presentes, y, faltas, 3.5, "F");
      y += 7;
      doc.setFontSize(7.5).setTextColor(85, 100, 120);
      doc.text(`${item.presencas} presença(s) | ${item.faltas} falta(s)`, margem, y);
      y += 7;
    }
    y += 4;
  }

  for (const tabela of relatorio.tabelas) {
    espaco(tabela.linhas.length <= 10 ? 20 + tabela.linhas.length * 10 : 35);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(23, 55, 106);
    doc.text(tabela.titulo, margem, y);
    y += 5;
    let colunas = tabela.colunas;
    let linhas = tabela.linhas;
    // Em retrato, agrupa informações relacionadas para manter as letras legíveis.
    if (relatorio.orientacao === "portrait" && ["Participante", "CPF", "Data", "Hora", "Operador", "Método"].every((coluna) => colunas.includes(coluna))) {
      colunas = ["Participante / CPF", "Curso", "Turma", "Data / hora", "Situação", "Operador / método"];
      const campo = (linha: (string | number)[], nome: string) => String(linha[tabela.colunas.indexOf(nome)] ?? "");
      linhas = tabela.linhas.map((linha) => [
        `${campo(linha, "Participante")}\nCPF: ${campo(linha, "CPF")}`,
        campo(linha, "Curso"), campo(linha, "Turma"),
        `${campo(linha, "Data")}\n${campo(linha, "Hora")}`,
        campo(linha, "Situação"), `${campo(linha, "Operador")}\nMétodo: ${campo(linha, "Método")}`,
      ]);
    }
    const pesos = colunas.map((coluna) => coluna === "Participante / CPF" ? 3 : coluna === "Data / hora" ? 1.7 : coluna === "Situação" ? 1.3 : coluna === "Operador / método" ? 2.5 : ["Participante", "Curso", "Turma", "Operador"].includes(coluna) ? 2.3 : coluna === "CPF" ? 1.8 : 1);
    const soma = pesos.reduce((total, peso) => total + peso, 0);
    autoTable(doc, {
      startY: y,
      head: [colunas],
      body: linhas.length ? linhas : [colunas.map((_, indice) => indice === 0 ? "Sem dados para os filtros aplicados." : "")],
      margin: { top: fimCabecalho + 5, bottom: 18, left: margem, right: margem },
      rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: colunas.length > 7 ? 7 : 8, cellPadding: 2.5, overflow: "linebreak", textColor: [40, 55, 75], lineColor: [223, 231, 241], lineWidth: 0.1 },
      headStyles: { fillColor: [23, 55, 106], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: Object.fromEntries(pesos.map((peso, indice) => [indice, { cellWidth: peso / soma * util }])),
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 11;
  }

  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina);
    cabecalho();
    doc.setDrawColor(223, 231, 241).setLineWidth(0.2).line(margem, altura - 13, largura - margem, altura - 13);
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(100, 113, 132);
    doc.text("Sistema do Polo Digital - São Brás", margem, altura - 8);
    doc.text(`Página ${pagina} de ${paginas}`, largura - margem, altura - 8, { align: "right" });
  }
  return doc;
}
