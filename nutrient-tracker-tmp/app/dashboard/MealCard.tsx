"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Meal {
  id: string;
  meal_name: string;
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
}

export default function MealCard({ meal }: { meal: Meal }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("meal_entries").delete().eq("id", meal.id);
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between p-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-zinc-900 text-sm truncate">{meal.meal_name}</p>
          <div className="mt-1.5 flex gap-3 text-xs text-zinc-400">
            <span>{Math.round(meal.estimated_protein)}g protein</span>
            <span>{Math.round(meal.estimated_carbs)}g carbs</span>
            <span>{Math.round(meal.estimated_fat)}g fat</span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          <p className="text-sm font-semibold text-zinc-700">
            {Math.round(meal.estimated_calories)} kcal
          </p>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 transition-colors"
              aria-label="Delete meal"
            >
              ✕
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-full px-3 py-1 text-xs text-zinc-400 hover:text-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
