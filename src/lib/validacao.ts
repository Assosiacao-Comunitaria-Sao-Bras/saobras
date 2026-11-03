/**
 * Padronizações usadas nos cadastros.
 */

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "du", "del", "della"]);

/** Entrada de CPF: apenas dígitos ASCII, inclusive ao colar texto. */
export function limitarEntradaCPF(valor: string): string {
  return valor.replace(/[^0-9]/g, "").slice(0, 11);
}

/** Valida o formato completo antes de gravar, sem truncar dados inválidos. */
export function cpfTemOnzeDigitos(valor: string | null | undefined): boolean {
  return typeof valor === "string" && valor.length === 11 && /^[0-9]{11}$/.test(valor);
}

function capitalizar(parte: string): string {
  return parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1).toLocaleLowerCase("pt-BR");
}

/**
 * Padroniza nomes próprios: primeira letra de cada palavra maiúscula e o resto minúsculo,
 * mantendo "de", "da", "do", "das", "dos", "e" em minúsculas (exceto como primeira palavra).
 * Com `preservarEspacos = true` não remove espaços (usado enquanto a pessoa digita).
 */
export function formatarNome(valor: string, preservarEspacos = false): string {
  const base = preservarEspacos ? valor.replace(/ {2,}/g, " ").replace(/^ /, "") : valor.trim().replace(/\s+/g, " ");
  return base
    .split(" ")
    .map((palavra, i) => {
      if (palavra === "") return palavra;
      const minuscula = palavra.toLocaleLowerCase("pt-BR");
      if (i > 0 && PARTICULAS.has(minuscula)) return minuscula;
      // Trata hífen e apóstrofo: "Ana-Maria", "D'Ávila"
      return palavra
        .split(/([-'’])/)
        .map((p) => (/^[-'’]$/.test(p) ? p : capitalizar(p)))
        .join("");
    })
    .join(" ");
}
