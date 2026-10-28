"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";

type Props = {
  value: string;
  options: string[];
  onChange: (valor: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const CLASSE =
  "w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-500 text-sm transition-colors disabled:bg-slate-100";

/** Remove acentos e ignora maiúsculas/minúsculas para a busca. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Lista com pesquisa: ao digitar, filtra as opções (sem diferenciar acentos).
 * Se o que foi digitado não estiver na lista, aparece a opção "Usar ..." para
 * salvar o texto digitado. Valores já salvos fora da lista continuam sendo exibidos.
 */
export function CampoLista({
  value,
  options,
  onChange,
  disabled,
  placeholder = "Pesquisar ou selecionar...",
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [destaque, setDestaque] = useState(0);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return options;
    const comeca = options.filter((o) => normalizar(o).startsWith(termo));
    const contem = options.filter(
      (o) => !normalizar(o).startsWith(termo) && normalizar(o).includes(termo)
    );
    return [...comeca, ...contem];
  }, [busca, options]);

  const textoDigitado = busca.trim();
  const existeIgual = options.some(
    (o) => normalizar(o) === normalizar(textoDigitado)
  );
  const mostrarUsarDigitado = textoDigitado !== "" && !existeIgual;
  const totalItens = filtradas.length + (mostrarUsarDigitado ? 1 : 0);

  const fechar = () => {
    setAberto(false);
    setBusca("");
    setDestaque(0);
  };

  const escolher = (indice: number) => {
    if (indice < filtradas.length) {
      onChange(filtradas[indice]);
    } else if (mostrarUsarDigitado) {
      onChange(textoDigitado);
    }
    fechar();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!aberto) return setAberto(true);
      setDestaque((d) => Math.min(d + 1, Math.max(totalItens - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Enter") {
      if (aberto) {
        e.preventDefault();
        if (totalItens > 0) escolher(destaque);
      }
    } else if (e.key === "Escape") {
      fechar();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        disabled={disabled}
        autoComplete="off"
        value={aberto ? busca : value}
        placeholder={value || placeholder}
        onFocus={() => setAberto(true)}
        onBlur={fechar}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setBusca(e.target.value);
          setDestaque(0);
          setAberto(true);
        }}
        className={CLASSE}
      />

      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            title="Limpar"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              fechar();
            }}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {aberto && !disabled && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtradas.map((o, i) => (
            <li
              key={o}
              onClick={() => escolher(i)}
              onMouseEnter={() => setDestaque(i)}
              className={`cursor-pointer px-3 py-2 ${
                i === destaque ? "bg-blue-50 text-blue-900" : "text-slate-700"
              } ${o === value ? "font-semibold" : ""}`}
            >
              {o}
            </li>
          ))}

          {mostrarUsarDigitado && (
            <li
              onClick={() => escolher(filtradas.length)}
              onMouseEnter={() => setDestaque(filtradas.length)}
              className={`cursor-pointer border-t border-slate-100 px-3 py-2 ${
                destaque === filtradas.length
                  ? "bg-blue-50 text-blue-900"
                  : "text-slate-600"
              }`}
            >
              Usar &quot;{textoDigitado}&quot;
            </li>
          )}

          {totalItens === 0 && (
            <li className="px-3 py-2 text-slate-400">Nenhum resultado</li>
          )}
        </ul>
      )}
    </div>
  );
}
