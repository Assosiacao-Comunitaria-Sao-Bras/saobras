import type { jsPDF } from "jspdf";

/*
 * ============================================================
 * FICHA DE INSCRIÇÃO - FUNDAÇÃO SÃO BRAZ
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

/** Aluno com 18 anos ou mais (idade não informada conta como menor). */
export function alunoMaiorDeIdade(dados: DadosFichaInscricao) {
  const idade = dados.aluno.idade;
  return typeof idade === "number" && idade >= 18;
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
  return `ficha-inscricao-${nome || "aluno"}.pdf`;
}

/* ---------- desenho ---------- */

// Subconjunto da API do jsPDF usado aqui (facilita testar sem o navegador).
type Doc = Pick<
  jsPDF,
  | "setFont" | "setFontSize" | "setTextColor" | "setDrawColor" | "setFillColor"
  | "setLineWidth"
  | "text" | "line" | "rect" | "addImage" | "getTextWidth" | "splitTextToSize"
>;

type Cor = readonly [number, number, number];

const MARGEM_ESQ = 14;
const MARGEM_DIR = 196; // 210 - 14
const LARGURA = MARGEM_DIR - MARGEM_ESQ; // 182
const MEIO = 105;

const AZUL: Cor = [23, 52, 94];
const CINZA_TEXTO: Cor = [95, 95, 95];
const CINZA_LINHA: Cor = [150, 150, 150];
const CINZA_FUNDO: Cor = [230, 235, 242];
const PRETO: Cor = [0, 0, 0];

export function desenharFicha(doc: Doc, dados: DadosFichaInscricao, logos: LogosFicha = {}) {
  const aluno = dados.aluno;
  const maior = alunoMaiorDeIdade(dados);

  const fonte = (estilo: "normal" | "bold", tamanho: number, cor: Cor = PRETO) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(cor[0], cor[1], cor[2]);
  };

  const linha = (x1: number, y: number, x2: number, espessura = 0.25, cor: Cor = PRETO) => {
    doc.setDrawColor(cor[0], cor[1], cor[2]);
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

  // Faixa de título de seção (fundo cinza-azulado e texto azul-escuro).
  const secao = (titulo: string, y: number) => {
    doc.setFillColor(CINZA_FUNDO[0], CINZA_FUNDO[1], CINZA_FUNDO[2]);
    doc.rect(MARGEM_ESQ, y, LARGURA, 5.4, "F");
    doc.setFillColor(AZUL[0], AZUL[1], AZUL[2]);
    doc.rect(MARGEM_ESQ, y, 1.2, 5.4, "F");
    fonte("bold", 8.5, AZUL);
    doc.text(titulo, MARGEM_ESQ + 3.5, y + 3.8);
  };

  // Campo: rótulo pequeno em cinza, valor em negrito e linha fina embaixo.
  const celula = (rotulo: string, valor: string, x: number, y: number, largura: number) => {
    fonte("normal", 6.6, CINZA_TEXTO);
    doc.text(rotulo.toUpperCase(), x, y);
    linha(x, y + 5.9, x + largura, 0.15, CINZA_LINHA);
    if (valor) {
      const texto = ajustar(valor, largura - 1, "bold", 9);
      doc.text(texto, x + 0.5, y + 4.7);
    }
  };

  // Distribui células lado a lado com espaçamento de 4 mm. `peso` define a largura relativa.
  const GAP = 4;
  const linhaDeCelulas = (
    y: number,
    itens: { rotulo: string; valor: string; peso: number }[],
  ) => {
    const total = itens.reduce((soma, i) => soma + i.peso, 0);
    const util = LARGURA - GAP * (itens.length - 1);
    let x = MARGEM_ESQ;
    for (const item of itens) {
      const largura = (util * item.peso) / total;
      celula(item.rotulo, item.valor, x, y, largura);
      x += largura + GAP;
    }
  };

  const PASSO = 10; // distância vertical entre linhas de campos

  /* ---------- Cabeçalho ---------- */
  if (logos.prefeitura) doc.addImage(logos.prefeitura, "PNG", MARGEM_ESQ, 6, 40, 16.6, undefined, "FAST");
  if (logos.fundacao) doc.addImage(logos.fundacao, "PNG", MARGEM_DIR - 42, 6, 42, 17.4, undefined, "FAST");
  fonte("bold", 11);
  doc.text("PREFEITURA MUNICIPAL DE FEIRA DE SANTANA", MEIO, 28, { align: "center" });
  fonte("normal", 9, CINZA_TEXTO);
  doc.text("POLO DE CIÊNCIA E TECNOLOGIA SÃO BRAZ", MEIO, 33.2, { align: "center" });
  fonte("normal", 7.5, CINZA_TEXTO);
  doc.text(
    `${POLO_ENDERECO}  |  Tel.: ${formatarTelefone(POLO_TELEFONE)}`,
    MEIO,
    37.8,
    { align: "center" },
  );
  linha(MARGEM_ESQ, 41, MARGEM_DIR, 0.7, AZUL);

  fonte("bold", 13, AZUL);
  doc.text("FICHA DE INSCRIÇÃO", MEIO, 48.5, { align: "center" });

  /* ---------- Dados do aluno ---------- */
  let y = 52.5;
  secao("DADOS DO ALUNO", y);
  y += 9;
  linhaDeCelulas(y, [
    { rotulo: "Nome completo", valor: aluno.nome_completo, peso: 4.2 },
    { rotulo: "Idade", valor: aluno.idade ? `${aluno.idade} anos` : "", peso: 1 },
  ]);
  y += PASSO;
  linhaDeCelulas(y, [
    { rotulo: "CPF", valor: formatarCPF(aluno.cpf), peso: 1.4 },
    { rotulo: "Telefone", valor: formatarTelefone(aluno.telefone), peso: 1.4 },
    { rotulo: "E-mail", valor: aluno.email ?? "", peso: 2.6 },
  ]);
  y += PASSO;
  linhaDeCelulas(y, [
    { rotulo: "Bairro", valor: aluno.bairro ?? "", peso: 1 },
    { rotulo: "Professor(a)", valor: "", peso: 1 },
  ]);

  /* ---------- Curso e turma ---------- */
  y += 9;
  secao("CURSO E TURMA", y);
  y += 9;
  linhaDeCelulas(y, [{ rotulo: "Curso", valor: dados.curso, peso: 1 }]);
  y += PASSO;
  linhaDeCelulas(y, [{ rotulo: "Turma / horário", valor: descricaoTurma(dados), peso: 1 }]);

  /* ---------- Responsável (somente menores de 18 anos) ---------- */
  if (!maior) {
    y += 9;
    secao("DADOS DO RESPONSÁVEL", y);
    y += 9;
    linhaDeCelulas(y, [
      { rotulo: "Nome do responsável", valor: aluno.nome_responsavel ?? "", peso: 3.2 },
      { rotulo: "CPF", valor: formatarCPF(aluno.cpf_responsavel), peso: 1.4 },
    ]);
    y += PASSO;
    linhaDeCelulas(y, [
      { rotulo: "Telefone", valor: formatarTelefone(aluno.telefone_secundario), peso: 1 },
      { rotulo: "E-mail", valor: "", peso: 1.4 },
    ]);
  }

  /* ---------- Região inferior (posições fixas) ---------- */
  const COMPROVANTE_TOPO = 262;
  const COMPROVANTE_BASE = 288;
  const ASSINATURA_Y = 252;
  const DECLARACAO_Y = 237;
  const LIMITE_CONDICOES = DECLARACAO_Y - 5;

  /* ---------- Condições ---------- */
  y += 9;
  secao("CONDIÇÕES PARA FREQUENTAR O POLO DE CIÊNCIA E TECNOLOGIA SÃO BRAZ", y);
  const inicioCondicoes = y + 9.2;

  // Escolhe o maior tamanho de letra (até 8) em que todas as condições cabem.
  const medirCondicoes = (tamanho: number) => {
    fonte("normal", tamanho);
    const espacoLinha = tamanho * 0.42;
    const entreItens = 0.9;
    const itens = CONDICOES.map((c) => doc.splitTextToSize(c, LARGURA) as string[]);
    const altura = itens.reduce((soma, ls) => soma + ls.length * espacoLinha + entreItens, 0);
    return { itens, espacoLinha, entreItens, altura };
  };

  let tamanho = 8;
  let medidas = medirCondicoes(tamanho);
  while (inicioCondicoes + medidas.altura > LIMITE_CONDICOES && tamanho > 6) {
    tamanho -= 0.2;
    medidas = medirCondicoes(tamanho);
  }

  fonte("normal", tamanho);
  let yc = inicioCondicoes;
  for (const ls of medidas.itens) {
    for (const l of ls) {
      doc.text(l, MARGEM_ESQ, yc);
      yc += medidas.espacoLinha;
    }
    yc += medidas.entreItens;
  }

  /* ---------- Declaração, data e assinatura ---------- */
  fonte("normal", 8.5);
  let yd = DECLARACAO_Y;
  for (const l of doc.splitTextToSize(DECLARACAO, LARGURA) as string[]) {
    doc.text(l, MARGEM_ESQ, yd);
    yd += 4;
  }

  const { dia, mes, ano } = partesDataBahia(dados.dataMatricula);
  fonte("normal", 9);
  doc.text(`Feira de Santana, ${dia} de ${MESES[mes - 1]} de ${ano}`, MARGEM_ESQ, ASSINATURA_Y);
  linha(104, ASSINATURA_Y, MARGEM_DIR, 0.3);
  fonte("normal", 8, CINZA_TEXTO);
  doc.text(
    maior ? "Assinatura do(a) aluno(a)" : "Assinatura do responsável",
    (104 + MARGEM_DIR) / 2,
    ASSINATURA_Y + 4,
    { align: "center" },
  );

  /* ---------- Comprovante ---------- */
  const topo = COMPROVANTE_TOPO;
  const base = COMPROVANTE_BASE;

  doc.setFillColor(CINZA_FUNDO[0], CINZA_FUNDO[1], CINZA_FUNDO[2]);
  doc.rect(MARGEM_ESQ, topo, LARGURA, 8, "F");
  doc.setDrawColor(AZUL[0], AZUL[1], AZUL[2]);
  doc.setLineWidth(0.4);
  doc.rect(MARGEM_ESQ, topo, LARGURA, base - topo);
  fonte("bold", 9, AZUL);
  doc.text(`COMPROVANTE DE INSCRIÇÃO - FUNDAÇÃO SÃO BRAZ`, MEIO, topo + 5.4, { align: "center" });
  linha(MARGEM_ESQ, topo + 8, MARGEM_DIR, 0.3, AZUL);

  const oficina = [dados.curso, dados.turma?.nome].filter(Boolean).join(" - ");
  const { dia: d, mes: m, ano: a } = partesDataBahia(dados.dataMatricula);
  const dataCurta = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;

  const rotuloValor = (rotulo: string, valor: string, x: number, yy: number, largura: number) => {
    fonte("bold", 8.5);
    doc.text(rotulo, x, yy);
    const inicio = x + doc.getTextWidth(rotulo) + 1.5;
    if (valor) doc.text(ajustar(valor, largura - (inicio - x), "normal", 8.5), inicio, yy);
  };
  rotuloValor("NOME:", aluno.nome_completo, MARGEM_ESQ + 2, topo + 14.5, 92);
  rotuloValor("OFICINA:", oficina, 110, topo + 14.5, 58);
  rotuloValor("FUNCIONÁRIO:", dados.operador ?? "", MARGEM_ESQ + 2, topo + 20.5, 92);
  rotuloValor("DATA:", dataCurta, 110, topo + 20.5, 58);
  if (logos.fundacao) doc.addImage(logos.fundacao, "PNG", MARGEM_DIR - 27, topo + 10.5, 25, 10.4, undefined, "FAST");

  linha(MARGEM_ESQ, base - 4.6, MARGEM_DIR, 0.2, CINZA_LINHA);
  fonte("normal", 6.8, CINZA_TEXTO);
  doc.text(
    "(É PROIBIDA A PERMANÊNCIA DE ALUNOS MENORES DE 10 ANOS SEM A PRESENÇA DOS PAIS OU RESPONSÁVEIS)",
    MEIO,
    base - 1.7,
    { align: "center" },
  );

  /* ---------- Rodapé ---------- */
  fonte("normal", 7.5, CINZA_TEXTO);
  doc.text("Sistema: Matrícula", MARGEM_ESQ, 293);
  doc.text(`Usuário: ${dados.operador ?? "________________________"}`, MARGEM_DIR, 293, { align: "right" });
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
