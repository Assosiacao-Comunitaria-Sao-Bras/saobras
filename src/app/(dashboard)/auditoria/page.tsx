import { createClient } from "@/lib/supabase/server";
import AuditoriaClient from "@/components/auditoria/AuditoriaClient";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full">
      <AuditoriaClient />
    </div>
  );
}