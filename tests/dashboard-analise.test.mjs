import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarDashboard, FILTROS_DASHBOARD_PADRAO, diaDashboard, statusPresencaDashboard } from '../src/lib/dashboard-analise.ts';

const agora = new Date('2026-11-09T16:00:00Z');
const aluno = (id, extra = {}) => ({id, nome_completo:`Aluno ${id}`, status_estudante:true, criado_em:'2026-09-01T12:00:00Z', idade:20, ...extra});
const turma = (id, curso_id, extra={}) => ({id, nome:id, curso_id, status:'ativa', turno:'Manhã', vagas:10, ...extra});
const matricula = (id, aluno_id, turma_id='t1', curso_id='c1', extra={}) => ({id, aluno_id, turma_id, curso_id, data_matricula:'2026-10-01', ...extra});
const registro = (id, aluno_id, status='presente', extra={}) => ({id,aluno_id,curso_id:'c1',turma_id:'t1',data_hora:'2026-10-02T12:00:00Z',status,operador_id:'o1',metodo:'manual',...extra});
const dados = (extra={}) => ({alunos:[aluno('a1'),aluno('a2')], cursos:[{id:'c1',titulo:'Informática'},{id:'c2',titulo:'Robótica'}], turmas:[turma('t1','c1'),turma('t2','c2',{turno:'Tarde'})],matriculas:[matricula('m1','a1')],presencas:[],operadores:[{id:'o1',nome:'Operador'}],...extra});
const analisar = (d, f={}) => analisarDashboard(d,{...FILTROS_DASHBOARD_PADRAO,...f},agora);

test('histórico inclui cadastros sem matrícula e estudantes com turma encerrada', () => {
  const resultado=analisar(dados({turmas:[turma('t1','c1',{status:'encerrada'})],presencas:[registro('p1','a1')]}));
  assert.equal(resultado.kpis.totalCadastrados,2);
  assert.equal(resultado.kpis.alunosAtendidos,1);
  assert.equal(resultado.kpis.alunosAtivos,0);
  assert.equal(resultado.kpis.presencas,1);
  assert.equal(resultado.alunos.find(a=>a.id==='a1').status,'encerrado');
  assert.equal(resultado.alunos.find(a=>a.id==='a1').presencas,1);
  assert.equal(resultado.alunos.find(a=>a.id==='a1').frequencia,100);
  assert.equal(resultado.alunos.find(a=>a.id==='a1').frequenciaAtiva,null);
});

test('matrículas encerradas continuam no histórico, mas não na atividade atual',()=>{
  const d=dados({matriculas:[matricula('m1','a1','t1','c1',{encerrada_em:'2026-10-20'})],presencas:[registro('p1','a1')]});
  assert.equal(analisar(d).kpis.alunosAtendidos,1);
  assert.equal(analisar(d).kpis.alunosFrequentes,0);
  assert.equal(analisar(d,{escopo:'ativos'}).kpis.totalCadastrados,0);
});

test('alunos são únicos quando participam de múltiplos cursos e turmas',()=>{
  const d=dados({alunos:[aluno('a1'),aluno('a1')],matriculas:[matricula('m1','a1'),matricula('m2','a1','t2','c2'),matricula('m2','a1','t2','c2')],presencas:[registro('p1','a1'),registro('p2','a1','presente',{turma_id:'t2',curso_id:'c2'})]});
  const r=analisar(d);
  assert.equal(r.kpis.totalCadastrados,1);assert.equal(r.kpis.totalMatriculas,2);
  assert.equal(r.kpis.alunosAtendidos,1);assert.equal(r.kpis.alunosAtivos,1);
  assert.equal(r.kpis.alunosMultiplasTurmas,1);assert.equal(r.kpis.presencas,2);
});

test('limite de frequência considera 30% e 40% exatos, sem arredondar',()=>{
  const presencas=Array.from({length:10},(_,i)=>registro(`p${i}`,'a1',i<3?'presente':'falta',{data_hora:`2026-10-${String(i+1).padStart(2,'0')}T12:00:00Z`}));
  const d=dados({presencas});
  assert.equal(analisar(d).kpis.alunosFrequentes,1);
  assert.equal(analisar(d,{frequenciaMinima:40}).alunos.find(a=>a.id==='a1').status,'matriculado');
  d.presencas[3].status='presente';
  assert.equal(analisar(d,{frequenciaMinima:40}).kpis.alunosFrequentes,1);
});

test('atividade exige aluno ativo e turma ativa, mesmo sem encerramento explícito',()=>{
  const d=dados({alunos:[aluno('a1',{status_estudante:false})],presencas:[registro('p1','a1')]});
  const r=analisar(d);
  assert.equal(r.kpis.alunosAtivos,0);assert.equal(r.kpis.alunosFrequentes,0);
  assert.equal(r.kpis.presencas,1);assert.equal(r.alunos[0].status,'inativo');
});

test('desistência é explícita e pode coexistir com outra matrícula ativa',()=>{
  const r=analisar(dados({matriculas:[matricula('m1','a1'),matricula('m2','a1','t2','c2',{desistiu_em:'2026-10-15'})],presencas:[registro('p1','a1'),registro('p2','a1','falta',{turma_id:'t2',curso_id:'c2'})]}));
  assert.equal(r.kpis.desistentes,1);assert.equal(r.kpis.alunosFrequentes,1);
  assert.equal(r.alunos.find(a=>a.id==='a1').frequenciaAtiva,100);
  assert.equal(r.alunos.find(a=>a.id==='a1').frequencia,50);
  assert.equal(r.kpis.frequencia,50);
});

test('consulta sem chamadas não inventa frequência zero nem alunos frequentes',()=>{
  const r=analisar(dados());
  assert.equal(r.kpis.frequencia,null);assert.equal(r.kpis.alunosFrequentes,0);
  assert.equal(r.alunos.find(a=>a.id==='a1').status,'matriculado');
});

test('mesma chamada usa a última correção antes de aplicar filtro de operador',()=>{
  const r=dados({presencas:[registro('p1','a1','falta'),registro('p2','a1','presente',{data_hora:'2026-10-02T13:00:00Z',operador_id:'o2'})]});
  assert.equal(analisar(r).kpis.registros,1);assert.equal(analisar(r).kpis.presencas,1);
  assert.equal(analisar(r,{operadorId:'o1'}).kpis.registros,0);
  assert.equal(analisar(r,{operadorId:'o2'}).kpis.totalCadastrados,1);
});

test('status desconhecido não conta como presença, falta ou frequência',()=>{
  const r=analisar(dados({presencas:[registro('p1','a1','pendente')]}));
  assert.equal(r.kpis.registros,1);assert.equal(r.kpis.naoClassificados,1);
  assert.equal(r.kpis.presencas,0);assert.equal(r.kpis.faltas,0);assert.equal(r.kpis.frequencia,null);
  assert.equal(r.avisos.length,1);
  assert.equal(statusPresencaDashboard(null),'presente');
  assert.equal(statusPresencaDashboard('ausente'),'falta');
});

test('período usa calendário da Bahia e mantém coorte cadastral independente de chamadas',()=>{
  assert.equal(diaDashboard('2026-10-02T01:00:00Z'),'2026-10-01');
  const r=analisar(dados({presencas:[registro('p1','a1','presente',{data_hora:'2026-10-02T01:00:00Z'}),registro('p2','a1','falta',{data_hora:'2026-10-02T13:00:00Z'})]}),{dataInicio:'2026-10-01',dataFim:'2026-10-01'});
  assert.equal(r.kpis.presencas,1);assert.equal(r.kpis.faltas,0);
  assert.equal(r.kpis.totalCadastrados,2);assert.equal(r.kpis.alunosAtendidos,1);
  assert.equal(r.evolucao[0].cadastros,0);
});

test('datas inválidas ou invertidas geram aviso e não incluem registros',()=>{
  const d=dados({presencas:[registro('p1','a1')]});
  for(const f of [{dataInicio:'2026-10-31',dataFim:'2026-10-01'},{dataInicio:'2026-02-31'}]){
    const r=analisar(d,f);assert.equal(r.kpis.registros,0);assert.equal(r.avisos.length,1);
  }
});

test('filtros de cursos e turmas afetam alunos, matrículas, chamadas e agregações juntos',()=>{
  const d=dados({matriculas:[matricula('m1','a1'),matricula('m2','a2','t2','c2')],presencas:[registro('p1','a1'),registro('p2','a2','falta',{turma_id:'t2',curso_id:'c2'})]});
  const r=analisar(d,{cursoIds:['c2'],turmaIds:['t2']});
  assert.deepEqual(r.alunos.map(a=>a.id),['a2']);assert.equal(r.matriculas[0].id,'m2');
  assert.equal(r.presencas[0].id,'p2');assert.equal(r.cursos.length,1);assert.equal(r.turmas.length,1);
  assert.equal(r.cursos[0].faltas,1);assert.equal(r.cursos[0].frequencia,0);
  assert.equal(analisar(d,{cursoIds:['c1','c2']}).kpis.alunosAtendidos,2);
});

test('filtro de status restringe todos os agregados ao mesmo grupo de alunos',()=>{
  const d=dados({matriculas:[matricula('m1','a1'),matricula('m2','a2')],presencas:[registro('p1','a1'),registro('p2','a2','falta')]});
  const r=analisar(d,{statusAluno:'matriculado'});
  assert.deepEqual(r.alunos.map(a=>a.id),['a2']);assert.equal(r.kpis.faltas,1);
  assert.equal(r.kpis.presencas,0);assert.equal(r.cursos[0].alunos,1);
});

test('faixa etária usa nascimento atual e busca ignora acentos',()=>{
  const d=dados({alunos:[aluno('a1',{nome_completo:'João Exemplo',data_nascimento:'2008-11-10',idade:99,bairro:'Mangabeira',municipio:'Feira de Santana'}),aluno('a2',{idade:null})]});
  const r=analisar(d,{faixaEtaria:'0-17',busca:'JOAO',bairro:'Mangabeira',municipio:'Feira de Santana'});
  assert.equal(r.alunos.length,1);assert.equal(r.alunos[0].idade,17);
  assert.equal(analisar(d,{faixaEtaria:'nao-informada'}).alunos[0].id,'a2');
});

test('chamadas anteriores à rematrícula não determinam frequência atual',()=>{
  const d=dados({matriculas:[matricula('m1','a1','t1','c1',{data_matricula:'2026-10-10'})],presencas:[registro('p1','a1'),registro('p2','a1','falta',{data_hora:'2026-10-12T12:00:00Z'})]});
  const r=analisar(d);assert.equal(r.alunos.find(a=>a.id==='a1').frequenciaAtiva,0);
  assert.equal(r.alunos.find(a=>a.id==='a1').frequencia,50);
  assert.equal(r.kpis.presencas,1);assert.equal(r.kpis.faltas,1);
});

test('mapa de calor mantém dia local correto; matrículas duplicadas não duplicam ocupação',()=>{
  const r=analisar(dados({matriculas:[matricula('m1','a1'),matricula('m2','a1')],presencas:[registro('p1','a1','presente',{data_hora:'2026-10-05T01:00:00Z'})]}));
  assert.equal(r.mapaCalor.find(c=>c.total).dia,0);
  assert.equal(r.turmas[0].ocupacao,10);assert.equal(r.turmas[0].alunos,1);
});

test('chamadas futuras e datas inválidas não entram nos indicadores',()=>{
  const r=analisar(dados({presencas:[registro('p1','a1','presente',{data_hora:'2027-01-01T12:00:00Z'}),registro('p2','a1','presente',{data_hora:'invalid'})]}));
  assert.equal(r.kpis.registros,0);
});
