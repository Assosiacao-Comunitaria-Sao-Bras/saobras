import { test } from "node:test";
import assert from "node:assert/strict";
import { limitarEntradaCPF, cpfTemOnzeDigitos } from "../src/lib/validacao.ts";

test("digitação e colagem de CPF aceitam apenas 11 dígitos, preservando zero inicial", () => {
  assert.equal(limitarEntradaCPF("012.345.678-90"), "01234567890");
  assert.equal(limitarEntradaCPF("abc01 !234\n567890xyz"), "01234567890");
  assert.equal(limitarEntradaCPF("01234567890123"), "01234567890");
  assert.equal(limitarEntradaCPF("á!１２٣"), "");
});

test("salvamento exige exatamente 11 dígitos ASCII", () => {
  assert.equal(cpfTemOnzeDigitos("01234567890"), true);
  for (const valor of [undefined, null, "", "1234567890", "123456789012", "0123456789a", "0123456789!", "0123456789 ", "01234567890\n", "012.345.678-90", "１２３４５６７８９０１"]) {
    assert.equal(cpfTemOnzeDigitos(valor), false, `Rejeitar ${JSON.stringify(valor)}`);
  }
});

test("letras e símbolos não completam um CPF incompleto", () => {
  const entrada = limitarEntradaCPF("123456789ab!");
  assert.equal(entrada, "123456789");
  assert.equal(cpfTemOnzeDigitos(entrada), false);
});
