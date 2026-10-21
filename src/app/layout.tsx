import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeSettings } from "@/components/layout/ThemeSettings";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistema de Frequência",
  description: "Gestão de oficinas do instituto",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.className} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("saobras-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}` }} />
      </head>
      <body className="bg-slate-50 text-slate-900 text-sm antialiased min-h-screen"
      suppressHydrationWarning>
        <ThemeSettings />
        {children}
      </body>
    </html>
  );
}
