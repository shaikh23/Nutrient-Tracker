"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = mode === "signin" ? signIn : signUp;
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-zinc-900">
          Macro Tracker
        </h1>

        {/* Tab toggle */}
        <div className="mb-6 flex rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
