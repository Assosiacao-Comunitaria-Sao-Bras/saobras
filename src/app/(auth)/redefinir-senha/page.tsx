import { FormRedefinirSenha } from "@/components/auth/FormRedefinirSenha";

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-md shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nova senha</h1>
          <p className="text-slate-500 mt-2 text-sm">Escolha uma nova senha para acessar o sistema</p>
        </div>
        <FormRedefinirSenha />
      </div>
    </div>
  );
}
