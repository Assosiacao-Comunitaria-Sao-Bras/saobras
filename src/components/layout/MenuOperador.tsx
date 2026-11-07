"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Eye, EyeOff, KeyRound, Lock, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function MenuOperador({ nome, email }: { nome: string; email: string }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // O modal é desenhado fora do cabeçalho (portal) para cobrir a tela toda
  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  function fechar() {
    setAberto(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmar("");
    setMostrar(false);
    setErro(null);
    setSucesso(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("A confirmação não é igual à nova senha.");
      return;
    }
    if (novaSenha === senhaAtual) {
      setErro("A nova senha precisa ser diferente da senha atual.");
      return;
    }

    setSalvando(true);

    // 1) Confere se a senha atual está correta
    const { error: erroSenhaAtual } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    });

    if (erroSenhaAtual) {
      setSalvando(false);
      setErro("Senha atual incorreta.");
      return;
    }

    // 2) Troca pela nova senha (só do usuário logado)
    const { error: erroTroca } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvando(false);

    if (erroTroca) {
      setErro(`Erro ao alterar a senha: ${erroTroca.message}`);
      return;
    }

    setSucesso(true);
    setTimeout(fechar, 1800);
  }

  const campo =
    "w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm";

  return (
    <>
      {/* Nome do operador (clicável) */}
      <button
        type="button"
        onClick={() => setAberto(true)}
        title="Clique para alterar sua senha"
        className="flex max-w-[55%] shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-[#f2f7ff] px-3 py-2 transition-colors hover:bg-blue-100 sm:px-4"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="Conectado" />
        <span className="max-w-[90px] truncate text-xs font-semibold text-[#202044] sm:max-w-[320px] sm:text-sm">
          {nome}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            onClick={fechar}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <KeyRound className="h-5 w-5 text-blue-600" />
                  Alterar minha senha
                </h2>
                <button
                  type="button"
                  onClick={fechar}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 px-6 py-3">
                <p className="text-sm font-semibold text-slate-900">{nome}</p>
                <p className="text-xs text-slate-500">{email}</p>
              </div>

              {sucesso ? (
                <div className="p-6">
                  <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-medium text-green-700">
                    Senha alterada com sucesso!
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  {erro && (
                    <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
                      {erro}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Senha atual</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={mostrar ? "text" : "password"}
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className={`${campo} pr-10`}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setMostrar(!mostrar)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nova senha</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={mostrar ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className={campo}
                        placeholder="Mínimo de 6 caracteres"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar nova senha</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={mostrar ? "text" : "password"}
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        className={campo}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={fechar}
                      className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {salvando ? "Salvando..." : "Alterar senha"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}