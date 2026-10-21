import type { GraficoRelatorio } from "@/lib/relatorios-exportacao";

export function GraficosRelatorio({ graficos }: { graficos: GraficoRelatorio[] }) {
  if (!graficos.length) return null;
  return <div className="grid items-start gap-4 xl:grid-cols-2">
    {graficos.map((grafico) => {
      const maximo = Math.max(1, ...grafico.itens.map((item) => item.presencas + item.faltas));
      return <section key={grafico.id} className="rounded-xl border border-slate-200 bg-white p-5" aria-label={grafico.titulo}>
        <h2 className="font-semibold text-slate-900">{grafico.titulo}</h2>
        <p className="mt-1 text-xs text-slate-500">{grafico.descricao}</p>
        <div className="my-4 flex gap-4 text-xs text-slate-600"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Presenças</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />Faltas</span></div>
        <div className="space-y-4">{grafico.itens.map((item, indice) => <div key={`${item.rotulo}-${indice}`}>
          <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs"><span className="min-w-0 break-words font-medium text-slate-700">{item.rotulo}</span><span className="text-slate-500">{item.presencas} presença(s) · {item.faltas} falta(s)</span></div>
          <div role="img" aria-label={`${item.rotulo}: ${item.presencas} presenças e ${item.faltas} faltas`} className="flex h-3 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-500" style={{ width: `${item.presencas / maximo * 100}%` }} /><div className="bg-red-500" style={{ width: `${item.faltas / maximo * 100}%` }} /></div>
        </div>)}</div>
      </section>;
    })}
  </div>;
}
