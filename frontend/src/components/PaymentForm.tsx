import React, { useState } from 'react';

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
  loading
}) => {
  const [cardNumber] = useState('4242 •••• •••• 4242');
  const [expiry] = useState('12/28');
  const [cvv] = useState('•••');

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Payment Checkout</h2>
          <p className="text-sm text-slate-400">Mock Card Processing Gateway</p>
        </div>
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/20">
          Sandbox Active
        </span>
      </div>

      <div className="mb-6 space-y-3">
        <label className="text-xs uppercase font-medium text-slate-400 tracking-wider">Card Number</label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={cardNumber}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 font-mono text-sm tracking-widest focus:outline-none"
          />
          <span className="absolute right-4 top-3.5 text-xs text-emerald-400 font-medium">VISA TEST</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs uppercase font-medium text-slate-400 tracking-wider">Expiry</label>
            <input
              type="text"
              readOnly
              value={expiry}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-sm mt-1 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase font-medium text-slate-400 tracking-wider">CVV</label>
            <input
              type="text"
              readOnly
              value={cvv}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 font-mono text-sm mt-1 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 mb-6 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Tickets Reserved ({quantity}x)</span>
          <span className="text-slate-200 font-medium">₹{(totalPriceCents / 100).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Platform Fee & Tax</span>
          <span className="text-emerald-400 font-medium">₹0 (Free)</span>
        </div>
        <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-white">
          <span>Total Payable</span>
          <span className="text-blue-400">₹{(totalPriceCents / 100).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onPay}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Confirming with Bank...</span>
            </>
          ) : (
            <span>Authorize & Pay ₹{(totalPriceCents / 100).toLocaleString('en-IN')}</span>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-sm font-medium transition"
        >
          Cancel Reservation & Release Stock
        </button>
      </div>
    </div>
  );
};
