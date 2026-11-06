/**
 * CountdownTimer — dramatic flip-clock style countdown display.
 * Turns red with urgency when under 60 seconds.
 */

import { useCountdown } from '@/hooks/useCountdown';
import clsx from 'clsx';

interface Props {
  targetDate?: string;
  dropTime?: string | Date;
  label?: string;
  compact?: boolean;
}

export function CountdownTimer({ targetDate, dropTime, label, compact }: Props) {
  const dateStr = dropTime ? (dropTime instanceof Date ? dropTime.toISOString() : dropTime) : (targetDate || new Date().toISOString());
  const { days, hours, minutes, seconds, isExpired, totalSeconds } =
    useCountdown(dateStr);

  // Under 60 seconds — red urgency
  const isUrgent = !isExpired && totalSeconds < 60;

  if (isExpired) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-bold text-base tracking-wide">
            DROP IS LIVE!
          </span>
        </div>
      </div>
    );
  }

  const units = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Mins' },
    { value: seconds, label: 'Secs' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </span>
      )}

      <div className="flex items-center gap-2 md:gap-3">
        {units.map(({ value, label: unitLabel }, i) => (
          <div key={unitLabel} className="flex items-center gap-2 md:gap-3">
            <div
              className={clsx(
                'flex flex-col items-center justify-center rounded-xl font-mono font-bold transition-colors',
                compact
                  ? 'w-12 h-12 text-lg bg-slate-800/80 border border-slate-700/60'
                  : 'w-16 h-16 md:w-20 md:h-20 text-2xl md:text-3xl bg-slate-800/90 border border-slate-700/80 shadow-lg',
                isUrgent && 'border-rose-500/50 bg-rose-500/10 text-rose-400'
              )}
            >
              <span
                className={clsx(
                  'tabular-nums transition-transform duration-200',
                  isUrgent ? 'text-rose-400' : 'text-slate-100'
                )}
              >
                {String(value).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-sans text-slate-400 -mt-1 font-normal">
                {unitLabel}
              </span>
            </div>

            {i < units.length - 1 && (
              <span
                className={clsx(
                  'text-lg font-bold select-none',
                  isUrgent ? 'text-rose-400' : 'text-slate-500'
                )}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CountdownTimer;
