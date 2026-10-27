import type { jsPDF } from "jspdf";

/*
 * ============================================================
 * FICHA DE INSCRIÇÃO - FUNDAÇÃO SÃO BRÁS
 *
 * PDF A4 (uma página), preenchido com os dados do aluno/matrícula
 * para imprimir e assinar.
 *
 * - Aluno com 18 anos ou mais: a seção "Dados do responsável" não
 *   aparece (Bairro e Curso continuam na ficha) e a assinatura é
 *   do próprio aluno.
 * - Aluno menor de 18 anos (ou idade não informada): a seção do
 *   responsável aparece normalmente.
 * ============================================================
 */

export type DadosFichaInscricao = {
  aluno: {
    nome_completo: string;
    cpf?: string | null;
    idade?: number | null;
    telefone?: string | null;
    telefone_secundario?: string | null;
    email?: string | null;
    bairro?: string | null;
    nome_responsavel?: string | null;
    cpf_responsavel?: string | null;
  };
  curso: string;
  turma?: {
    nome?: string | null;
    turno?: string | null;
    horario?: string | null;
    dias_semana?: string[] | null;
    professor?: string | null;
  } | null;
  dataMatricula: string | Date;
  operador?: string | null;
};

export type LogosFicha = {
  prefeitura?: string | null; // data URL PNG
  fundacao?: string | null; // data URL PNG
};

const POLO_TELEFONE = "75983579622";
const POLO_ENDERECO = "Rua Campinorte, nº 70, Mangabeira – Feira de Santana/BA";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const CONDICOES = [
  "1º - Danos ou prejuízos causados pelos alunos ou acompanhantes ao Polo de ciência e tecnologia São Brás, são de responsabilidade dos responsáveis;",
  "2º - Os responsáveis serão convidados a participarem das reuniões para decidir sobre assuntos de interesse do aluno(a). Caso não compareçam, deverão acatar as decisões tomadas pelos presentes;",
  "3º - Os(as) alunos(as) com até 10 anos deverão vir acompanhados(as) dos responsáveis, que se responsabilizarão pelos seus comportamentos e eventuais danos, acidentes ou mau uso das instalações;",
  "4º - Todos deverão usar trajes apropriados ao ambiente segundo orientações dos professores e comportarem-se de forma apropriada ao ambiente onde frequentam pessoas de todas as idades e credos;",
  "5º - Não é permitido fumar ou utilizar qualquer tipo de substâncias ilícitas dentro do Polo de ciência e tecnologia São Brás;",
  "6º - Recomendamos aos frequentadores que não tragam pertences ou valores para o Polo de ciência e tecnologia São Brás. Em nenhuma hipótese a direção do Polo de ciência e tecnologia São Brás se responsabiliza por eventuais perdas ou desaparecimentos dos mesmos;",
  "7º - Não é permitida a comercialização de qualquer produto nas instalações do Polo de ciência e tecnologia São Brás. Eventuais exceções só com o conhecimento e expressa autorização da direção;",
  "8º - A imagem dos(as) alunos(as) ou responsáveis poderão aparecer em material de divulgação do Polo de ciência e tecnologia São Brás como fotos, imprensa, facebook, etc. Se os responsáveis não estiverem de acordo, devem comunicar expressamente neste ato de inscrição;",
  "9º - Os avisos serão afixados no Foyer do Polo de ciência e tecnologia São Brás. Eventualmente poderão ser fornecidos via WhatsApp;",
  "10º - A turma só será mantida caso haja no número mínimo de cinco alunos(as) frequentando;",
  "11º - O Polo de ciência e tecnologia São Brás fornecerão água potável aos frequentadores, que deverão trazer seu próprio copo;",
  "12º - Após três faltas não justificadas o aluno perderá a vaga e ficará impossibilitado de se inscrever no semestre seguinte.",
];

const DECLARACAO =
  "Declaro serem verdadeiras as informações fornecidas sobre a saúde e que o aluno(a) acima identificado(a) encontra-se em perfeitas condições para frequentar as atividades do Polo de ciência e tecnologia São Brás.";

/* ---------- utilitários ---------- */

export function formatarCPF(valor?: string | null) {
  const n = (valor ?? "").replace(/\D/g, "");
  if (n.length !== 11) return (valor ?? "").trim();
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

export function formatarTelefone(valor?: string | null) {
  const n = (valor ?? "").replace(/\D/g, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return (valor ?? "").trim();
}

/** Partes da data no fuso de Feira de Santana (America/Bahia). */
export function partesDataBahia(valor: string | Date) {
  const data = valor instanceof Date ? valor : new Date(valor);
  const base = Number.isNaN(data.getTime()) ? new Date() : data;
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
