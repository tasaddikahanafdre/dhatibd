'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, Lock, Clock } from 'lucide-react';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';
  const reason = searchParams.get('reason');

  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear any legacy localStorage auth tokens
  useEffect(() => {
    try {
      localStorage.removeItem('dhati_admin_auth');
    } catch {
      // ignore
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError('Please enter the admin access passcode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect passcode. Please try again.');
      }

      // Hard redirect to the target admin page so middleware reads the new cookie
      window.location.href = from;
    } catch (err: any) {
      setError(err.message || 'Incorrect passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative z-10">
      
      {/* Main Card */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-neutral-800/80 border border-neutral-700/80 rounded-xl flex items-center justify-center mx-auto text-white mb-3 shadow-inner">
            <Shield className="w-6 h-6 text-neutral-200" />
          </div>
          <h1 className="text-lg font-black tracking-wider uppercase block">
            DHATI <span className="text-neutral-500 font-light text-sm">SECURITY</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enter passcode to unlock admin dashboard
          </p>
        </div>

        {/* Inactivity warning banner if locked by timeout */}
        {reason === 'timeout' && !error && (
          <div className="mb-4 p-3 bg-neutral-800/80 border border-neutral-700 text-neutral-300 rounded-xl text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Dashboard locked due to inactivity. Enter passcode to resume.</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase block mb-1.5">
              Admin Passcode
            </label>
            <div className="relative flex items-center">
              <input
                type={showPasscode ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="current-password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                className="w-full text-sm px-3.5 py-3 pr-11 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full py-3 bg-[#eb5a00] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#d04f00] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{loading ? 'Verifying...' : 'Unlock Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <Link
            href="/"
            className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
          >
            ← Back to Storefront
          </Link>
        </div>

      </div>

      {/* Security badge below card */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-neutral-600" /> Server-side Protected Session
        </p>
      </div>

    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative selection:bg-neutral-800 selection:text-white">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <Suspense fallback={<div className="text-xs text-neutral-500">Loading security verification...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
