import { meta, sources } from "@/domain/repository";

export default function SourcesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-900">근거 법령·출처</h1>
      <p className="text-sm text-slate-600">데이터 기준일: {meta.dataAsOf}</p>
      <div className="space-y-2">
        {sources.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{s.name}</span>
              {s.effectiveOn && <span className="text-xs text-slate-400">시행 {s.effectiveOn}</span>}
            </div>
            {s.note && <p className="text-xs text-slate-500">{s.note}</p>}
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                원문 보기 ↗
              </a>
            )}
          </div>
        ))}
      </div>
      {meta.notes && (
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
          <h2 className="text-sm font-bold text-slate-700 mb-1">데이터 메모</h2>
          <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
            {meta.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
