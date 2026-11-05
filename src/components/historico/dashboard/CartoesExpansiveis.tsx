"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ClipboardList } from "lucide-react";

type Motivo = { rotulo: string; quantidade: number };

export function CartaoMatriculas({
  ativas,
  inativas,
  motivos,
}: {
  ativas: number;
  inativas: number;
  motivos: Motivo[];
}) {
  const [aberto, setAberto] = useState(false);
  const total = ativas + inativas;
  const pctAtivas = total > 0 ? Math.round((ativas / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-start justify-between gap-3 rounded-xl p-5 text-left transition hover:bg-slate-50"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Matrículas</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{total}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
            {aberto ? "Ocultar detalhes" : "Clique para ver ativas e inativas"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`}
            />
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <ClipboardList className="h-6 w-6" />
        </div>
      </button>

      {aberto && (
        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ativas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{ativas}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Inativas</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{inativas}</p>
            </div>
          </div>

          <div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${pctAtivas}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{pctAtivas}% das matrículas estão ativas</p>
          </div>

          {inativas > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Por que estão inativas</p>
              <ul className="space-y-1">
                {motivos
                  .filter((m) => m.quantidade > 0)
                  .map((m) => (
                    <li key={m.rotulo} className="flex justify-between text-xs text-slate-600">
                      <span>{m.rotulo}</span>
                      <span className="font-semibold text-slate-800">{m.quantidade}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <Link href="/matriculas" className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-700">
            Abrir matrículas →
          </Link>
        </div>
      )}
    </div>
  );
}

export function CartaoCursos({
  ativos,
  inativos,
}: {
  ativos: { titulo: string; turmas: number }[];
  inativos: { titulo: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<"ativos" | "inativos">("ativos");

  const abas = [
    { id: "ativos" as const, rotulo: "Ativos", quantidade: ativos.length },
    { id: "inativos" as const, rotulo: "Inativos", quantidade: inativos.length },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-start justify-between gap-3 rounded-xl p-5 text-left transition hover:bg-slate-50"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Cursos ativos</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{ativos.length}</p>
          <p className="mt-1 text-xs text-slate-500">Cursos com turma na grade semanal</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600">
            {aberto ? "Ocultar detalhes" : "Clique para ver ativos e inativos"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${aberto ? "rotate-180" : ""}`}
            />
          </p>
        </div>

        <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
          <BookOpen className="h-6 w-6" />
        </div>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
            {abas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  aba === a.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {a.rotulo} ({a.quantidade})
              </button>
            ))}
          </div>

          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {aba === "ativos" &&
              ativos.map((c) => (
                <li
                  key={c.titulo}
                  className="flex items-center justify-between gap-3 rounded-md bg-emerald-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-800">{c.titulo}</span>
                  <span className="shrink-0 text-emerald-700">
                    {c.turmas} {c.turmas === 1 ? "turma" : "turmas"}
                  </span>
                </li>
              ))}

            {aba === "inativos" &&
              inativos.map((c) => (
                <li key={c.titulo} className="rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  {c.titulo}
                </li>
              ))}

            {aba === "ativos" && ativos.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">Nenhum curso com turma na grade.</li>
            )}
            {aba === "inativos" && inativos.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">Todos os cursos têm turma na grade.</li>
            )}
          </ul>

          <p className="mt-3 text-[11px] text-slate-400">
            Inativo = curso cadastrado sem nenhuma turma na grade semanal.
          </p>
        </div>
      )}
    </div>
  );
}
