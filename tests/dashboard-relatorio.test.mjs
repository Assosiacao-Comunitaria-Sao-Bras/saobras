import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { analisarDashboard, FILTROS_DASHBOARD_PADRAO } from '../src/lib/dashboard-analise.ts';
const compilar = (file) => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const url = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const fonte = compilar('../src/lib/dashboard-relatorio.ts').replace('"./dashboard-analise"', JSON.stringify(url(compilar('../src/lib/dashboard-analise.ts'))));
const { montarRelatorioDashboard } = await import(url(fonte));
const dados = { alunos: [{ id: 'a', nome_completo: 'Aluno fictício', status_estudante: true }], cursos: [{ id: 'c', titulo: 'Curso fictício' }], turmas: [{ id: 't', nome: 'Turma fictícia', curso_id: 'c', status: 'ativa' }], matriculas: [{ id: 'm', aluno_id: 'a', curso_id: 'c', turma_id: 't' }], presencas: [{ id: 'p', aluno_id: 'a', curso_id: 'c', turma_id: 't', data_hora: '2026-01-10T12:00:00Z', status: 'presente' }], operadores: [] };
test('relatório usa exatamente o recorte, os blocos e os gráficos selecionados', () => {
  const filtros = { ...FILTROS_DASHBOARD_PADRAO, cursoIds: ['c'], dataInicio: '2026-01-01', dataFim: '2026-01-31' };
  const analise = analisarDashboard(dados, filtros);
  const config = { titulo: 'Teste de análise', orientacao: 'landscape', secoes: ['resumo', 'alunos'], graficos: ['cursos'] };
  const rel = montarRelatorioDashboard(dados, analise, filtros, config, '2026-01-31T12:00:00Z');
  assert.equal(rel.tabelas.length, 2);
  assert.equal(rel.graficos.length, 1);
  assert.equal(rel.graficos[0].itens[0].presencas, analise.kpis.presencas);
  assert.equal(rel.tabelas[1].linhas.length, analise.alunos.length);
  assert.ok(rel.filtros.includes('Cursos: Curso fictício'));
  assert.equal(rel.emitidoEm, '2026-01-31T12:00:00Z');
});
test('recorte sem resultados gera documento vazio sem recuperar dados fora dos filtros', () => {
  const filtros = { ...FILTROS_DASHBOARD_PADRAO, busca: 'inexistente' };
  const analise = analisarDashboard(dados, filtros);
  const rel = montarRelatorioDashboard(dados, analise, filtros, { titulo: 'Vazio', orientacao: 'portrait', secoes: ['alunos', 'registros'], graficos: ['cursos'] }, '2026-01-31T12:00:00Z');
  assert.ok(rel.tabelas.every(t => t.linhas.length === 0));
  assert.equal(rel.graficos[0].itens.length, 0);
});
