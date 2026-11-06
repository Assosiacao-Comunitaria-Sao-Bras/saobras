"use client";

import { hojeNaBahia } from "@/lib/idade";

export function CampoNascimento({ id, value, onChange, required = true }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [ano = "", mes = "", dia = ""] = value.split("-");
  const campo = "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900";
  const atualizar = (indice: number, novo: string) => {
    const partes = [ano, mes, dia];
    partes[indice] = novo;
    onChange(partes.join("-"));
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-slate-700">Nascimento do aluno</legend>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${id}-ano`} className="block text-sm font-medium mb-1">Ano</label>
          <input id={`${id}-ano`} type="text" inputMode="numeric" required={required}
            minLength={4} maxLength={4} pattern="[0-9]{4}" placeholder="Ex.: 2010"
            title={`Informe o ano de nascimento, até ${hojeNaBahia().slice(0, 4)}.`}
            value={ano} onChange={(e) => atualizar(0, e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            className={campo} />
        </div>
        <div>
          <label htmlFor={`${id}-mes`} className="block text-sm font-medium mb-1">Mês</label>
          <select id={`${id}-mes`} required={required} value={mes} onChange={(e) => atualizar(1, e.target.value)} className={campo}>
            <option value="">Mês</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-dia`} className="block text-sm font-medium mb-1">Dia</label>
          <select id={`${id}-dia`} required={required} value={dia} onChange={(e) => atualizar(2, e.target.value)} className={campo}>
            <option value="">Dia</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500">Informe o ano, o mês e o dia de nascimento. A idade será calculada automaticamente.</p>
    </fieldset>
  );
}
