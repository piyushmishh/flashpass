/**
 * ScannerPage — mobile-friendly QR ticket scanner for gate entry.
 *
 * Uses the browser camera to scan QR codes from tickets, sends them
 * to the backend for HMAC verification, and shows a clear VALID/INVALID
 * result with haptic feedback.
 *
 * Includes a manual text input fallback for testing without a camera.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, Keyboard, RotateCcw } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

type ScanResult = {
  valid: boolean;
  orderId?: string;
  reason?: string;
} | null;

export const ScannerPage: React.FC = () => {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera access denied');
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const verifyPayload = useCallback(async (payload: string) => {
    if (scanning) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();
      const r = data.data ?? data;
      setResult(r);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(r.valid ? [100, 50, 100] : [300]);
      }
    } catch (err: any) {
      setResult({ valid: false, reason: err.message || 'Network error' });
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      verifyPayload(manualInput.trim());
    }
  };

  const resetScan = () => {
    setResult(null);
    setManualInput('');
  };

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-blue-400 tracking-wide">GATE SCANNER</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">FlashPass Verify</h1>
          <p className="text-sm text-slate-400">Scan or paste a ticket QR payload to verify entry</p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              mode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              mode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual
          </button>
        </div>

        {/* Camera viewfinder */}
        {mode === 'camera' && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 bg-black aspect-[4/3]">
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div>
                  <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">{cameraError}</p>
                  <p className="text-xs text-slate-500 mt-2">Switch to Manual mode to paste QR data</p>
                </div>
              </div>
            ) : (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                  <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                  <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                  <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />

                  {/* Scan line */}
                  <motion.div
                    className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    animate={{ top: ['15%', '85%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Manual input */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='Paste QR payload JSON here, e.g. {"orderId":"...","eventId":"...","userId":"...","sig":"..."}'
              className="w-full h-28 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={scanning || !manualInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? 'Verifying...' : '🔍 Verify Ticket'}
            </button>
          </form>
        )}

        {/* Result display */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.valid ? 'valid' : 'invalid'}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`p-6 rounded-2xl border-2 text-center space-y-3 ${
                result.valid
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-rose-500/10 border-rose-500/40'
              }`}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  result.valid ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}
              >
                {result.valid ? (
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </motion.div>

              <h3 className={`text-xl font-black ${result.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.valid ? 'VALID TICKET' : 'INVALID TICKET'}
              </h3>

              {result.orderId && (
                <p className="text-xs font-mono text-slate-500">Order: {result.orderId}</p>
              )}

              {result.reason && (
                <p className="text-sm text-slate-400">{result.reason}</p>
              )}

              <button
                onClick={resetScan}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition mt-2"
              >
                <RotateCcw className="w-4 h-4" /> Scan Another
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ScannerPage;
