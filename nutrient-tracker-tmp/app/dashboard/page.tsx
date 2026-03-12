import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import Link from "next/link";
import MealCard from "./MealCard";

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min((value / target) * 100, 100);
  const over = value > target;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className={`h-full rounded-full transition-all ${over ? "bg-red-400" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ data: meals }, { data: profile }] = await Promise.all([
    supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", user!.id)
      .gte("meal_time", todayStart.toISOString())
      .order("meal_time", { ascending: true }),
    supabase
      .from("profiles")
      .select("daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target")
      .eq("id", user!.id)
      .single(),
  ]);

  const totals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + (m.estimated_calories ?? 0),
      protein: acc.protein + (m.estimated_protein ?? 0),
      carbs: acc.carbs + (m.estimated_carbs ?? 0),
      fat: acc.fat + (m.estimated_fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const targets = {
    calories: profile?.daily_calorie_target ?? null,
    protein: profile?.daily_protein_target ?? null,
    carbs: profile?.daily_carb_target ?? null,
    fat: profile?.daily_fat_target ?? null,
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const macroStats = [
    { label: "Calories", value: Math.round(totals.calories), unit: "kcal", target: targets.calories, color: "bg-orange-400" },
    { label: "Protein", value: Math.round(totals.protein), unit: "g", target: targets.protein, color: "bg-blue-400" },
    { label: "Carbs", value: Math.round(totals.carbs), unit: "g", target: targets.carbs, color: "bg-yellow-400" },
    { label: "Fat", value: Math.round(totals.fat), unit: "g", target: targets.fat, color: "bg-pink-400" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Macro Tracker</h1>
          <p className="text-xs text-zinc-400">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-400 hover:text-zinc-600"
            aria-label="Settings"
          >
            ⚙️
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-[44px] min-w-[44px] text-sm text-zinc-400 hover:text-zinc-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Daily totals + progress bars */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500">Today</h2>
            {!targets.calories && (
              <Link href="/settings" className="text-xs text-zinc-400 hover:text-zinc-600">
                Set targets →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            {macroStats.map(({ label, value, unit, target, color }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <p className="text-2xl font-bold text-zinc-900">{value}</p>
                <p className="text-xs text-zinc-400">{unit}</p>
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                {target !== null && (
                  <>
                    <ProgressBar value={value} target={target} color={color} />
                    <p className="text-[10px] text-zinc-300">{target}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Meal list */}
        <section className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500">Meals</h2>
            <Link href="/history" className="text-xs text-zinc-400 hover:text-zinc-600">
              History →
            </Link>
          </div>

          {!meals || meals.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-16 text-center">
              <p className="text-sm text-zinc-400">No meals logged yet</p>
              <p className="mt-1 text-xs text-zinc-300">
                Tap the button below to add your first meal
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="sticky bottom-0 flex justify-center bg-gradient-to-t from-zinc-50 pb-8 pt-4">
        <Link
          href="/add"
          className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 active:scale-95"
        >
          + Add Meal
        </Link>
      </div>
    </div>
  );
}
