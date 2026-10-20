import { createClient } from "@/lib/supabase/server";
import OperadoresClient from "@/components/operadores/OperadoresClient";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function OperadoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: operadores, error } = await supabase
    .from("operadores")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-100">
          Erro ao carregar operadores: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <OperadoresClient operadores={operadores || []} />
    </div>
  );
}
