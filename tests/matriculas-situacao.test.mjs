import { test } from "node:test";
import assert from "node:assert/strict";
import { matriculaEstaAtiva } from "../src/lib/matriculas-situacao.ts";

const atual = { alunos: { status_estudante: true }, turmas: { status: "ativa" } };

test("matrícula atual exige aluno e turma ativos", () => {
  assert.equal(matriculaEstaAtiva(atual), true);
  assert.equal(matriculaEstaAtiva({ ...atual, alunos: { status_estudante: false } }), false);
});

test("encerrar a turma retira a matrícula da relação atual sem encerrada_em", () => {
  const antiga = { ...atual, turmas: { status: "encerrada" }, encerrada_em: null };
  assert.equal(matriculaEstaAtiva(antiga), false);
  assert.equal(antiga.encerrada_em, null);
  assert.equal(matriculaEstaAtiva({ ...antiga, turmas: { status: "ativa" } }), true);
});

test("encerramento e desistência prevalecem sobre aluno e turma ativos", () => {
  for (const campo of ["encerrada_em", "desistiu_em"]) {
    assert.equal(matriculaEstaAtiva({ ...atual, [campo]: "2026-11-03T12:00:00Z" }), false);
  }
});

test("relações e status ausentes permanecem no histórico", () => {
  for (const relacao of ["alunos", "turmas"]) {
    for (const valor of [undefined, null, {}, { status: null, status_estudante: null }]) {
      assert.equal(matriculaEstaAtiva({ ...atual, [relacao]: valor }), false);
    }
  }
});

test("separação preserva todos os registros, inclusive matrículas antigas do mesmo aluno", () => {
  const registros = [
    { ...atual, id: "nova", aluno_id: "aluno-1" },
    { ...atual, id: "antiga", aluno_id: "aluno-1", turmas: { status: "encerrada" } },
    { ...atual, id: "encerrada", encerrada_em: "2026-11-01" },
  ];
  const antes = structuredClone(registros);
  const ativas = registros.filter(matriculaEstaAtiva);
  const historico = registros.filter((m) => !matriculaEstaAtiva(m));
  assert.deepEqual(ativas.map((m) => m.id), ["nova"]);
  assert.deepEqual(historico.map((m) => m.id), ["antiga", "encerrada"]);
  assert.equal(ativas.length + historico.length, registros.length);
  assert.deepEqual(registros, antes);
});
