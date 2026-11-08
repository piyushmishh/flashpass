/**
 * ProofOfWork — browser-side SHA-256 challenge solver.
 *
 * Fetches a challenge from the server, then iterates nonces until it
 * finds a hash that starts with the required number of leading zeros.
 * Uses batched setTimeout loops to keep the UI responsive.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface PowSolution {
  nonce: string;
  hash: string;
  challenge: string;
}

interface Props {
  onSolved: (solution: PowSolution) => void;
  difficulty?: number;
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function ProofOfWork({ onSolved, difficulty: propDifficulty }: Props) {
  const [challenge, setChallenge] = useState<string | null>(null);
  const [diff, setDiff] = useState(propDifficulty ?? 4);
  const [hashCount, setHashCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Fetch challenge on mount
  useEffect(() => {
    cancelRef.current = false;
    fetch('/api/pow/challenge')
      .then((r) => r.json())
      .then((data) => {
        const d = data.data ?? data;
        setChallenge(d.challenge);
        setDiff(d.difficulty ?? propDifficulty ?? 4);
      })
      .catch(() => {
        // If the endpoint isn't available, auto-solve with a dummy
        setChallenge('offline-' + Date.now().toString(36));
        setDiff(2); // easy difficulty offline
      });

    return () => {
      cancelRef.current = true;
    };
  }, [propDifficulty]);

  // Solve loop
  const solve = useCallback(async () => {
    if (!challenge) return;

    const prefix = '0'.repeat(diff);
    let nonce = 0;
    const BATCH = 500;

    const loop = async () => {
      for (let i = 0; i < BATCH; i++) {
        if (cancelRef.current) return;
        const hash = await sha256(challenge + nonce);
        nonce++;

        if (hash.startsWith(prefix)) {
          setSolved(true);
          setHashCount(nonce);
          onSolved({
            nonce: (nonce - 1).toString(),
            hash,
            challenge,
          });
          return;
        }
      }

      setHashCount(nonce);

      if (!cancelRef.current) {
        setTimeout(loop, 0);
      }
    };

    loop().catch((e) => setError(e.message));
  }, [challenge, diff, onSolved]);

  useEffect(() => {
    if (challenge && !solved) {
      solve();
    }
  }, [challenge, solved, solve]);

  if (solved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-emerald-400">Verified Human</span>
          <span className="text-xs text-slate-500 ml-2">{hashCount.toLocaleString()} hashes</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
        Challenge failed: {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 rounded-xl glass border border-blue-500/20 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-slate-200">Verifying you're human...</p>
          <p className="text-xs text-slate-500 font-mono">{hashCount.toLocaleString()} hashes computed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
          animate={{ width: `${Math.min(95, (hashCount / 50000) * 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

export default ProofOfWork;
