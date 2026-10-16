import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell flex min-h-screen bg-[#f3f8ff]">
      <Sidebar />

      <div className="app-workspace min-w-0 flex-1">
        <header className="app-topbar sticky top-0 z-10 flex h-[66px] items-center justify-between gap-4 border-b border-blue-100 bg-white/95 px-5 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2d98eb] text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M3 10.5 12 4l9 6.5M5.5 9.5V20h13V9.5M9 20v-6h6v6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#2d98eb]">
                POLO DE CIÊNCIA E TECNOLOGIA
              </p>
              <p className="truncate text-sm font-bold text-[#202044]">
                São Brás · Feira de Santana
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-2 text-xs font-medium text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Sistema de gestão
          </div>
        </header>

        <main className="app-main min-w-0 px-3 pb-8 pt-5 sm:px-5 sm:pt-6 lg:px-7 lg:pt-7">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
