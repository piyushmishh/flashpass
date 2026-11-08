import React, { useState } from 'react';
import { Smartphone, CreditCard, Landmark, ShieldCheck, Lock, QrCode } from 'lucide-react';

interface PaymentFormProps {
  orderId: string;
  totalPriceCents: number;
  quantity: number;
  onSuccess: () => void;
  onCancel: () => void;
  onPay: () => Promise<void>;
  loading: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  totalPriceCents,
  quantity,
  onPay,
  onCancel,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('piyush@okaxis');
  const [cardNumber] = useState('4242 •••• •••• 4242');
  const [expiry] = useState('08/28');
  const [cvv] = useState('•••');

  const basePrice = (totalPriceCents / 100);
  const gstAmount = Math.round(basePrice * 0.18);
  const bookingFee = 150;
  const totalPayable = basePrice + gstAmount + bookingFee;

  return (
    <div className="bg-[#111320] border border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Payment Checkout</h2>
          <p className="text-xs text-slate-400 mt-0.5">256-Bit Encrypted Payment Session</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sandbox Mode</span>
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-[#161826] border border-white/[0.06] rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('upi')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'upi'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>UPI / QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'card'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Card</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('netbanking')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'netbanking'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>NetBanking</span>
        </button>
      </div>

      {/* Tab 1: UPI */}
      {activeTab === 'upi' && (
        <div className="space-y-4 p-4 rounded-2xl bg-[#161826]/60 border border-white/[0.04]">
          <div className="space-y-2">
            <label className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">
              Virtual Payment Address (VPA)
            </label>
            <div className="relative">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full bg-[#0D0F18] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="absolute right-3.5 top-3 text-[11px] text-emerald-400 font-bold uppercase font-mono">
                Verified
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span>Instant QR Code scan supported on PhonePe / GPay</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cards */}
      {activeTab === 'card' && (
        <div className="space-y-4 p-4 rounded-2xl bg-[#161826]/60 border border-white/[0.04]">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Card Number</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={cardNumber}
                className="w-full bg-[#0D0F18] border border-white/10 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm tracking-widest focus:outline-none"
              />
              <span className="absolute right-4 top-3 text-xs text-emerald-400 font-semibold font-mono">VISA TEST</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Expiry</label>
              <input
                type="text"
                readOnly
                value={expiry}
                className="w-full bg-[#0D0F18] border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">CVV</label>
              <input
                type="text"
                readOnly
                value={cvv}
                className="w-full bg-[#0D0F18] border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: NetBanking */}
      {activeTab === 'netbanking' && (
        <div className="p-4 rounded-2xl bg-[#161826]/60 border border-white/[0.04] space-y-3">
          <label className="text-[11px] uppercase font-mono text-slate-400 tracking-wider">Popular Banks</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b, i) => (
              <div
                key={b}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  i === 0
                    ? 'border-purple-500/50 bg-purple-500/10 text-white'
                    : 'border-white/5 bg-[#0D0F18] text-slate-400 hover:text-white'
                }`}
              >
                <span>{b}</span>
                {i === 0 && <span className="w-2 h-2 rounded-full bg-purple-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="bg-[#161826] p-5 rounded-2xl border border-white/[0.06] space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Tickets Allocation ({quantity}x Pass)</span>
          <span className="text-slate-200 font-medium">₹{basePrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Integrated GST @ 18%</span>
          <span className="text-slate-300">₹{gstAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Booking & Gate Scanner Fee</span>
          <span className="text-slate-300">₹{bookingFee}</span>
        </div>
        <div className="pt-3 border-t border-white/[0.08] flex justify-between text-sm font-extrabold text-white">
          <span>Total Amount Payable</span>
          <span className="text-purple-400 text-base">₹{totalPayable.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onPay}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Contacting Issuing Gateway...</span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Pay ₹{totalPayable.toLocaleString('en-IN')}
            </span>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full py-3 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
        >
          Release Reservation & Return to Discovery
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;
