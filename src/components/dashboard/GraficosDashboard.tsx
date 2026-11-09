"use client";

import { useId, useMemo, useState } from "react";
import styles from "./GraficosDashboard.module.css";

export type ItemSituacao = { id: string; label: string; value: number; color: string };
export type ItemCursoGrafico = { id: string; label: string; alunos: number; presencas: number; faltas: number };
export type ItemEvolucao = { mes: string; label: string; presencas: number; faltas: number; cadastros: number };
export type ItemMapaCalor = { dia: number; turno: string; total: number; presencas: number };

const number = new Intl.NumberFormat("pt-BR");
const colors = { presencas: "#16b68a", faltas: "#f47786", cadastros: "#608df4" };
const safe = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
const pct = (value: number, total: number) => total ? `${Math.round(value / total * 100)}%` : "—";

function Vazio({ children }: { children: React.ReactNode }) {
  return <div className={styles.empty}><div><svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true" style={{ margin: "0 auto 14px", opacity: .5 }}><path d="M7 7v24h25M13 24v-7m7 7V10m7 14v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>{children}</div></div>;
}

export function DonutSituacoes({ items, onSelect, selected }: { items: ItemSituacao[]; onSelect: (id: string) => void; selected?: string }) {
  const total = items.reduce((sum, item) => sum + safe(item.value), 0);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  if (!total) return <Vazio>Nenhum aluno neste recorte.<br />Ajuste os filtros para visualizar as situações.</Vazio>;
  return <div className={`${styles.chart} ${styles.donutLayout}`}>
    <svg className={styles.ring} viewBox="0 0 200 200" role="img" aria-label={`Distribuição de ${number.format(total)} alunos por situação. ${items.map(item => `${item.label}: ${number.format(item.value)}`).join("; ")}. Use a legenda para filtrar.`}>
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--bi-grid, var(--surface-muted))" strokeWidth="22" />
      {items.map((item, index) => {
        const fraction = safe(item.value) / total;
        const offset = items.slice(0, index).reduce((sum, prior) => sum + safe(prior.value) / total, 0);
        return fraction > 0 ? <circle key={item.id} cx="100" cy="100" r={radius} fill="none" stroke={item.color} strokeWidth={selected === item.id ? 28 : 22} strokeDasharray={`${Math.max(0, fraction * circumference - (fraction < 1 ? 3 : 0))} ${circumference}`} strokeDashoffset={-offset * circumference} transform="rotate(-90 100 100)" opacity={selected && selected !== item.id ? .3 : 1}><title>{item.label}: {number.format(item.value)} ({pct(item.value, total)})</title></circle> : null;
      })}
      <text x="100" y="102" textAnchor="middle" fill="var(--bi-text,var(--ink))" fontSize="34" fontWeight="750">{number.format(total)}</text>
      <text x="100" y="125" textAnchor="middle" fill="var(--bi-muted,var(--muted))" fontSize="11">alunos no recorte</text>
    </svg>
    <div className={styles.legend}>{items.map(item => <button key={item.id} className={styles.legendButton} type="button" aria-pressed={selected === item.id} onClick={() => onSelect(item.id)} title={`Filtrar: ${item.label} — ${number.format(item.value)} alunos (${pct(item.value, total)})`}><span className={styles.dot} style={{ background: item.color }} /><span>{item.label}<span className={styles.muted} style={{ display: "block" }}>{pct(item.value, total)} do recorte</span></span><span className={styles.legendValue}>{number.format(item.value)}</span></button>)}</div>
  </div>;
}

export function ComparativoCursos({ items, onSelect, selectedIds = [] }: { items: ItemCursoGrafico[]; onSelect: (id: string) => void; selectedIds?: string[] }) {
  if (!items.length) return <Vazio>Nenhum curso encontrado com estes filtros.</Vazio>;
  const max = Math.max(1, ...items.map(item => safe(item.presencas) + safe(item.faltas)));
  return <div className={styles.chart}>
    <div className={styles.legendRow}><span><i className={styles.dot} style={{ background: colors.presencas }} />Presenças</span><span><i className={styles.dot} style={{ background: colors.faltas }} />Faltas</span><span>Barras em número de registros</span></div>
    <div className={styles.courseList}>{items.map(item => {
      const total = safe(item.presencas) + safe(item.faltas);
      return <button type="button" key={item.id} className={styles.course} aria-pressed={selectedIds.includes(item.id)} onClick={() => onSelect(item.id)} aria-label={`Filtrar ${item.label}: ${number.format(item.alunos)} alunos, ${number.format(item.presencas)} presenças e ${number.format(item.faltas)} faltas`} title={`${item.label}: ${number.format(item.alunos)} alunos · ${number.format(item.presencas)} presenças · ${number.format(item.faltas)} faltas · frequência ${pct(item.presencas, total)}`}>
        <div className={styles.courseHeader}><span className={styles.courseName}>{item.label}</span><span className={styles.courseStats}><strong>{number.format(item.alunos)}</strong> alunos</span></div>
        <div className={styles.bar} aria-hidden="true"><span style={{ width: `${safe(item.presencas) / max * 100}%`, background: colors.presencas }} /><span style={{ width: `${safe(item.faltas) / max * 100}%`, background: colors.faltas }} /></div>
        <div className={styles.barCaption}><span>{total ? `${number.format(total)} registros` : "Sem chamadas registradas"}</span><span>{total ? `${pct(item.presencas, total)} de presença` : "Frequência indisponível"}</span></div>
      </button>;
    })}</div>
    <p className={styles.helper}>Clique em um curso para filtrar o painel. Um aluno pode participar de mais de um curso.</p>
  </div>;
}

export function EvolucaoMensal({ items }: { items: ItemEvolucao[] }) {
  const id = useId().replaceAll(":", "");
  const [active, setActive] = useState<string | null>(null);
  const series = useMemo(() => [...items].sort((a, b) => a.mes.localeCompare(b.mes)), [items]);
  const selected = series.find(item => item.mes === active);
  const width = 680, height = 230, left = 42, right = 18, top = 16, bottom = 32;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const maxValue = Math.max(1, ...series.flatMap(item => [safe(item.presencas), safe(item.faltas), safe(item.cadastros)]));
  const ceiling = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const x = (index: number) => series.length === 1 ? left + plotWidth / 2 : left + index / (series.length - 1) * plotWidth;
  const y = (value: number) => top + plotHeight * (1 - safe(value) / ceiling);
  const points = (key: "presencas" | "faltas" | "cadastros") => series.map((item, index) => `${x(index)},${y(item[key])}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(series.length / 7));
  if (!series.length || !series.some(item => item.presencas || item.faltas || item.cadastros)) return <Vazio>Não há registros com data neste recorte para mostrar a evolução.</Vazio>;
  return <div className={`${styles.chart} ${styles.evolution}`}>
    <div className={styles.legendRow}>{(["presencas", "faltas", "cadastros"] as const).map((key, i) => <span key={key}><i className={styles.dot} style={{ background: colors[key] }} />{["Presenças", "Faltas", "Novos cadastros"][i]}</span>)}</div>
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.plot} role="group" aria-label="Evolução mensal de presenças, faltas e novos cadastros. Valores exatos disponíveis na tabela abaixo.">
      <defs><linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.presencas} stopOpacity=".18" /><stop offset="100%" stopColor={colors.presencas} stopOpacity=".01" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(step => <g key={step}><line x1={left} x2={width - right} y1={y(ceiling / 4 * step)} y2={y(ceiling / 4 * step)} stroke="var(--bi-border,var(--line))" strokeDasharray={step ? "3 5" : undefined} /><text x={left - 10} y={y(ceiling / 4 * step) + 4} textAnchor="end">{number.format(ceiling / 4 * step)}</text></g>)}
      {series.length > 1 && <polygon points={`${x(0)},${y(0)} ${points("presencas")} ${x(series.length - 1)},${y(0)}`} fill={`url(#area-${id})`} />}
      {(["presencas", "faltas", "cadastros"] as const).map(key => <polyline key={key} points={points(key)} fill="none" stroke={colors[key]} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={key === "cadastros" ? "5 4" : undefined} />)}
      {series.map((item, index) => <g key={item.mes}>
        {(index % labelStep === 0 || index === series.length - 1) && <text x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}>{item.label}</text>}
        <line x1={x(index)} x2={x(index)} y1={top} y2={y(0)} stroke="var(--bi-muted,var(--muted))" strokeDasharray="3 4" opacity={active === item.mes ? .35 : 0} />
        <rect x={x(index) - Math.min(24, plotWidth / Math.max(series.length, 1) / 2)} y={top} width={Math.min(48, plotWidth / Math.max(series.length, 1))} height={plotHeight} fill="transparent" onMouseEnter={() => setActive(item.mes)} onMouseLeave={() => setActive(null)} />
        {(["presencas", "faltas", "cadastros"] as const).map((key, seriesIndex) => <circle key={key} className={styles.point} cx={x(index)} cy={y(item[key])} r={active === item.mes ? 4.5 : 3} fill={colors[key]} stroke="var(--bi-surface,var(--surface))" strokeWidth="2" tabIndex={seriesIndex === 0 ? 0 : undefined} role={seriesIndex === 0 ? "img" : undefined} aria-label={seriesIndex === 0 ? `${item.label}: ${number.format(item.presencas)} presenças, ${number.format(item.faltas)} faltas, ${number.format(item.cadastros)} cadastros` : undefined} onFocus={() => setActive(item.mes)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(item.mes)} onMouseLeave={() => setActive(null)}><title>{item.label}: {number.format(item[key])} {key === "presencas" ? "presenças" : key}</title></circle>)}
      </g>)}
    </svg>
    <div className={`${styles.tooltip} ${selected ? "" : styles.tooltipEmpty}`} aria-live="polite">{selected ? <><strong>{selected.label}</strong><span>{number.format(selected.presencas)} presenças</span><span>{number.format(selected.faltas)} faltas</span><span>{number.format(selected.cadastros)} novos cadastros</span></> : "Passe o cursor ou navegue pelos pontos com Tab para ver os valores."}</div>
    <details className={styles.details}><summary>Ver valores por mês</summary><div style={{ overflowX: "auto" }}><table className={styles.dataTable}><caption className="sr-only">Dados da evolução mensal</caption><thead><tr><th scope="col">Mês</th><th scope="col">Presenças</th><th scope="col">Faltas</th><th scope="col">Cadastros</th></tr></thead><tbody>{series.map(item => <tr key={item.mes}><th scope="row">{item.label}</th><td>{number.format(item.presencas)}</td><td>{number.format(item.faltas)}</td><td>{number.format(item.cadastros)}</td></tr>)}</tbody></table></div></details>
  </div>;
}

export function MapaCalor({ items }: { items: ItemMapaCalor[] }) {
  const [active, setActive] = useState<string | null>(null);
  const days = [{ value: 1, label: "Seg", full: "Segunda-feira" }, { value: 2, label: "Ter", full: "Terça-feira" }, { value: 3, label: "Qua", full: "Quarta-feira" }, { value: 4, label: "Qui", full: "Quinta-feira" }, { value: 5, label: "Sex", full: "Sexta-feira" }, { value: 6, label: "Sáb", full: "Sábado" }, { value: 0, label: "Dom", full: "Domingo" }];
  const turnos = [...new Set(items.map(item => item.turno || "Não informado"))];
  const cells = turnos.flatMap(turno => days.map(day => {
    const matches = items.filter(item => (item.turno || "Não informado") === turno && item.dia === day.value);
    const total = matches.reduce((sum, item) => sum + safe(item.total), 0);
    const presencas = matches.reduce((sum, item) => sum + safe(item.presencas), 0);
    return { id: `${day.value}-${turno}`, turno, day, total, presencas };
  }));
  const max = Math.max(1, ...cells.map(cell => cell.total));
  const selected = cells.find(cell => cell.id === active);
  if (!items.length || !cells.some(cell => cell.total)) return <Vazio>Não há chamadas neste recorte para distribuir por dia e turno.</Vazio>;
  const background = (total: number) => total ? `color-mix(in srgb, #608df4 ${Math.round(15 + total / max * 45)}%, var(--bi-surface,var(--surface)))` : "var(--bi-grid,var(--surface-muted))";
  return <div className={styles.chart}>
    <div className={styles.heatGrid} role="group" aria-label="Quantidade de registros de chamada por dia da semana e turno"><span /><>{days.map(day => <span key={day.value} className={styles.heatHeading}>{day.label}</span>)}</>
      {turnos.map(turno => <div key={turno} style={{ display: "contents" }}><span className={styles.heatLabel}>{turno}</span>{cells.filter(cell => cell.turno === turno).map(cell => <div key={cell.id} className={styles.heatCell} tabIndex={0} role="img" data-active={active === cell.id} style={{ background: background(cell.total) }} aria-label={`${cell.day.full}, ${turno}: ${number.format(cell.total)} registros, ${number.format(cell.presencas)} presenças${cell.total ? `, frequência ${pct(cell.presencas, cell.total)}` : ""}`} title={`${cell.day.full} · ${turno}: ${number.format(cell.total)} registros, ${number.format(cell.presencas)} presenças`} onFocus={() => setActive(cell.id)} onBlur={() => setActive(null)} onMouseEnter={() => setActive(cell.id)} onMouseLeave={() => setActive(null)}>{cell.total ? number.format(cell.total) : "—"}</div>)}</div>)}
    </div>
    <div className={styles.heatLegend}><span>Menos registros</span>{[0, .25, .5, .75, 1].map(value => <i key={value} style={{ background: background(value * max) }} />)}<span>Mais</span></div>
    <div className={`${styles.tooltip} ${selected ? "" : styles.tooltipEmpty}`} aria-live="polite">{selected ? <><strong>{selected.day.label} · {selected.turno}</strong><span>{number.format(selected.total)} registros</span><span>{number.format(selected.presencas)} presenças</span><span>{selected.total ? `${pct(selected.presencas, selected.total)} de presença` : "Sem registros"}</span></> : "Explore uma célula para conferir os registros de chamada."}</div>
    <p className={styles.helper}>A intensidade representa registros de chamada, não alunos únicos. Cada aluno pode aparecer em vários dias.</p>
  </div>;
}
