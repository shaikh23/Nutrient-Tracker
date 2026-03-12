"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Estimate {
  meal_name: string;
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
  ai_notes: string;
  raw_input_text: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingMeal");
    if (!raw) {
      router.replace("/add");
      return;
    }
    setEstimate(JSON.parse(raw));
  }, [router]);

  function updateField(field: keyof Estimate, value: string | number) {
    setEstimate((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!estimate) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { error: dbError } = await supabase.from("meal_entries").insert({
      user_id: user.id,
      meal_time: new Date().toISOString(),
      source_type: "text",
      raw_input_text: estimate.raw_input_text,
      meal_name: estimate.meal_name,
      ai_calories: estimate.estimated_calories,
      ai_protein: estimate.estimated_protein,
      ai_carbs: estimate.estimated_carbs,
      ai_fat: estimate.estimated_fat,
      estimated_calories: estimate.estimated_calories,
      estimated_protein: estimate.estimated_protein,
      estimated_carbs: estimate.estimated_carbs,
      estimated_fat: estimate.estimated_fat,
      user_edited: false,
      ai_notes: estimate.ai_notes,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    sessionStorage.removeItem("pendingMeal");
    router.push("/dashboard");
  }

  if (!estimate) return null;

  const fields: { key: keyof Estimate; label: string; unit: string }[] = [
    { key: "estimated_calories", label: "Calories", unit: "kcal" },
    { key: "estimated_protein", label: "Protein", unit: "g" },
    { key: "estimated_carbs", label: "Carbs", unit: "g" },
    { key: "estimated_fat", label: "Fat", unit: "g" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <Link href="/add" className="flex min-h-[44px] min-w-[44px] items-center text-zinc-400 hover:text-zinc-600">
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">Review & Save</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Meal name */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-zinc-500">
            Meal name
          </label>
          <input
            value={estimate.meal_name}
            onChange={(e) => updateField("meal_name", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {/* Macro fields */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-zinc-500">
            AI estimate — edit if needed
          </p>
          <div className="flex flex-col gap-4">
            {fields.map(({ key, label, unit }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-zinc-700 w-20">
                  {label}
                </label>
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={estimate[key] as number}
                    onChange={(e) => {
                      // Mark as user-edited if value changed
                      updateField(key, parseFloat(e.target.value) || 0);
                    }}
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-right text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  />
                  <span className="w-8 text-xs text-zinc-400">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI notes */}
        {estimate.ai_notes && (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500">
              <span className="font-medium">AI note: </span>
              {estimate.ai_notes}
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 flex justify-center bg-gradient-to-t from-zinc-50 pb-8 pt-4 px-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-sm rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 disabled:opacity-40 active:scale-95"
        >
          {saving ? "Saving…" : "Save Meal"}
        </button>
      </div>
    </div>
  );
}
