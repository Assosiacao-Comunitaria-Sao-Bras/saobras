"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setIsLoading(false);
    if (resetError) {
      if (resetError.message.toLowerCase().includes("rate limit")) {
        setError("Muitos pedidos de recuperação em pouco tempo. Aguarde 2 horas e tente novamente.");
      } else {
        setError(`Erro: ${resetError.message}`);
      }
    } else {
      setEnviado(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recuperar senha</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Informe seu e-mail e enviaremos um link para criar uma nova senha
          </p>
        </div>

        {enviado ? (
          <div className="space-y-6">
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md font-medium">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique também o spam.
            </div>
            <Link href="/login" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  placeholder="operador@instituto.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-slate-700">
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
