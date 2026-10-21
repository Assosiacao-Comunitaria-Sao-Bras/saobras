import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularSituacaoAluno, indexarFrequencias, normalizarBusca } from "../src/lib/alunos-situacao.ts";

const matricula = { id: "m1", curso_id: "c1", turma_id: "t1", data_matricula: "2026-10-01T12:00:00Z" };
const agora = Date.parse("2026-10-21T15:00:00Z");
const registro = (dia, status, extras = {}) => ({
  id: `p${dia}`, aluno_id: "a1", curso_id: "c1", turma_id: "t1",
  data_hora: `2026-10-${String(dia).padStart(2, "0")}T12:00:00Z`, status, ...extras,
});
const chamadas = (presentes, total) => Array.from({ length: total }, (_, i) => registro(i + 1, i < presentes ? "presente" : "falta"));
const calcular = (matriculas, registros = [], limite = 30) => calcularSituacaoAluno(matriculas, registros, limite, agora);

test("cadastro sem matrícula é inativo, mesmo com presença histórica", () => {
  assert.equal(calcular([], [registro(5, "presente")]).status, "inativo");
});

test("matrícula sem chamadas ou abaixo de 30% permanece matriculada", () => {
  assert.equal(calcular([matricula]).status, "matriculado");
  assert.equal(calcular([matricula]).percentual, null);
  assert.equal(calcular([matricula], chamadas(2, 10)).status, "matriculado");
});

test("30% exatos são suficientes; o limite pode ser alterado para 40%", () => {
  assert.equal(calcular([matricula], chamadas(3, 10)).status, "frequente");
  assert.equal(calcular([matricula], chamadas(3, 10), 40).status, "matriculado");
  assert.equal(calcular([matricula], chamadas(4, 10), 40).status, "frequente");
});

test("a classificação usa o percentual sem arredondamento", () => {
  const registros = Array.from({ length: 1000 }, (_, i) => ({
    ...registro(1, i < 299 ? "presente" : "falta"), id: `p${i}`, turma_id: `t${i}`,
  }));
  const matriculas = registros.map((r) => ({ ...matricula, id: `m${r.id}`, turma_id: r.turma_id }));
  const situacao = calcular(matriculas, registros);
  assert.equal(situacao.percentual, 29.9);
  assert.equal(situacao.status, "matriculado");
});

test("somente desistência explícita muda o aluno para desistente", () => {
  assert.equal(calcular([matricula], chamadas(0, 10)).status, "matriculado");
  const situacao = calcular([{ ...matricula, desistiu_em: "2026-10-20T12:00:00Z" }], chamadas(10, 10));
  assert.equal(situacao.status, "desistente");
  assert.equal(situacao.desistencias, 1);
  assert.equal(situacao.total, 0);
});

test("matrícula em outro curso continua ativa e mantém o alerta de desistência", () => {
  const desistente = { ...matricula, id: "m2", curso_id: "c2", turma_id: "t2", desistiu_em: "2026-10-20T12:00:00Z" };
  const situacao = calcular([matricula, desistente], [registro(5, "presente"), registro(6, "falta", { turma_id: "t2", curso_id: "c2" })]);
  assert.equal(situacao.status, "frequente");
  assert.equal(situacao.percentual, 100);
  assert.equal(situacao.desistencias, 1);
  assert.equal(calcular([desistente]).status, "desistente");
});

test("a mesma chamada conta uma vez e prevalece a correção mais recente", () => {
  const situacao = calcular([matricula], [registro(5, "falta"), registro(5, "presente", { id: "correcao", data_hora: "2026-10-05T14:00:00Z" })]);
  assert.equal(situacao.total, 1);
  assert.equal(situacao.presentes, 1);
});

test("ignora outra turma, datas futuras, datas inválidas e chamadas anteriores à matrícula", () => {
  const situacao = calcular([{ ...matricula, data_matricula: "2026-10-05T18:00:00Z" }], [
    registro(1, "presente"), registro(6, "presente", { turma_id: "outra" }),
    registro(22, "presente"), registro(5, "presente", { data_hora: "inválida" }), registro(5, "falta"),
  ]);
  assert.equal(situacao.total, 1);
  assert.equal(situacao.percentual, 0);
});

test("matrícula legada sem turma usa o curso e status nulo mantém a presença legada", () => {
  const situacao = calcular([{ ...matricula, turma_id: null }], [registro(5, null)]);
  assert.equal(situacao.percentual, 100);
  assert.equal(calcular([matricula], [registro(5, "desconhecido")]).total, 0);
});

test("matrículas duplicadas não duplicam chamadas, e cursos diferentes não se misturam", () => {
  const situacao = calcular([matricula, { ...matricula, id: "m2" }], [registro(5, "presente"), registro(6, "falta", { turma_id: "t2", curso_id: "c2" })]);
  assert.equal(situacao.total, 1);
});

test("índice mantém os dados por aluno e busca ignora acentos", () => {
  const indice = indexarFrequencias([registro(5, "presente"), registro(6, "falta", { aluno_id: "a2" })]);
  assert.equal(indice.get("a1").length, 1);
  assert.equal(indice.get("a2").length, 1);
  assert.equal(normalizarBusca("  JOÃO Conceição "), "joao conceicao");
});
