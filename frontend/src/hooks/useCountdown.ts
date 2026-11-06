/**
 * useCountdown — calculates time remaining until a target date.
 * Re-renders every second while the countdown is active.
 */

import { useEffect, useState } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
}

export function useCountdown(targetDate: Date | string | undefined): CountdownResult {
  const target = targetDate ? new Date(targetDate).getTime() : 0;

  const calcRemaining = (): CountdownResult => {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const totalSeconds = Math.floor(diff / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isExpired: diff <= 0,
      totalSeconds,
    };
  };

  const [remaining, setRemaining] = useState<CountdownResult>(calcRemaining);

  useEffect(() => {
    if (!target) return;

    // Immediately recalculate when target changes
    setRemaining(calcRemaining());

    const interval = setInterval(() => {
      const next = calcRemaining();
      setRemaining(next);

      // Stop ticking once expired
      if (next.isExpired) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return remaining;
}
