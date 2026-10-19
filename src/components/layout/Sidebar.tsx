
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
    <aside className="app-sidebar relative sticky top-0 z-20 flex h-screen min-h-[650px] w-[248px] shrink-0 flex-col overflow-hidden text-white">
      {/* Brilho discreto do fundo */}
      <div className="sidebar-glow pointer-events-none absolute -right-24 top-48 h-64 w-64 rounded-full" />

      {/* Logos e identificação */}
      <div className="relative shrink-0 px-[29px] pt-[23px]">
        <div className="flex h-[68px] items-center justify-center">
          <Image
            src="/logos/prefeitura-feira.png"
            alt="Prefeitura de Feira de Santana"
            width={220}
            height={90}
            priority
            className="h-auto max-h-[68px] w-full max-w-[190px] object-contain brightness-0 invert"
          />
        </div>

        <div className="mt-[17px] flex h-[53px] items-center justify-center">
          <Image
            src="/logos/fundacao-sem-fundo.png"
            alt="Fundação Municipal Egberto Costa"
            width={220}
            height={75}
            priority
            className="h-auto max-h-[49px] w-full max-w-[190px] object-contain brightness-0 invert"
          />
        </div>

        <div className="mt-[17px] border-t border-white/20" />

        <div className="flex h-[51px] items-center gap-[10px]">
          <span className="h-[11px] w-[11px] shrink-0 rounded-full bg-[#ffcf32]" />
          <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.01em]">
            Sistema do Polo Digital
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="relative flex-1 space-y-[5px] overflow-y-auto overflow-x-hidden px-[12px] pb-4">
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
              className={`group relative flex h-[48px] min-h-[48px] items-center gap-[13px] rounded-[9px] px-[19px] text-[13px] transition-colors duration-200 ${
                active
                  ? "bg-[#3198e8] font-semibold text-white"
                  : "font-medium text-white hover:bg-white/10"
              }`}
            >
              {active && (
                <span className="absolute bottom-0 left-0 top-0 w-[4px] rounded-l-[9px] bg-[#ffcf32]" />
              )}

              <span className="flex w-[22px] shrink-0 items-center justify-center">
                <Icon
                  size={23}
                  strokeWidth={1.9}
                  className="text-white"
                  aria-hidden="true"
                />
              </span>

              <span className="whitespace-nowrap leading-none">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="relative shrink-0 px-[12px] pb-[65px]">
        <div className="border-t border-white/20" />

        <button
          type="button"
          onClick={handleLogout}
          className="mt-[13px] flex h-[47px] w-full items-center gap-[13px] rounded-[9px] px-[19px] text-[13px] font-medium text-white transition-colors hover:bg-white/10"
        >
          <span className="flex w-[22px] shrink-0 items-center justify-center">
            <LogOut size={22} strokeWidth={1.9} />
          </span>
          <span className="whitespace-nowrap">Sair do sistema</span>
        </button>

        <div className="mt-[24px] px-[17px]">
          <p className="text-[10px] leading-[15px] text-white/75">
            Prefeitura de Feira de Santana
          </p>

          <p className="text-[10px] leading-[15px] font-medium text-white">
            Polo de Ciência e Tecnologia
          </p>

          <div className="mt-[11px] flex h-[4px] w-full overflow-hidden rounded-full bg-white/30">
            <span className="w-[20%] bg-[#ffcf32]" />
            <span className="w-[17%] bg-[#f59e35]" />
            <span className="w-[17%] bg-[#f47c35]" />
            <span className="w-[17%] bg-[#31a9e0]" />
            <span className="w-[29%] bg-white/55" />
          </div>
        </div>
      </div>
    </aside>
  );
}
