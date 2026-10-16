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
  Shield,
  LayoutDashboard,
  FileText,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { name: "Gestão de Alunos", href: "/alunos", icon: Users },
  { name: "Matrículas", href: "/matriculas", icon: GraduationCap },
  { name: "Frequência e Check-in", href: "/checkin", icon: CheckSquare },
  { name: "Cursos e Turmas", href: "/cursos", icon: BookOpen },
  { name: "Dashboard", href: "/historico", icon: LayoutDashboard },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Operadores", href: "/operadores", icon: Shield },
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
    <aside className="app-sidebar relative sticky top-0 flex h-screen w-[270px] shrink-0 flex-col overflow-hidden text-white">
      <div className="absolute inset-0 bg-[#202044]" />
      <div className="pointer-events-none absolute -right-24 top-44 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-5 pb-5 pt-5">
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          <Image
            src="/logos/prefeitura-feira.png"
            alt="Prefeitura de Feira de Santana"
            width={320}
            height={130}
            priority
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4">
          <Image
            src="/logos/fundacao-sem-fundo.png"
            alt="Fundação Municipal Egberto Costa"
            width={220}
            height={100}
            className="mx-auto h-auto max-h-[88px] w-full object-contain"
          />

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f4c430]" />
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
              Sistema do Polo Digital
            </span>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-3 pt-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/60">
          Menu principal
        </p>
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-4">
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
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3.5 text-[13px] transition-all duration-200 ${
                active
                  ? "bg-white font-bold text-[#202044] shadow-lg shadow-black/10"
                  : "font-medium text-blue-100/75 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#f4c430]" />
              )}

              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-[#202044] text-[#f4c430]"
                    : "bg-white/[0.07] text-blue-200 group-hover:bg-white/[0.12] group-hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
              </span>

              <span className="min-w-0 flex-1 leading-tight">
                {item.name}
              </span>

              {active && (
                <ChevronRight size={16} className="shrink-0 text-[#202044]/60" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-blue-100/80 transition-colors hover:bg-rose-500/15 hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.07]">
            <LogOut size={17} />
          </span>
          Sair do sistema
        </button>

        <div className="mt-3 rounded-xl bg-white/[0.05] px-3 py-3">
          <p className="text-[10px] font-semibold leading-relaxed text-blue-100/50">
            PREFEITURA DE FEIRA DE SANTANA
          </p>
          <p className="mt-1 text-xs font-medium text-white/80">
            Polo de Ciência e Tecnologia
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-[#f4c430]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
