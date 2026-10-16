
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  CheckSquare,
  LogOut,
  GraduationCap,
  ShieldCheck,
  FileText,
  Home,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/historico", icon: Home },
  { name: "Gestão de Alunos", href: "/alunos", icon: Users },
  { name: "Matrículas", href: "/matriculas", icon: GraduationCap },
  { name: "Frequência e Check-in", href: "/checkin", icon: CheckSquare },
  { name: "Cursos e Turmas", href: "/cursos", icon: BookOpen },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Operadores", href: "/operadores", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="app-sidebar sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-hidden text-white">
      <div className="sidebar-glow pointer-events-none absolute -right-20 top-36 h-64 w-64 rounded-full" />

      <div className="relative border-b border-white/15 px-4 pb-4 pt-4">
        <div className="flex min-h-[60px] items-center justify-center rounded-lg bg-white px-3 py-2">
          <Image
            src="/logos/prefeitura-feira.png"
            alt="Prefeitura de Feira de Santana"
            width={220}
            height={80}
            priority
            className="h-auto max-h-[45px] w-full max-w-[150px] object-contain"
          />
        </div>

        <div className="mt-2 flex min-h-[43px] items-center justify-center px-3 py-1">
          <Image
            src="/logos/fundacao-sem-fundo.png"
            alt="Fundação Municipal Egberto Costa"
            width={160}
            height={60}
            className="h-auto max-h-[30px] w-full max-w-[110px] object-contain opacity-70"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 px-1">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#f4c430]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            Sistema do Polo Digital
          </span>
        </div>
      </div>

      <div className="relative px-5 pb-3 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">
          Menu principal
        </p>
      </div>

      <nav className="relative flex-1 space-y-2 overflow-y-auto px-3 pb-5">
        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-3 text-[13px] transition-colors ${
                active
                  ? "bg-white/20 font-bold text-white ring-1 ring-white/15"
                  : "font-medium text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[#f4c430]" />
              )}

              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active
                    ? "bg-white/15 text-[#ffe16b]"
                    : "text-white/90 group-hover:bg-white/10"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1 leading-snug">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/15 px-3 pb-3 pt-3">
        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white/90 hover:bg-white/10"
        >
          <LogOut size={18} />
          <span>Sair do sistema</span>
        </button>

        <div className="mt-3 px-3 pb-1">
          <p className="text-[10px] leading-relaxed text-white/75">
            Prefeitura de Feira de Santana
          </p>
          <p className="text-[10px] leading-relaxed text-white">
            Polo de Ciência e Tecnologia
          </p>
          <div className="mt-2 flex h-[3px] overflow-hidden rounded-full bg-white/20">
            <span className="w-1/4 bg-[#f4c430]" />
            <span className="w-1/4 bg-[#f59e0b]" />
            <span className="w-1/4 bg-[#38bdf8]" />
            <span className="flex-1 bg-white/50" />
          </div>
        </div>
      </div>
    </aside>
  );
}
