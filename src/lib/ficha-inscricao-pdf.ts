      { rotulo: "Telefone", valor: formatarTelefone(aluno.telefone_secundario), peso: 1 },
      { rotulo: "E-mail", valor: "", peso: 1.4 },
    ]);
  }

  /* ---------- Região inferior (posições fixas) ---------- */
  const COMPROVANTE_TOPO = 259;
  const COMPROVANTE_BASE = 288;
  const ASSINATURA_Y = 252;
  const DECLARACAO_Y = 237;
  const LIMITE_CONDICOES = DECLARACAO_Y - 5;

  /* ---------- Condições ---------- */
  y += 9;
  secao("CONDIÇÕES PARA FREQUENTAR O POLO DE CIÊNCIA E TECNOLOGIA SÃO BRÁS", y);
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
  doc.text(`COMPROVANTE DE INSCRIÇÃO - FUNDAÇÃO SÃO BRÁS`, MEIO, topo + 5.4, { align: "center" });
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
  // Nome e oficina usam toda a largura até o logo, para não cortar nomes longos.
  rotuloValor("NOME:", aluno.nome_completo, MARGEM_ESQ + 2, topo + 13.5, 150);
  rotuloValor("OFICINA:", oficina, MARGEM_ESQ + 2, topo + 18.5, 150);
  rotuloValor("FUNCIONÁRIO:", dados.operador ?? "", MARGEM_ESQ + 2, topo + 23.5, 92);
  rotuloValor("DATA:", dataCurta, 110, topo + 23.5, 58);
  if (logos.fundacao) doc.addImage(logos.fundacao, "PNG", MARGEM_DIR - 27, topo + 10, 25, 10.4, undefined, "FAST");

  linha(MARGEM_ESQ, base - 3.9, MARGEM_DIR, 0.2, CINZA_LINHA);
  fonte("normal", 6.8, CINZA_TEXTO);
  doc.text(
    "(É PROIBIDA A PERMANÊNCIA DE ALUNOS MENORES DE 10 ANOS SEM A PRESENÇA DOS PAIS OU RESPONSÁVEIS)",
    MEIO,
    base - 1.4,
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
    author: "Polo de Ciência e Tecnologia - São Brás",
    creator: "Sistema do Polo Digital",
    subject: "Ficha de inscrição",
  });
  desenharFicha(doc, dados, logos);
  return doc;
}
