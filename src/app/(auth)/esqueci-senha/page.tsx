import { FormEsqueciSenha } from "@/components/auth/FormEsqueciSenha";

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recuperar senha</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Informe seu e-mail e enviaremos um link para criar uma nova senha
          </p>
        </div>
        <FormEsqueciSenha />
      </div>
    </div>
  );
}
