"use client";

import { useState } from "react";

type Props = {
  value: string;
  options: string[];
  onChange: (valor: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

const CLASSE =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500 text-sm transition-colors disabled:bg-slate-100";

/**
 * Lista suspensa com opção "Outro" (digitação livre).
 * Valores já salvos que não estão na lista abrem automaticamente em modo "Outro".
 */
export function CampoLista({ value, options, onChange, disabled, placeholder = "Selecione...", required }: Props) {
  const [forcarOutro, setForcarOutro] = useState(false);
  const foraDaLista = value !== "" && !options.includes(value);
  const modoOutro = forcarOutro || foraDaLista;

  if (modoOutro) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          required={required}
          disabled={disabled}
          autoFocus={forcarOutro}
          value={value}
          placeholder="Digite aqui"
          onChange={(e) => onChange(e.target.value)}
          className={CLASSE}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setForcarOutro(false);
            if (foraDaLista) onChange("");
          }}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          Escolher da lista
        </button>
      </div>
    );
  }

  return (
    <select
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => {
        if (e.target.value === "__outro__") {
          setForcarOutro(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      className={CLASSE}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      <option value="__outro__">Outro (digitar)</option>
    </select>
  );
}
