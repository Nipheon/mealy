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
  Loader2,
  Printer
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
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('meal_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse meal history', e);
      }
    }
    fetchMeals();
  }, []);

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

  const resetHistory = () => {
    setHistory([]);
    localStorage.removeItem('meal_history');
  };

  const handlePrint = () => {
    window.print();
  };

  const generateMealPlan = () => {
    if (meals.length < 18) {
      setError('Not enough meals in CSV to generate a unique 2-week plan (need at least 18 meals).');
      return;
    }

    // Separate meals into unused (preferred) and used (history)
    const unusedMeals = meals.filter(m => !history.includes(m.name));
    
    let selectedForPlan: Meal[] = [];
    let newHistory: string[] = [...history];

    if (unusedMeals.length >= 18) {
      // Case 1: We have enough unused meals to fill the whole plan
      const shuffledUnused = [...unusedMeals].sort(() => Math.random() - 0.5);
      selectedForPlan = shuffledUnused.slice(0, 18);
      newHistory = [...history, ...selectedForPlan.map(m => m.name)];
    } else {
      // Case 2: We need to use all remaining unused meals and then start over
      const shuffledUnused = [...unusedMeals].sort(() => Math.random() - 0.5);
      const remainingNeeded = 18 - unusedMeals.length;
      
      // Reset history logic: The new history will be the meals picked from the "fresh" list
      // plus the ones we just picked to finish the old list.
      // But to satisfy "36 meals resting", we just keep adding until we hit the limit.
      
      // Let's pick the remaining from the full list, excluding the ones we just picked from unused
      const fullListShuffled = [...meals]
        .filter(m => !shuffledUnused.some(um => um.name === m.name))
        .sort(() => Math.random() - 0.5);
      
      selectedForPlan = [...shuffledUnused, ...fullListShuffled.slice(0, remainingNeeded)];
      
      // If we've exhausted the list, the new history should contain all 18 meals 
      // just picked to ensure they aren't repeated in the very next generation.
      newHistory = selectedForPlan.map(m => m.name);
    }

    let mealIdx = 0;
    const generateWeek = () => DAYS.map(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const count = isWeekend ? 2 : 1;
      const selectedMeals: Meal[] = [];
      
      for (let i = 0; i < count; i++) {
        selectedMeals.push(selectedForPlan[mealIdx++]);
      }

      return {
        day,
        meals: selectedMeals
      };
    });

    const week1 = generateWeek();
    const week2 = generateWeek();

    setMealPlan({ week1, week2 });
    setHistory(newHistory);
    localStorage.setItem('meal_history', JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto print:max-w-none">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 print:hidden">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bi-Weekly Meal Planner</h1>
              <p className="text-slate-500">Generate a unique 14-day plan from your meals.csv file.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {mealPlan && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors text-sm font-medium shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Plan
              </button>
            )}
            <button 
              onClick={fetchMeals}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reload CSV
            </button>
          </div>
        </header>

        {/* Print Only Header */}
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-2xl font-bold">14-Day Meal Plan</h1>
          <p className="text-slate-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 print:block">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 print:hidden">
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
                className="w-full p-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
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
              <p className="text-xs leading-relaxed opacity-80 mb-4">
                Each day gets unique meals. Weekdays: 1, Weekends: 2. Total 18 meals per 2 weeks.
              </p>
              
              <div className="pt-4 border-t border-emerald-800">
                <h4 className="text-[10px] uppercase tracking-wider font-bold mb-2 opacity-60">Rotation History</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-70">Available:</span>
                    <span className="text-xs font-bold text-emerald-400">{meals.length - history.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-70">Resting:</span>
                    <span className="text-xs font-bold text-amber-400">{history.length}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={resetHistory}
                      className="text-[10px] bg-emerald-800 hover:bg-emerald-700 px-2 py-1 rounded-lg transition-colors w-full"
                    >
                      Reset History
                    </button>
                  </div>
                </div>
                <p className="text-[9px] mt-2 opacity-50 italic leading-tight">
                  Meals are only repeated once the entire list has been exhausted.
                </p>
              </div>
            </div>
          </div>

          {/* Meal Plan Display */}
          <div className="lg:col-span-4 space-y-12 print:space-y-8">
            {mealPlan ? (
              <>
                {/* Week 1 */}
                <section className="print:break-inside-avoid">
                  <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest print:text-slate-600 print:text-sm">Week One</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
                    {mealPlan.week1.map((day, idx) => (
                      <div key={`w1-${day.day}`}>
                        <DayCard day={day} idx={idx} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Week 2 */}
                <section className="print:break-inside-avoid">
                  <div className="flex items-center gap-3 mb-6 print:mb-4">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest print:text-slate-600 print:text-sm">Week Two</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
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
      className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow print:rounded-xl print:shadow-none print:border-slate-200"
    >
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center print:px-3 print:py-1">
        <h3 className="font-bold text-slate-700 print:text-xs">{day.day}</h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 print:text-[8px]">Day {idx + 1}</span>
      </div>
      <div className="p-5 space-y-4 print:p-2 print:space-y-2">
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
      <div className="flex items-center gap-2 mb-1 print:gap-1 print:mb-0">
        <div className={`p-1.5 rounded-lg ${color} print:p-0.5 print:bg-transparent print:text-slate-400`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight print:text-[8px]">{label}</span>
      </div>
      <div className="pl-9 print:pl-5">
        <p className="font-semibold text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors print:text-[10px] print:font-medium">
          {meal?.name || 'Not assigned'}
        </p>
        {meal?.calories && (
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium print:text-[8px] print:mt-0">
            {meal.calories} kcal
          </p>
        )}
      </div>
    </div>
  );
}
