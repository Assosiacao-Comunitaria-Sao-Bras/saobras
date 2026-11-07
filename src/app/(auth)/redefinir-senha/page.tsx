"use client";

import { Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status = "verificando" | "pronto" | "invalido" | "sucesso";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStatus("pronto");
      }
    });

    const validar = async () => {
      const query = new URLSearchParams(window.location.search);

      // Link expirado ou inválido (o Supabase devolve o erro no hash da URL)
      if (window.location.hash.includes("error")) {
        setStatus("invalido");
        return;
      }

      try {
        const code = query.get("code");
        const tokenHash = query.get("token_hash");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && query.get("type") === "recovery") {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
          if (error) throw error;
        }
      } catch (err) {
        console.error("Erro ao validar link de recuperação:", err);
        setStatus("invalido");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) setStatus("pronto");
    };

    validar();

    const timer = setTimeout(() => {
      setStatus((atual) => (atual === "verificando" ? "invalido" : atual));
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: senha });
    setIsLoading(false);

    if (updateError) {
      setError(`Erro: ${updateError.message}`);
      return;
    }

    setStatus("sucesso");
    setTimeout(() => {
      router.push("/checkin");
      router.refresh();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nova senha</h1>
          <p className="text-slate-500 mt-2 text-sm">Escolha uma nova senha para acessar o sistema</p>
        </div>

        {status === "verificando" && (
          <p className="text-center text-sm text-slate-500">Validando link...</p>
        )}

        {status === "invalido" && (
          <div className="space-y-6">
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium">
              Este link é inválido ou expirou. Solicite um novo link de recuperação.
            </div>
            <Link href="/esqueci-senha" className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
              Solicitar novo link
            </Link>
          </div>
        )}

        {status === "sucesso" && (
          <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md font-medium">
            Senha alterada com sucesso! Redirecionando...
          </div>
        )}

        {status === "pronto" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
