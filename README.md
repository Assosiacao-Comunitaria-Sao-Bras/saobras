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
