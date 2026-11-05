This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Gestão de alunos

A aba de alunos oferece cartões com nome e status e a opção de tabela completa.
Os filtros de busca, status, curso e turma podem ser combinados. O limite de
frequência da visualização começa em 30% e pode ser alterado para 40%.

A frequência considera presenças e faltas registradas nas matrículas sem
desistência, desde o dia da matrícula, no fuso America/Bahia. Chamadas duplicadas
por aluno, turma e dia usam o registro mais recente. Sem chamadas, ou abaixo do
limite, o aluno permanece matriculado. Sem matrícula, aparece como cadastro
inativo. Baixa frequência não implica desistência.

Para habilitar o registro e o cancelamento de desistência por matrícula, aplique
`supabase/migrations/202610210001_matriculas_desistencia.sql` no banco Supabase
antes da publicação. A migração adiciona a coluna opcional `desistiu_em`, preserva
os dados existentes e mantém as políticas de acesso da tabela. Pode ser aplicada
pelo fluxo de migrações do projeto ou pelo SQL Editor do Supabase com uma conta
administradora. A aplicação continua listando alunos e calculando frequência
antes da migração, mas não oferece a gravação de desistências até sua aplicação.

Um aluno que desistiu de todas as matrículas aparece como desistente. Se ainda
possui outra matrícula sem desistência, mantém o status calculado nessa matrícula
e recebe um alerta adicional. O filtro por curso/turma calcula a situação apenas
nas matrículas selecionadas.

Para validar as regras de classificação:

```bash
node --experimental-strip-types --test tests/alunos-situacao.test.mjs
```

Esse comando requer Node.js 22.6 ou superior.

## Matrículas atuais e histórico

Na página de matrículas, a aba **Ativas** exige aluno com
`status_estudante = true`, turma com `status = ativa` e matrícula sem
`encerrada_em` nem `desistiu_em`. A aba **Histórico** reúne todos os demais
registros, inclusive quando a turma foi encerrada sem atualizar a matrícula.
As contagens e a busca respeitam essa divisão. Relações ou status ausentes
permanecem no histórico até que sua atividade possa ser confirmada.

Encerrar uma matrícula nessa página preenche `encerrada_em`, preservando a
matrícula e suas presenças. As fichas continuam disponíveis no histórico.
Reabrir uma turma só traz de volta matrículas que ainda atendam aos demais
critérios de atividade.

Valide a classificação com:

```bash
node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Data de nascimento

Antes de disponibilizar esta versão, execute
`supabase/migrations/202611050001_alunos_data_nascimento.sql` no SQL Editor do
Supabase, com acesso de administrador. A migração é transacional e repetível:
adiciona `alunos.data_nascimento` como `date` opcional, rejeita datas futuras e
não altera a coluna `idade`, seus valores, registros existentes ou políticas RLS.
A chave pública usada pela aplicação não permite executar essa migração.

Novos cadastros e novas matrículas exigem nascimento válido. Na edição de
cadastros legados, o nascimento pode continuar pendente e a idade antiga é
preservada. Se a data for preenchida, precisa ser completa e válida; datas já
confirmadas não podem ser apagadas. Alterar o vínculo de curso/turma exige nascimento.
A idade é calculada no fuso America/Bahia; dados de responsável são obrigatórios
para menores de 18 anos. A matrícula de um aluno legado permite informar seu
nascimento, mas, se faltar responsável, orienta completar o cadastro primeiro.
O nascimento é salvo no aluno antes de inserir a matrícula; se esta falhar, a
correção do nascimento permanece salva e a matrícula pode ser tentada novamente.

Cadastros antigos continuam consultáveis com a idade informada e a indicação de
nascimento pendente. Nenhuma data é inferida. Com nascimento confirmado, cadastro
e ficha PDF calculam a idade a partir dele. A idade legada não é sobrescrita;
em novos cadastros é preenchida automaticamente como referência inicial de
compatibilidade. Aniversários de 29/02 são considerados em 01/03 em anos comuns.

Execute `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs`
para validar as regras, inclusive aniversário, maioridade, datas impossíveis,
ano bissexto, fuso horário e preservação da idade legada.
