"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MealEntry {
  id: string;
  meal_name: string;
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
  meal_time: string;
}

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDisplay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMeals = useCallback(async (dateStr: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = new Date(dateStr + "T00:00:00");
    const end = new Date(dateStr + "T23:59:59");

    const { data } = await supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("meal_time", start.toISOString())
      .lte("meal_time", end.toISOString())
      .order("meal_time", { ascending: true });

    setMeals(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMeals(selectedDate);
  }, [selectedDate, loadMeals]);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.estimated_calories ?? 0),
      protein: acc.protein + (m.estimated_protein ?? 0),
      carbs: acc.carbs + (m.estimated_carbs ?? 0),
      fat: acc.fat + (m.estimated_fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    const next = toDateString(d);
    if (next <= toDateString(new Date())) setSelectedDate(next);
  }

  const isToday = selectedDate === toDateString(new Date());

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <Link
          href="/dashboard"
          className="flex min-h-[44px] min-w-[44px] items-center text-zinc-400 hover:text-zinc-600"
        >
          ← Back
        </Link>
        <h1 className="text-lg font-semibold text-zinc-900">History</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Date navigator */}
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => shiftDate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:scale-95"
          >
            ‹
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-zinc-900">{formatDisplay(selectedDate)}</p>
            <input
              type="date"
              value={selectedDate}
              max={toDateString(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-zinc-400 outline-none"
            />
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30 active:scale-95"
          >
            ›
          </button>
        </div>

        {/* Day totals */}
        {meals.length > 0 && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-zinc-500">Totals</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Calories", value: Math.round(totals.calories), unit: "kcal" },
                { label: "Protein", value: Math.round(totals.protein), unit: "g" },
                { label: "Carbs", value: Math.round(totals.carbs), unit: "g" },
                { label: "Fat", value: Math.round(totals.fat), unit: "g" },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-zinc-900">{value}</p>
                  <p className="text-xs text-zinc-400">{unit}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Meal list */}
        <section className="flex flex-1 flex-col gap-2">
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <p className="text-sm text-zinc-400">Loading…</p>
            </div>
          ) : meals.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center">
              <p className="text-sm text-zinc-400">No meals logged on this day</p>
            </div>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-zinc-900">{meal.meal_name}</p>
                  <p className="text-sm font-semibold text-zinc-700">
                    {Math.round(meal.estimated_calories)} kcal
                  </p>
                </div>
                <div className="mt-1.5 flex gap-3 text-xs text-zinc-400">
                  <span>{Math.round(meal.estimated_protein)}g protein</span>
                  <span>{Math.round(meal.estimated_carbs)}g carbs</span>
                  <span>{Math.round(meal.estimated_fat)}g fat</span>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
