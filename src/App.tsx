/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode } from 'react';
import Papa from 'papaparse';
import { motion } from 'motion/react';
import { 
  Calendar, 
  RefreshCw, 
  ChefHat, 
  Utensils, 
  Moon,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Meal {
  name: string;
  calories?: string;
  ingredients?: string;
}

interface DayPlan {
  day: string;
  meals: Meal[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlan, setMealPlan] = useState<{ week1: DayPlan[], week2: DayPlan[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/meals.csv');
      if (!response.ok) {
        throw new Error('Failed to load meals.csv. Please ensure it exists in the public directory.');
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedMeals = results.data as Meal[];
          if (parsedMeals.length === 0) {
            setError('The meals.csv file is empty or invalid.');
          } else {
            setMeals(parsedMeals);
          }
          setLoading(false);
        },
        error: (err) => {
          setError(`Error parsing CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const generateMealPlan = () => {
    if (meals.length < 18) {
      setError('Not enough meals in CSV to generate a unique 2-week plan (need at least 18 meals).');
      return;
    }

    // Shuffle meals to ensure randomness and uniqueness
    const shuffled = [...meals].sort(() => Math.random() - 0.5);
    let mealIdx = 0;

    const generateWeek = () => DAYS.map(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const count = isWeekend ? 2 : 1;
      const selectedMeals: Meal[] = [];
      
      for (let i = 0; i < count; i++) {
        selectedMeals.push(shuffled[mealIdx++]);
      }

      return {
        day,
        meals: selectedMeals
      };
    });

    setMealPlan({
      week1: generateWeek(),
      week2: generateWeek()
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bi-Weekly Meal Planner</h1>
              <p className="text-slate-500">Generate a unique 14-day plan from your meals.csv file.</p>
            </div>
          </div>
          
          <button 
            onClick={fetchMeals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reload CSV
          </button>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                Generate Plan
              </h2>
              
              {error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-start gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-6">
                  {loading ? 'Loading meals...' : `Ready to generate from ${meals.length} meals. (18 unique meals required)`}
                </p>
              )}

              <button 
                onClick={generateMealPlan}
                disabled={meals.length < 18 || loading}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Generate 2-Week Plan
              </button>
            </div>

            <div className="bg-emerald-900 text-emerald-100 p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold flex items-center gap-2 mb-2 text-sm">
                <ChefHat className="w-4 h-4" />
                Plan Info
              </h3>
              <p className="text-xs leading-relaxed opacity-80">
                Each day gets unique meals. Weekdays: 1, Weekends: 2. Total 18 meals per 2 weeks.
              </p>
            </div>
          </div>

          {/* Meal Plan Display */}
          <div className="lg:col-span-4 space-y-12">
            {mealPlan ? (
              <>
                {/* Week 1 */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Week One</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {mealPlan.week1.map((day, idx) => (
                      <div key={`w1-${day.day}`}>
                        <DayCard day={day} idx={idx} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Week 2 */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Week Two</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {mealPlan.week2.map((day, idx) => (
                      <div key={`w2-${day.day}`}>
                        <DayCard day={day} idx={idx + 7} />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Calendar className="w-16 h-16 opacity-20" />
                </div>
                <p className="font-bold text-slate-600 text-xl">No meal plan generated yet</p>
                <p className="text-sm mt-2 max-w-xs text-center">Click the generate button to see your 14-day schedule using your meals.csv file.</p>
                <button 
                  onClick={generateMealPlan}
                  disabled={meals.length < 18 || loading}
                  className="mt-8 flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all disabled:opacity-50"
                >
                  Generate your first plan <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function DayCard({ day, idx }: { day: DayPlan, idx: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-700">{day.day}</h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Day {idx + 1}</span>
      </div>
      <div className="p-5 space-y-4">
        {day.meals.map((meal, mIdx) => (
          <div key={mIdx}>
            <MealItem 
              icon={day.meals.length > 1 ? (mIdx === 0 ? <Utensils className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Utensils className="w-4 h-4" />} 
              label={day.meals.length > 1 ? (mIdx === 0 ? "Meal 1" : "Meal 2") : "Daily Meal"} 
              meal={meal} 
              color={mIdx === 0 ? "text-emerald-500 bg-emerald-50" : "text-indigo-500 bg-indigo-50"} 
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MealItem({ icon, label, meal, color }: { icon: ReactNode, label: string, meal: Meal | null, color: string }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      </div>
      <div className="pl-9">
        <p className="font-semibold text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">
          {meal?.name || 'Not assigned'}
        </p>
        {meal?.calories && (
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {meal.calories} kcal
          </p>
        )}
      </div>
    </div>
  );
}
