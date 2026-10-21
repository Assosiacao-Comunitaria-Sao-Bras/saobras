import { test } from "node:test";
import assert from "node:assert/strict";
import { dataBrasil, emissaoBrasil, gerarCSVRelatorio, nomeArquivoRelatorio } from "../src/lib/relatorios-exportacao.ts";

const relatorio = {
  titulo: 'Frequência "São Brás"', emitidoEm: "2026-10-21T02:15:09Z", filtros: ["Curso: Office", "Turma: Manhã"],
  orientacao: "portrait", graficos: [], tabelas: [
    { titulo: "Resumo geral", colunas: ["Indicador", "Valor"], linhas: [["Presenças", 2]] },
    { titulo: "Por participante", colunas: ["Participante", "Presenças"], linhas: [['João; "Silva"', 2]] },
  ],
};

test("arquivo inclui nome normalizado e data/hora no fuso de Bahia", () => {
  assert.equal(nomeArquivoRelatorio(relatorio.titulo, relatorio.emitidoEm, "pdf"), "frequencia_sao_bras_2026-10-20_23-15-09.pdf");
  assert.equal(nomeArquivoRelatorio("///", relatorio.emitidoEm, "csv"), "relatorio_2026-10-20_23-15-09.csv");
});

test("data sem horário não recua um dia e emissão inclui segundos", () => {
  assert.equal(dataBrasil("2026-10-20"), "20/10/2026");
  assert.match(emissaoBrasil(relatorio.emitidoEm), /20\/10\/2026.*23:15:09/);
});

test("CSV mantém BOM, separador, acentos e escaping de aspas", () => {
  const csv = gerarCSVRelatorio(relatorio);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.ok(csv.includes('"João; ""Silva"""'));
  assert.ok(csv.includes('"Frequência ""São Brás"""'));
  assert.equal(csv.split("\r\n").length, 3);
});

test("blocos diferentes compartilham cabeçalho consistente e metadados", () => {
  const csv = gerarCSVRelatorio(relatorio);
  const linhas = csv.split("\r\n");
  assert.match(linhas[0], /"Bloco";"Indicador";"Valor";"Participante";"Presenças"$/);
  assert.match(linhas[1], /"Resumo geral";"Presenças";"2";"";""$/);
  assert.match(linhas[2], /"Por participante";"";"";/);
  assert.ok(linhas.slice(1).every((linha) => linha.includes("Curso: Office | Turma: Manhã") && linha.includes("23:15:09")));
});

test("CSV exporta somente os blocos selecionados", () => {
  const csv = gerarCSVRelatorio({ ...relatorio, tabelas: [relatorio.tabelas[1]] });
  assert.ok(!csv.includes("Resumo geral"));
  assert.ok(!csv.includes("Indicador"));
});

test("conteúdo textual com fórmula é neutralizado no CSV", () => {
  const csv = gerarCSVRelatorio({ ...relatorio, tabelas: [{ titulo: "Dados", colunas: ["Nome"], linhas: [["=HYPERLINK(1)"], ["  @SUM(1)"], ["Nome comum"]] }] });
  assert.ok(csv.includes('"\'=HYPERLINK(1)"'));
  assert.ok(csv.includes('"\'  @SUM(1)"'));
  assert.ok(csv.includes('"Nome comum"'));
});
