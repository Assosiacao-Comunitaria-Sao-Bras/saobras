"use client";

import { useEffect, useState } from "react";
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
  Home,
  Menu,
  History,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard Interativo", href: "/dashboard", icon: Home },
  { name: "Gestão de Alunos", href: "/alunos", icon: Users },
  { name: "Matrículas", href: "/matriculas", icon: GraduationCap },
  { name: "Frequência e Check-in", href: "/checkin", icon: CheckSquare },
  { name: "Cursos e Turmas", href: "/cursos", icon: BookOpen },
  { name: "Operadores", href: "/operadores", icon: ShieldCheck },
  { name: "Atividades", href: "/auditoria", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Fecha o menu do celular com a tecla Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      {/* Botão hambúrguer (só no celular) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-[44px] top-[11px] z-30 flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 bg-white text-[#1674d2] shadow-sm md:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Fundo escuro atrás do menu (só no celular) */}
      {open && (
        <div
          className="fixed inset-0 z-[35] bg-slate-900/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar fixed left-0 top-0 z-40 flex h-dvh min-h-0 w-[272px] max-w-[85vw] flex-col overflow-hidden text-white transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:z-20 md:w-[76px] md:shrink-0 md:translate-x-0 lg:w-[232px] xl:w-[248px]`}
      >
        <div className="sidebar-glow pointer-events-none absolute -right-24 top-48 h-64 w-64 rounded-full" />

        {/* Fechar (só no celular) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          <X size={22} />
        </button>

        {/* LOGOTIPOS */}
        <div className="sidebar-brand relative shrink-0 px-6 pt-5 md:px-3 md:pt-4 lg:px-[24px] lg:pt-[20px]">
          <div className="block md:hidden lg:block">
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

          <div className="mt-[14px] border-t border-white/20 md:mt-2 lg:mt-[14px]" />

          <div className="flex h-[43px] items-center justify-start gap-[10px] md:justify-center lg:justify-start">
            <span className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#ffcf32]" />
            <span className="inline whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.01em] md:hidden lg:inline">
              Sistema do Polo Digital
            </span>
          </div>
        </div>

        {/* MENU */}
        <nav className="relative flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto overflow-x-hidden px-3 pb-2 md:px-2 lg:px-[12px]">
          {menuItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-[48px] min-h-[48px] items-center justify-start gap-[13px] rounded-[9px] px-[19px] text-[14px] transition-colors duration-200 md:h-[44px] md:min-h-[44px] md:justify-center md:px-0 md:text-[13px] lg:justify-start lg:px-[19px] ${
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

                <span className="inline whitespace-nowrap leading-none md:hidden lg:inline">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* RODAPÉ */}
        <div className="relative shrink-0 px-3 pb-4 md:px-2 lg:px-[12px] lg:pb-[22px]">
          <div className="border-t border-white/20" />

          <button
            type="button"
            onClick={handleLogout}
            title="Sair do sistema"
            className="mt-[10px] flex h-[46px] w-full items-center justify-start gap-[13px] rounded-[9px] px-[19px] text-[14px] font-medium text-white transition-colors hover:bg-white/10 md:h-[43px] md:justify-center md:px-0 md:text-[13px] lg:justify-start lg:px-[19px]"
          >
            <span className="flex w-[22px] shrink-0 items-center justify-center">
              <LogOut size={22} strokeWidth={1.9} />
            </span>
            <span className="inline whitespace-nowrap md:hidden lg:inline">
              Sair do sistema
            </span>
          </button>

          <div className="mt-[16px] block px-[17px] md:hidden lg:block">
            <p className="text-[10px] leading-[15px] text-white/75">
              Prefeitura de Feira de Santana
            </p>

            <p className="text-[10px] font-medium leading-[15px] text-white">
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
    </>
  );
}
