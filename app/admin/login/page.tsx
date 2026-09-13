"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") ? next : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] text-[#163b4d]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#63c7d8]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#ff735c]/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-[#dbecef] bg-white shadow-[0_24px_70px_rgba(22,59,77,.12)] md:grid-cols-[.9fr_1.1fr]">
          <section className="hidden bg-[#123f52] p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff735c] text-lg font-black">C</span>
                <span className="text-xl font-black">Cinevero</span>
              </Link>
              <div className="mt-16 max-w-xs">
                <p className="text-xs font-black uppercase tracking-[.22em] text-[#8de0e8]">Private area</p>
                <h1 className="mt-3 text-4xl font-black leading-tight">Cinevero Control Center</h1>
                <p className="mt-4 text-sm leading-6 text-white/70">Analytics, SEO, indexing and production controls in one secure dashboard.</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-white/50">Cinevero · Admin</p>
          </section>

          <section className="p-6 sm:p-10 md:p-12">
            <div className="mb-8 md:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff735c] text-lg font-black text-white">C</span>
                <span className="text-lg font-black">Cinevero</span>
              </Link>
            </div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#ef624d]">Admin access</p>
            <h2 className="mt-2 text-3xl font-black">Welcome back</h2>
            <p className="mt-2 text-sm text-[#607d8b]">Sign in to manage Cinevero.</p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#55717e]">Username</span>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78909c]" size={18} />
                  <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required className="h-13 w-full rounded-2xl border border-[#dbecef] bg-[#f8fcfc] pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#63c7d8] focus:ring-4 focus:ring-[#63c7d8]/15" placeholder="Admin username" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#55717e]">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78909c]" size={18} />
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-13 w-full rounded-2xl border border-[#dbecef] bg-[#f8fcfc] pl-12 pr-12 text-sm font-semibold outline-none transition focus:border-[#63c7d8] focus:ring-4 focus:ring-[#63c7d8]/15" placeholder="Your password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78909c] hover:text-[#163b4d]">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
              </label>

              {error && <div className="rounded-2xl border border-[#ff735c]/30 bg-[#fff1ed] px-4 py-3 text-sm font-bold text-[#c84d3c]">{error}</div>}

              <button disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff735c] px-5 text-sm font-black text-white shadow-lg shadow-[#ff735c]/20 transition hover:-translate-y-0.5 hover:bg-[#f56851] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight size={17}/>} 
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
