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
    <aside className="app-sidebar relative sticky top-0 z-20 flex h-dvh min-h-0 w-[76px] shrink-0 flex-col overflow-hidden text-white lg:w-[232px] xl:w-[248px]">
      <div className="sidebar-glow pointer-events-none absolute -right-24 top-48 h-64 w-64 rounded-full" />

      {/* LOGOTIPOS (só em telas a partir de lg) */}
      <div className="relative shrink-0 px-3 pt-4 lg:px-[24px] lg:pt-[20px]">
        <div className="hidden lg:block">
          <div className="flex h-[58px] items-center justify-center">
            <Image
              src="/logos/prefeitura-feira.png"
              alt="Prefeitura de Feira de Santana"
              width={190}
              height={75}
              priority
              className="h-auto max-h-[58px] w-full max-w-[165px] object-contain brightness-0 invert"
            />
          </div>

          <div className="mt-[12px] flex h-[42px] items-center justify-center">
            <Image
              src="/logos/fundacao-sem-fundo.png"
              alt="Fundação Municipal Egberto Costa"
              width={190}
              height={65}
              priority
              className="h-auto max-h-[40px] w-full max-w-[165px] object-contain brightness-0 invert"
            />
          </div>
        </div>

        <div className="mt-2 border-t border-white/20 lg:mt-[14px]" />

        <div className="flex h-[43px] items-center justify-center gap-[10px] lg:justify-start">
          <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#ffcf32]" />
          <span className="hidden whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.01em] lg:inline">
            Sistema do Polo Digital
          </span>
        </div>
      </div>

      {/* MENU: ocupa o espaço que sobra e rola se a tela for baixa */}
      <nav className="relative flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto overflow-x-hidden px-2 pb-2 lg:px-[12px]">
        {menuItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-[44px] min-h-[44px] items-center justify-center gap-[13px] rounded-[9px] px-0 text-[13px] transition-colors duration-200 lg:justify-start lg:px-[19px] ${
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
                  size={22}
                  strokeWidth={1.9}
                  className="text-white"
                  aria-hidden="true"
                />
              </span>

              <span className="hidden whitespace-nowrap leading-none lg:inline">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* RODAPÉ sempre visível */}
      <div className="relative shrink-0 px-2 pb-4 lg:px-[12px] lg:pb-[22px]">
        <div className="border-t border-white/20" />

        <button
          type="button"
          onClick={handleLogout}
          title="Sair do sistema"
          className="mt-[10px] flex h-[43px] w-full items-center justify-center gap-[13px] rounded-[9px] px-0 text-[13px] font-medium text-white transition-colors hover:bg-white/10 lg:justify-start lg:px-[19px]"
        >
          <span className="flex w-[22px] shrink-0 items-center justify-center">
            <LogOut size={22} strokeWidth={1.9} />
          </span>
          <span className="hidden whitespace-nowrap lg:inline">
            Sair do sistema
          </span>
        </button>

        <div className="mt-[16px] hidden px-[17px] lg:block [@media(min-height:700px)]:mt-[20px]">
          <p className="text-[10px] leading-[15px] text-white/75">
            Prefeitura de Feira de Santana
          </p>

          <p className="text-[10px] leading-[15px] font-medium text-white">
            Polo de Ciência e Tecnologia
          </p>

          <div className="mt-[9px] flex h-[4px] w-full overflow-hidden rounded-full bg-white/30">
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
