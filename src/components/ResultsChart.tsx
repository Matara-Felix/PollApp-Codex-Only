import type { PollResults } from '../types/database';

export default function ResultsChart({ results }: { results: PollResults }) {
  return (
    <div className="space-y-4">
      {results.options.map((option) => (
        <div key={option.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="min-w-0 break-words font-medium text-slate-800">{option.text}</p>
            <p className="shrink-0 text-sm font-semibold text-slate-600">
              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="bar-fill h-full rounded-full bg-blue-600"
              style={{ width: `${option.percentage}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-semibold text-blue-700">{option.percentage}%</p>
        </div>
      ))}
      <div className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        Total votes: {results.totalVotes}
      </div>
    </div>
  );
}
