/**
 * Listas usadas no cadastro de alunos (município e bairro).
 * Para incluir/remover itens, basta editar os arrays abaixo.
 * O campo sempre oferece a opção "Outro" para digitar um valor que não esteja na lista.
 */

export const MUNICIPIO_PADRAO = "Feira de Santana";

export const MUNICIPIOS: string[] = [
  "Feira de Santana",
  "Água Fria",
  "Alagoinhas",
  "Amélia Rodrigues",
  "Anguera",
  "Antônio Cardoso",
  "Camaçari",
  "Candeal",
  "Castro Alves",
  "Conceição da Feira",
  "Conceição do Jacuípe",
  "Coração de Maria",
  "Cruz das Almas",
  "Ipecaetá",
  "Ipirá",
  "Irará",
  "Lauro de Freitas",
  "Pedrão",
  "Rafael Jambeiro",
  "Riachão do Jacuípe",
  "Salvador",
  "Santa Bárbara",
  "Santanópolis",
  "Santo Estêvão",
  "São Gonçalo dos Campos",
  "Serra Preta",
  "Serrinha",
  "Tanquinho",
  "Teodoro Sampaio",
  "Terra Nova",
];

/** Bairros e distritos de Feira de Santana. */
export const BAIRROS_FEIRA_DE_SANTANA: string[] = [
  "Alto do Papagaio",
  "Aeroporto",
  "Aviário",
  "Baraúnas",
  "Brasília",
  "Calumbi",
  "Campo do Gado Novo",
  "Campo Limpo",
  "Capuchinhos",
  "Centro",
  "Chácara São Cosme",
  "Cidade Nova",
  "CIS (Centro Industrial do Subaé)",
  "Conceição",
  "Cruzeiro",
  "Eucalipto",
  "Feira VI",
  "Feira VII",
  "Feira IX",
  "Gabriela",
  "George Américo",
  "Jardim Acácia",
  "Jardim Cruzeiro",
  "Kalilândia",
  "Lagoa Salgada",
  "Limoeiro",
  "Mangabeira",
  "Mantiba",
  "Muchila",
  "Noide Cerqueira",
  "Novo Horizonte",
  "Olhos d'Água",
  "Pampalona",
  "Papagaio",
  "Parque Getúlio Vargas",
  "Parque Ipê",
  "Pedra do Descanso",
  "Ponto Central",
  "Queimadinha",
  "Rua Nova",
  "Santa Mônica",
  "Santa Quitéria",
  "Santo Antônio dos Prazeres",
  "Serraria Brasil",
  "SIM",
  "Sobradinho",
  "Subaé",
  "Tanque da Nação",
  "Tomba",
  "Vila Olímpica",
  // Distritos
  "Bonfim de Feira (distrito)",
  "Governador João Durval Carneiro (distrito)",
  "Humildes (distrito)",
  "Ipuaçu (distrito)",
  "Jaguara (distrito)",
  "Jaíba (distrito)",
  "Maria Quitéria (distrito)",
  "Matinha (distrito)",
  "Tiquaruçu (distrito)",
].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function ehFeiraDeSantana(municipio?: string | null): boolean {
  return (municipio ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() === "feira de santana";
}
