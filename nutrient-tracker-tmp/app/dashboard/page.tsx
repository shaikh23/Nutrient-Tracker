import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import Link from "next/link";
import MealCard from "./MealCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch today's meals
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: meals } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("user_id", user!.id)
    .gte("meal_time", todayStart.toISOString())
    .order("meal_time", { ascending: true });

  const totals = (meals ?? []).reduce(
    (acc, m) => ({
      calories: acc.calories + (m.estimated_calories ?? 0),
      protein: acc.protein + (m.estimated_protein ?? 0),
      carbs: acc.carbs + (m.estimated_carbs ?? 0),
      fat: acc.fat + (m.estimated_fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Macro Tracker</h1>
          <p className="text-xs text-zinc-400">{today}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="min-h-[44px] min-w-[44px] text-sm text-zinc-400 hover:text-zinc-600">
            Sign out
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-6">
        {/* Daily totals */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-zinc-500">Today</h2>
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

        {/* Meal list */}
        <section className="flex flex-1 flex-col gap-3">
          <h2 className="text-sm font-medium text-zinc-500">Meals</h2>

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

      {/* Add meal FAB */}
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
