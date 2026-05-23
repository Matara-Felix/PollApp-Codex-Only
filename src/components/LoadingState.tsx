export default function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-soft">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        {label}
      </div>
    </div>
  );
}
