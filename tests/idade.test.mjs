import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularIdade, hojeNaBahia, idadeDoAluno, nascimentoPermiteSalvar } from "../src/lib/idade.ts";

test("edição legada aceita nascimento pendente; cadastro novo continua exigindo", () => {
  for (const valor of [null, undefined, "", "--"]) {
    assert.equal(nascimentoPermiteSalvar(valor, false), true);
    assert.equal(nascimentoPermiteSalvar(valor, true), false);
  }
});

test("nascimento opcional não permite gravar data parcial, impossível ou futura", () => {
  for (const valor of ["2010--", "-02-01", "2010-02-30", "2027-01-01"]) {
    assert.equal(nascimentoPermiteSalvar(valor, false, "2026-11-05"), false);
  }
  assert.equal(nascimentoPermiteSalvar("2010-02-01", false, "2026-11-05"), true);
});

test("idade muda somente no aniversário, incluindo a maioridade", () => {
  assert.equal(calcularIdade("2008-11-05", "2026-11-04"), 17);
  assert.equal(calcularIdade("2008-11-05", "2026-11-05"), 18);
  assert.equal(calcularIdade("2008-11-05", "2026-11-06"), 18);
  assert.equal(calcularIdade("2026-11-05", "2026-11-05"), 0);
});

test("datas ausentes, impossíveis e futuras são rejeitadas", () => {
  for (const data of [null, undefined, "", "05/11/2008", "2008-02-30", "2009-02-29", "2026-11-06", "0000-01-01", "2008-13-01"]) {
    assert.equal(calcularIdade(data, "2026-11-05"), null, String(data));
  }
});

test("nascimento em ano bissexto completa anos em março nos anos sem 29/02", () => {
  assert.equal(calcularIdade("2008-02-29", "2026-02-28"), 17);
  assert.equal(calcularIdade("2008-02-29", "2026-03-01"), 18);
});

test("data corrente respeita Bahia perto da meia-noite UTC", () => {
  assert.equal(hojeNaBahia(new Date("2026-11-05T02:59:59Z")), "2026-11-04");
  assert.equal(hojeNaBahia(new Date("2026-11-05T03:00:00Z")), "2026-11-05");
});

test("data confirmada prevalece sobre idade legada sem alterar o cadastro", () => {
  const aluno = { idade: 16, data_nascimento: "2008-11-05" };
  assert.equal(idadeDoAluno(aluno, "2026-11-05"), 18);
  assert.equal(aluno.idade, 16);
  assert.equal(idadeDoAluno({ idade: 16 }, "2026-11-05"), 16);
  assert.equal(idadeDoAluno({ idade: null }, "2026-11-05"), null);
  assert.equal(idadeDoAluno({ idade: 16, data_nascimento: "inválida" }), null);
});
