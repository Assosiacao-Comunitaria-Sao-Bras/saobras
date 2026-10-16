import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell flex min-h-screen bg-[#f4f6fb]">
      <Sidebar />

      <main className="app-main min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-9 lg:pt-8">
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
