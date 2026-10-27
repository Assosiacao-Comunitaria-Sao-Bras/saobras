import type { jsPDF } from "jspdf";

/*
 * ============================================================
 * FICHA DE INSCRIÇÃO - FUNDAÇÃO SÃO BRAZ
 *
 * Reproduz o modelo "GetReport.docx" em PDF (A4, uma página),
 * preenchido com os dados do aluno/matrícula para imprimir e
 * o responsável assinar.
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
  } | null;
  dataMatricula: string | Date;
  operador?: string | null;
};

export type LogosFicha = {
  prefeitura?: string | null; // data URL PNG
  fundacao?: string | null; // data URL PNG
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CONDICOES = [
  "1º - Danos ou prejuízos causados pelos alunos ou acompanhantes ao Polo de ciência e tecnologia São Braz, são de responsabilidade dos responsáveis;",
  "2º - Os responsáveis serão convidados a participarem das reuniões para decidir sobre assuntos de interesse do aluno(a). Caso não compareçam, deverão acatar as decisões tomadas pelos presentes;",
  "3º - Os(as) alunos(as) com até 10 anos deverão vir acompanhados(as) dos responsáveis, que se responsabilizarão pelos seus comportamentos e eventuais danos, acidentes ou mau uso das instalações;",
  "4º - Todos deverão usar trajes apropriados ao ambiente segundo orientações dos professores e comportarem-se de forma apropriada ao ambiente onde frequentam pessoas de todas as idades e credos;",
  "5º - Não é permitido fumar ou utilizar qualquer tipo de substâncias ilícitas dentro do Polo de ciência e tecnologia São Braz;",
  "6º - Recomendamos aos frequentadores que não tragam pertences ou valores para o Polo de ciência e tecnologia São Braz. Em nenhuma hipótese a direção do Polo de ciência e tecnologia São Braz se responsabiliza por eventuais perdas ou desaparecimentos dos mesmos;",
  "7º - Não é permitida a comercialização de qualquer produto nas instalações do Polo de ciência e tecnologia São Braz. Eventuais exceções só com o conhecimento e expressa autorização da direção;",
  "8º - A imagem dos(as) alunos(as) ou responsáveis poderão aparecer em material de divulgação do Polo de ciência e tecnologia São Braz como fotos, imprensa, facebook, etc. Se os responsáveis não estiverem de acordo, devem comunicar expressamente neste ato de inscrição;",
  "9º - Os avisos serão afixados no Foyer do Polo de ciência e tecnologia São Braz. Eventualmente poderão ser fornecidos via WhatsApp;",
  "10º - A turma só será mantida caso haja no número mínimo de cinco alunos(as) frequentando;",
  "11º - O Polo de ciência e tecnologia São Braz fornecerão água potável aos frequentadores, que deverão trazer seu próprio copo;",
  "12º - Após três faltas não justificadas o aluno perderá a vaga e ficará impossibilitado de se inscrever no semestre seguinte.",
];

const DECLARACAO =
  "Declaro serem verdadeiras as informações fornecidas sobre a saúde e que o aluno(a) acima identificado(a) encontra-se em perfeitas condições para frequentar as atividades do Polo de ciência e tecnologia São Braz.";

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
  }).formatToParts(base);
  const pega = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { dia: pega("day"), mes: pega("month"), ano: pega("year") };
}

/** Semestre letivo: janeiro a junho = ".1", julho a dezembro = ".2". */
export function semestreLetivo(valor: string | Date) {
  const { mes, ano } = partesDataBahia(valor);
  return `${ano}.${mes <= 6 ? 1 : 2}`;
}

function listarDias(dias?: string[] | null) {
  const lista = (dias ?? []).map((d) => d.trim().toUpperCase()).filter(Boolean);
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

export function descricaoTurma(dados: DadosFichaInscricao) {
  const t = dados.turma;
  if (!t) return "";
  const dias = listarDias(t.dias_semana);
  const turno = (t.turno ?? "").trim().toUpperCase();
  const horario = (t.horario ?? "").trim();
  const cabecalho = ["TURMA", (t.nome ?? "").trim(), dados.curso.trim()].filter(Boolean).join(" ");
  const complemento = [turno, [dias, horario].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" / ");
  return complemento ? `${cabecalho}  - ${complemento}` : cabecalho;
}

export function nomeArquivoFicha(dados: DadosFichaInscricao) {
  const nome = dados.aluno.nome_completo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `ficha-inscricao-${nome || "aluno"}-${semestreLetivo(dados.dataMatricula)}.pdf`;
}

/* ---------- desenho ---------- */

// Subconjunto da API do jsPDF usado aqui (facilita testar sem o navegador).
type Doc = Pick<
  jsPDF,
  | "setFont" | "setFontSize" | "setTextColor" | "setDrawColor" | "setLineWidth"
  | "text" | "line" | "rect" | "addImage" | "getTextWidth" | "splitTextToSize"
>;

const MARGEM_ESQ = 12;
const MARGEM_DIR = 198; // 210 - 12

export function desenharFicha(doc: Doc, dados: DadosFichaInscricao, logos: LogosFicha = {}) {
  const semestre = semestreLetivo(dados.dataMatricula);
  const aluno = dados.aluno;
  const meio = 105;

  const fonte = (estilo: "normal" | "bold", tamanho: number) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(0, 0, 0);
  };

  const linha = (x1: number, y: number, x2: number, espessura = 0.25) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(espessura);
    doc.line(x1, y, x2, y);
  };

  // Encolhe a fonte (até 6,5) e, se ainda não couber, corta com reticências.
  const ajustar = (texto: string, largura: number, estilo: "normal" | "bold", tamanho: number) => {
    let t = tamanho;
    fonte(estilo, t);
    while (doc.getTextWidth(texto) > largura && t > 6.5) {
      t -= 0.5;
      fonte(estilo, t);
    }
    let saida = texto;
    while (saida.length > 1 && doc.getTextWidth(saida) > largura) {
      saida = saida.slice(0, -1);
    }
    return saida === texto ? saida : `${saida.trimEnd()}…`;
  };

  // "Rótulo: valor ______" com sublinhado até x + largura.
  const campo = (rotulo: string, valor: string, x: number, y: number, largura: number) => {
    fonte("normal", 8.5);
    doc.text(rotulo, x, y);
    const inicio = x + doc.getTextWidth(rotulo) + 1.5;
    linha(inicio, y + 0.9, x + largura, 0.2);
    if (valor) {
      const texto = ajustar(valor, x + largura - inicio - 1, "bold", 8.5);
      doc.text(texto, inicio + 0.8, y);
    }
  };

  /* Cabeçalho */
  if (logos.prefeitura) doc.addImage(logos.prefeitura, "PNG", MARGEM_ESQ, 6, 40, 16.6, undefined, "FAST");
  if (logos.fundacao) doc.addImage(logos.fundacao, "PNG", MARGEM_DIR - 42, 6, 42, 17.4, undefined, "FAST");
  fonte("bold", 11);
  doc.text("PREFEITURA MUNICIPAL DE FEIRA DE SANTANA", meio, 28, { align: "center" });
  fonte("normal", 10);
  doc.text("FUNDAÇÃO MUNICIPAL EGBERTO COSTA", meio, 33.5, { align: "center" });
  fonte("normal", 9);
  doc.text("SÃO BRAZ", meio, 38.5, { align: "center" });
  linha(MARGEM_ESQ, 42, MARGEM_DIR, 0.4);

  fonte("bold", 10.5);
  doc.text(`FUNDAÇÃO SÃO BRAZ, FICHA DE INSCRIÇÃO 1 ${semestre}`, meio, 49, { align: "center" });
  linha(MARGEM_ESQ, 52, MARGEM_DIR, 0.4);

  /* Aluno */
  fonte("bold", 11);
  doc.text("Aluno:", MARGEM_ESQ, 59);
  campo("Nome:", aluno.nome_completo, MARGEM_ESQ, 65.5, 114);
  campo("CPF:", formatarCPF(aluno.cpf), 128, 65.5, 44);
  campo("Idade:", aluno.idade ? `${aluno.idade} anos` : "", 174, 65.5, 24);
  campo("Telefone:", formatarTelefone(aluno.telefone), MARGEM_ESQ, 72, 88);
  campo("Email:", aluno.email ?? "", 104, 72, 94);
  campo("Unidade Educacional:", "", MARGEM_ESQ, 78.5, 186);
  campo("Professor:", "", MARGEM_ESQ, 85, 186);
  campo("Turma/Horário:", descricaoTurma(dados), MARGEM_ESQ, 91.5, 186);

  /* Responsável */
  fonte("bold", 11);
  doc.text("Responsável:", MARGEM_ESQ, 100);
  campo("Nome:", aluno.nome_responsavel ?? "", MARGEM_ESQ, 106.5, 124);
  campo("CPF:", formatarCPF(aluno.cpf_responsavel), 138, 106.5, 60);
  campo("Telefone:", formatarTelefone(aluno.telefone_secundario), MARGEM_ESQ, 113, 88);
  campo("Email:", "", 104, 113, 94);
  campo("Local de Trabalho:", "", MARGEM_ESQ, 119.5, 186);
  campo("Bairro:", aluno.bairro ?? "", MARGEM_ESQ, 126, 100);
  campo("Curso:", dados.curso, MARGEM_ESQ, 134, 186);

  /* Condições */
  let y = 144;
  fonte("bold", 9);
  doc.text("Condições a serem observadas para frequentar o Polo de ciência e tecnologia São Braz:", meio, y, { align: "center" });
  y += 5;
  fonte("normal", 7.4);
  for (const item of CONDICOES) {
    const linhas = doc.splitTextToSize(item, MARGEM_DIR - MARGEM_ESQ) as string[];
    for (const l of linhas) {
      doc.text(l, MARGEM_ESQ, y);
      y += 3.3;
    }
  }

  /* Declaração, data e assinatura */
  y += 3;
  fonte("normal", 8.5);
  for (const l of doc.splitTextToSize(DECLARACAO, MARGEM_DIR - MARGEM_ESQ) as string[]) {
    doc.text(l, MARGEM_ESQ, y);
    y += 4;
  }
  const { dia, mes, ano } = partesDataBahia(dados.dataMatricula);
  y += 4;
  fonte("normal", 9);
  doc.text(`Feira de Santana, ${dia} de ${MESES[mes - 1]} de ${ano}`, meio, y, { align: "center" });
  y += 13;
  linha(60, y, 150, 0.3);
  y += 4;
  fonte("normal", 9);
  doc.text("Responsável", meio, y, { align: "center" });

  /* Comprovante */
  const topo = 259;
  const base = 285;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(MARGEM_ESQ, topo, MARGEM_DIR - MARGEM_ESQ, base - topo);
  fonte("bold", 9);
  doc.text(`COMPROVANTE DE INSCRIÇÃO FUNDAÇÃO SÃO BRAZ:  ${semestre}`, meio, topo + 5.5, { align: "center" });
  linha(MARGEM_ESQ, topo + 8, MARGEM_DIR, 0.3);

  const oficina = [dados.curso, dados.turma?.nome].filter(Boolean).join(" - ");
  const { dia: d, mes: m, ano: a } = partesDataBahia(dados.dataMatricula);
  const dataCurta = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;

  const rotuloValor = (rotulo: string, valor: string, x: number, yy: number, largura: number) => {
    fonte("bold", 8.5);
    doc.text(rotulo, x, yy);
    const inicio = x + doc.getTextWidth(rotulo) + 1.5;
    if (valor) doc.text(ajustar(valor, largura - (inicio - x), "normal", 8.5), inicio, yy);
  };
  rotuloValor("NOME:", aluno.nome_completo, MARGEM_ESQ + 1.5, topo + 14, 90);
  rotuloValor("OFICINA:", oficina, 108, topo + 14, 62);
  rotuloValor("FUNCIONARIO:", dados.operador ?? "", MARGEM_ESQ + 1.5, topo + 20, 90);
  rotuloValor("DATA:", dataCurta, 108, topo + 20, 62);
  if (logos.fundacao) doc.addImage(logos.fundacao, "PNG", MARGEM_DIR - 27, topo + 10.5, 25, 10.4, undefined, "FAST");

  linha(MARGEM_ESQ, base - 4.5, MARGEM_DIR, 0.3);
  fonte("normal", 7);
  doc.text("(É PROIBIDO PERMANÊNCIA DE ALUNOS MENORES DE 10 ANOS SEM A PRESENÇA DOS PAIS OU RESPONSÁVEIS)", meio, base - 1.6, { align: "center" });

  /* Rodapé */
  fonte("normal", 8);
  doc.text("Sistema:Matrícula", MARGEM_ESQ, 290);
  doc.text(`Usuário: ${dados.operador ?? "________________________"}`, 108, 290);
}

/** Cria o PDF (carrega o jsPDF só quando necessário). */
export async function criarPDFFichaInscricao(dados: DadosFichaInscricao, logos: LogosFicha = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `Ficha de inscrição - ${dados.aluno.nome_completo}`,
    author: "Polo de Ciência e Tecnologia - São Braz",
    creator: "Sistema do Polo Digital",
    subject: "Ficha de inscrição",
  });
  desenharFicha(doc, dados, logos);
  return doc;
}
