/**
 * LiveStockBadge — real-time stock counter via WebSocket.
 * Color-coded progress bar that shifts from green → red as stock depletes.
 */

import { useWebSocket } from '@/hooks/useWebSocket';
import { Lock, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  eventId?: string;
  initialStock?: number;
  initialTotal?: number;
  currentStock?: number;
  totalStock?: number;
}

export function LiveStockBadge({
  eventId = '',
  initialStock,
  initialTotal,
  currentStock: propStock,
  totalStock: propTotal,
}: Props) {
  const { currentStock: wsStock, totalStock: wsTotal, isConnected } =
    useWebSocket(eventId);

  // Prefer WebSocket data, fall back to props
  const stock = wsStock ?? propStock ?? initialStock ?? 0;
  const total = wsTotal ?? propTotal ?? initialTotal ?? (stock > 0 ? stock : 500);
  const pct = total > 0 ? (stock / total) * 100 : 0;
  const isSoldOut = stock <= 0;

  // Progressive color based on remaining percentage
  const colorClass = isSoldOut
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    : pct > 50
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : pct > 20
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const barColorClass = isSoldOut
    ? 'bg-rose-500'
    : pct > 50
    ? 'bg-emerald-500'
    : pct > 20
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border',
            colorClass
          )}
        >
          {isSoldOut ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>SOLD OUT</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tabular-nums font-mono font-bold">
                {stock.toLocaleString()}
              </span>
              <span className="text-slate-400 font-normal">
                / {total.toLocaleString()} passes left
              </span>
            </>
          )}
        </div>

        {eventId && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline font-mono">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline font-mono">Syncing</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Visual progress bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            barColorClass
          )}
          style={{ width: `${Math.max(pct, isSoldOut ? 0 : 3)}%` }}
        />
      </div>
    </div>
  );
}

export default LiveStockBadge;
