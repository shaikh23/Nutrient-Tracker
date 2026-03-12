"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ManualEntry {
  meal_name: string;
  estimated_calories: string;
  estimated_protein: string;
  estimated_carbs: string;
  estimated_fat: string;
}

export default function AddMealPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<ManualEntry>({
    meal_name: "",
    estimated_calories: "",
    estimated_protein: "",
    estimated_carbs: "",
    estimated_fat: "",
  });

  async function handleEstimate() {
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/estimate-macros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? "Something went wrong.");
      setShowManual(true);
      return;
    }

    sessionStorage.setItem(
      "pendingMeal",
      JSON.stringify({ ...data, raw_input_text: text })
    );
    router.push("/review");
  }

  function handleManualSubmit() {
    const entry = {
      meal_name: manual.meal_name || "Unnamed meal",
      estimated_calories: parseFloat(manual.estimated_calories) || 0,
      estimated_protein: parseFloat(manual.estimated_protein) || 0,
      estimated_carbs: parseFloat(manual.estimated_carbs) || 0,
      estimated_fat: parseFloat(manual.estimated_fat) || 0,
      ai_notes: "",
      raw_input_text: text,
    };
    sessionStorage.setItem("pendingMeal", JSON.stringify(entry));
    router.push("/review");
  }

  const manualFields: { key: keyof ManualEntry; label: string; unit: string }[] = [
    { key: "estimated_calories", label: "Calories", unit: "kcal" },
    { key: "estimated_protein", label: "Protein", unit: "g" },
    { key: "estimated_carbs", label: "Carbs", unit: "g" },
    { key: "estimated_fat", label: "Fat", unit: "g" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <Link href="/dashboard" className="flex min-h-[44px] min-w-[44px] items-center text-zinc-400 hover:text-zinc-600">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">Add Meal</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Text input */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-zinc-700">
            Describe your meal
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setShowManual(false); setError(null); }}
            rows={4}
            placeholder="e.g. 2 eggs, toast with peanut butter and a glass of milk"
            className="w-full resize-none rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          <p className="mt-2 text-xs text-zinc-400">
            Be as specific as you can — portions, cooking method, sauces, etc.
          </p>
        </div>

        {/* Error + manual fallback trigger */}
        {error && !showManual && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Manual entry form */}
        {showManual && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-medium text-zinc-500">
              AI couldn&apos;t estimate — enter macros manually
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Meal name
                </label>
                <input
                  value={manual.meal_name}
                  onChange={(e) => setManual((p) => ({ ...p, meal_name: e.target.value }))}
                  placeholder="e.g. Scrambled eggs on toast"
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              {manualFields.map(({ key, label, unit }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-20 text-sm font-medium text-zinc-700">
                    {label}
                  </label>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={manual[key]}
                      onChange={(e) => setManual((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-right text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    />
                    <span className="w-8 text-xs text-zinc-400">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-zinc-50 pb-8 pt-4 px-4">
        {!showManual ? (
          <button
            onClick={handleEstimate}
            disabled={!text.trim() || loading}
            className="w-full max-w-sm rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 disabled:opacity-40 active:scale-95"
          >
            {loading ? "Estimating…" : "Estimate Macros"}
          </button>
        ) : (
          <>
            <button
              onClick={handleManualSubmit}
              className="w-full max-w-sm rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 active:scale-95"
            >
              Review & Save
            </button>
            <button
              onClick={handleEstimate}
              disabled={!text.trim() || loading}
              className="text-sm text-zinc-400 hover:text-zinc-600 disabled:opacity-40"
            >
              {loading ? "Estimating…" : "Try AI again"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
