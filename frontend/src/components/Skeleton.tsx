/**
 * Skeleton — reusable loading placeholders that mimic real content shapes.
 * Uses Tailwind's animate-pulse with a custom shimmer gradient.
 */

export function EventCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden glass animate-pulse">
      <div className="h-44 bg-slate-700/40" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-700/50 rounded-lg w-3/4" />
        <div className="flex gap-4">
          <div className="h-3 bg-slate-700/40 rounded w-20" />
          <div className="h-3 bg-slate-700/40 rounded w-16" />
        </div>
        <div className="h-3 bg-slate-700/40 rounded w-24" />
        <div className="h-8 bg-slate-700/30 rounded-lg w-28" />
      </div>
    </div>
  );
}

export function EventPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-pulse">
      <div className="rounded-3xl overflow-hidden border border-slate-700/40 bg-slate-900">
        <div className="h-64 bg-gradient-to-r from-slate-800 via-slate-700/50 to-slate-800" />
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="h-20 bg-slate-800/60 rounded-2xl" />
            <div className="h-20 bg-slate-800/60 rounded-2xl" />
          </div>
          <div className="h-px bg-slate-800" />
          <div className="flex justify-between items-center">
            <div className="h-8 bg-slate-800/60 rounded-lg w-32" />
            <div className="h-12 bg-slate-800/60 rounded-xl w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="max-w-xl mx-auto py-12 animate-pulse">
      <div className="bg-slate-800/60 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-700/30">
          <div>
            <div className="h-6 bg-slate-700/50 rounded w-40 mb-2" />
            <div className="h-3 bg-slate-700/40 rounded w-48" />
          </div>
          <div className="h-6 bg-slate-700/40 rounded-full w-24" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/40 rounded w-20" />
          <div className="h-12 bg-slate-700/30 rounded-xl" />
        </div>
        <div className="h-32 bg-slate-700/20 rounded-xl" />
        <div className="h-12 bg-slate-700/40 rounded-xl" />
      </div>
    </div>
  );
}

export default EventCardSkeleton;
