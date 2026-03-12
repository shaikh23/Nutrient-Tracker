"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Targets {
  daily_calorie_target: string;
  daily_protein_target: string;
  daily_carb_target: string;
  daily_fat_target: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<Targets>({
    daily_calorie_target: "",
    daily_protein_target: "",
    daily_carb_target: "",
    daily_fat_target: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target")
        .eq("id", user.id)
        .single();

      if (data) {
        setTargets({
          daily_calorie_target: data.daily_calorie_target?.toString() ?? "",
          daily_protein_target: data.daily_protein_target?.toString() ?? "",
          daily_carb_target: data.daily_carb_target?.toString() ?? "",
          daily_fat_target: data.daily_fat_target?.toString() ?? "",
        });
      }
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      daily_calorie_target: targets.daily_calorie_target ? parseFloat(targets.daily_calorie_target) : null,
      daily_protein_target: targets.daily_protein_target ? parseFloat(targets.daily_protein_target) : null,
      daily_carb_target: targets.daily_carb_target ? parseFloat(targets.daily_carb_target) : null,
      daily_fat_target: targets.daily_fat_target ? parseFloat(targets.daily_fat_target) : null,
    }).eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields: { key: keyof Targets; label: string; unit: string; placeholder: string }[] = [
    { key: "daily_calorie_target", label: "Calories", unit: "kcal", placeholder: "e.g. 2000" },
    { key: "daily_protein_target", label: "Protein", unit: "g", placeholder: "e.g. 150" },
    { key: "daily_carb_target", label: "Carbs", unit: "g", placeholder: "e.g. 200" },
    { key: "daily_fat_target", label: "Fat", unit: "g", placeholder: "e.g. 65" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <Link
          href="/dashboard"
          className="flex min-h-[44px] min-w-[44px] items-center text-zinc-400 hover:text-zinc-600"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">Daily Targets</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm text-zinc-500">
            Set your daily targets. Leave blank to hide progress bars.
          </p>
          <div className="flex flex-col gap-4">
            {fields.map(({ key, label, unit, placeholder }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-20 text-sm font-medium text-zinc-700">{label}</label>
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={targets[key]}
                    onChange={(e) => setTargets((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-right text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  />
                  <span className="w-8 text-xs text-zinc-400">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 flex justify-center bg-gradient-to-t from-zinc-50 pb-8 pt-4 px-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-sm rounded-full bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 disabled:opacity-40 active:scale-95"
        >
          {saving ? "Saving…" : saved ? "Saved!" : "Save Targets"}
        </button>
      </div>
    </div>
  );
}
