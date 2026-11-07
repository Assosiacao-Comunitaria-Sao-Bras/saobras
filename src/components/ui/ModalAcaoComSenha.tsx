"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Lock, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  titulo: string;
  /** Texto principal da primeira etapa (a pergunta "tem certeza?"). */
  pergunta: React.ReactNode;
  /** Destaque com o nome do item (aluno, turma...). */
  destaque?: React.ReactNode;
  /** Aviso complementar abaixo do destaque. */
  aviso?: React.ReactNode;
  /** Texto do botão da primeira etapa. */
  rotuloContinuar?: string;
  /** Texto do botão final, depois da senha. */
  rotuloFinal: string;
  /** "red" para apagar, "amber" para encerrar. */
  tom?: "red" | "amber";
  /**
   * Executa a ação depois que a senha for conferida.
   * Retorne null se deu certo (o modal deve ser fechado pelo pai)
   * ou o texto do erro para mostrar na tela.
   */
  onConfirmar: () => Promise<string | null>;
  onFechar: () => void;
};

const TONS = {
  red: {
    cabecalho: "bg-red-50",
    titulo: "text-red-800",
    botao: "bg-red-600 hover:bg-red-700",
    foco: "focus:ring-red-500",
    aviso: "text-red-700",
  },
  amber: {
    cabecalho: "bg-amber-50",
    titulo: "text-amber-800",
    botao: "bg-amber-600 hover:bg-amber-700",
    foco: "focus:ring-amber-500",
    aviso: "text-amber-800",
  },
} as const;

export function ModalAcaoComSenha({
  titulo,
  pergunta,
  destaque,
  aviso,
  rotuloContinuar = "Sim, continuar",
  rotuloFinal,
  tom = "red",
  onConfirmar,
  onFechar,
}: Props) {
  const cores = TONS[tom];
  const [passo, setPasso] = useState<"confirmar" | "senha">("confirmar");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [executando, setExecutando] = useState(false);

  const fechar = () => {
    if (!executando) {
      onFechar();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (executando) {
      return;
    }

    if (!senha) {
      setErro("Digite a sua senha de acesso.");
      return;
    }

    setExecutando(true);
    setErro("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setErro("Usuário não logado.");
        return;
      }

      // Confere a senha de quem está logado antes de executar a ação.
      const { error: erroSenha } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senha,
      });

      if (erroSenha) {
        setErro("Senha incorreta. Nada foi alterado.");
        return;
      }

      const erroAcao = await onConfirmar();

      if (erroAcao) {
        setErro(erroAcao);
      }
    } catch (err) {
      setErro(
        "Erro inesperado: " + (err instanceof Error ? err.message : "erro desconhecido")
      );
    } finally {
      setExecutando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className={`flex justify-between items-center p-5 border-b border-slate-200 ${cores.cabecalho}`}>
          <h3 className={`font-bold text-lg flex items-center gap-2 ${cores.titulo}`}>
            <AlertTriangle className="w-5 h-5" />
            {titulo}
          </h3>
          <button type="button" onClick={fechar} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {passo === "confirmar" ? (
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-700">{pergunta}</p>

            {destaque && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                {destaque}
              </div>
            )}

            {aviso && <p className={`text-xs ${cores.aviso}`}>{aviso}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={fechar}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setPasso("senha")}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${cores.botao}`}
              >
                {rotuloContinuar}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <p className="text-sm text-slate-700">
              Para confirmar, digite a sua senha de acesso ao sistema.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro("");
                  }}
                  disabled={executando}
                  className={`w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:outline-none ${cores.foco}`}
                />
              </div>
            </div>

            {erro && (
              <p className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                {erro}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={fechar}
                disabled={executando}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={executando}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-60 flex items-center gap-2 ${cores.botao}`}
              >
                {executando && <Loader2 className="w-4 h-4 animate-spin" />}
                {rotuloFinal}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
