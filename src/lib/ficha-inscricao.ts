import { supabase } from "@/lib/supabase";
import {
  criarPDFFichaInscricao,
  nomeArquivoFicha,
  type DadosFichaInscricao,
  type LogosFicha,
} from "./ficha-inscricao-pdf";

/*
 * ============================================================
 * FICHA DE INSCRIÇÃO - busca os dados da matrícula e baixa o PDF
 *
 * Os dados são sempre lidos do banco (matrícula + aluno + curso
 * + turma), para a ficha refletir exatamente o que está salvo.
 * ============================================================
 */

const SELECT_BASE =
  "id, data_matricula, " +
  "alunos(nome_completo, cpf, idade, telefone, telefone_secundario, email, bairro, nome_responsavel, cpf_responsavel), " +
  "cursos(titulo), ";

const SELECT_MATRICULA = SELECT_BASE + "turmas(nome, turno, horario, dias_semana, professor)";

// Usado só se a coluna "professor" ainda não existir na tabela turmas.
const SELECT_MATRICULA_SEM_PROFESSOR = SELECT_BASE + "turmas(nome, turno, horario, dias_semana)";

// O Supabase pode devolver relacionamentos como objeto ou lista.
function um<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? valor[0] ?? null : valor ?? null;
}

let logosEmCache: LogosFicha | null = null;

async function carregarImagem(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise<string | null>((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => resolve(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function carregarLogos(): Promise<LogosFicha> {
  if (logosEmCache?.prefeitura && logosEmCache?.fundacao) return logosEmCache;
  const [prefeitura, fundacao] = await Promise.all([
    carregarImagem("/logos/ficha-prefeitura.png"),
    carregarImagem("/logos/ficha-fundacao.png"),
  ]);
  logosEmCache = { prefeitura, fundacao };
  return logosEmCache;
}

/** Nome do operador logado (aparece em "Funcionário" e "Usuário"). */
async function buscarNomeOperador(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    const { data } = await supabase
      .from("operadores")
      .select("nome")
      .eq("email", user.email)
      .maybeSingle();
    return data?.nome ?? null;
  } catch {
    return null;
  }
}

type LinhaMatricula = {
  id: string;
  data_matricula: string | null;
  alunos: DadosFichaInscricao["aluno"] | DadosFichaInscricao["aluno"][] | null;
  cursos: { titulo: string } | { titulo: string }[] | null;
  turmas: NonNullable<DadosFichaInscricao["turma"]> | NonNullable<DadosFichaInscricao["turma"]>[] | null;
};

async function gerarEBaixar(linha: LinhaMatricula) {
  const aluno = um(linha.alunos);
  if (!aluno) throw new Error("Não foi possível carregar os dados do aluno desta matrícula.");

  const dados: DadosFichaInscricao = {
    aluno,
    curso: um(linha.cursos)?.titulo ?? "",
    turma: um(linha.turmas),
    dataMatricula: linha.data_matricula ?? new Date().toISOString(),
    operador: await buscarNomeOperador(),
  };

  const doc = await criarPDFFichaInscricao(dados, await carregarLogos());
  doc.save(nomeArquivoFicha(dados));
}

/** Baixa a ficha de uma matrícula específica (botão no painel do aluno / lista de matrículas). */
export async function baixarFichaPorMatricula(matriculaId: string) {
  const buscar = (campos: string) =>
    supabase.from("matriculas").select(campos).eq("id", matriculaId).maybeSingle();

  let { data, error } = await buscar(SELECT_MATRICULA);
  if (error) ({ data, error } = await buscar(SELECT_MATRICULA_SEM_PROFESSOR));

  if (error) throw new Error("Não foi possível carregar a matrícula: " + error.message);
  if (!data) throw new Error("Matrícula não encontrada.");
  await gerarEBaixar(data as unknown as LinhaMatricula);
}

/**
 * Baixa a ficha da matrícula mais recente do aluno na turma.
 * Usada logo depois de criar a matrícula, quando ainda não temos o id dela.
 */
export async function baixarFichaPorAlunoTurma(alunoId: string, turmaId: string) {
  const buscar = (campos: string) =>
    supabase
      .from("matriculas")
      .select(campos)
      .eq("aluno_id", alunoId)
      .eq("turma_id", turmaId)
      .order("data_matricula", { ascending: false })
      .limit(1)
      .maybeSingle();

  let { data, error } = await buscar(SELECT_MATRICULA);
  if (error) ({ data, error } = await buscar(SELECT_MATRICULA_SEM_PROFESSOR));

  if (error) throw new Error("Não foi possível carregar a matrícula: " + error.message);
  if (!data) throw new Error("Matrícula não encontrada.");
  await gerarEBaixar(data as unknown as LinhaMatricula);
}

/**
 * Versão para uso logo após matricular: nunca lança erro (a matrícula já foi
 * salva e não deve parecer que falhou). Devolve a mensagem de erro, ou null.
 */
export async function baixarFichaAposMatricula(alunoId: string, turmaId: string): Promise<string | null> {
  try {
    await baixarFichaPorAlunoTurma(alunoId, turmaId);
    return null;
  } catch (erro) {
    console.error("Erro ao gerar a ficha de inscrição:", erro);
    return erro instanceof Error ? erro.message : "Erro desconhecido ao gerar a ficha.";
  }
}
