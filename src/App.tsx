/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, ReactNode } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Calendar, 
  RefreshCw, 
  Download, 
  Trash2, 
  ChefHat, 
  Utensils, 
  Coffee, 
  Moon,
  AlertCircle,
  CheckCircle2,
  ChevronRight
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
  const [mealPlan, setMealPlan] = useState<DayPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedMeals = results.data as Meal[];
        if (parsedMeals.length === 0) {
          setError('The CSV file is empty or invalid.');
          return;
        }
        
        // Validate headers
        const headers = results.meta.fields || [];
        const lowerHeaders = headers.map(h => h.toLowerCase());
        if (!lowerHeaders.includes('name')) {
          setError('CSV must have a "name" column.');
          return;
        }

        setMeals(parsedMeals);
        setError(null);
        setSuccess(`Successfully loaded ${parsedMeals.length} meals!`);
        setTimeout(() => setSuccess(null), 3000);
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  };

  const generateMealPlan = () => {
    if (meals.length === 0) {
      setError('Please upload a CSV file with meals first.');
      return;
    }

    const newPlan: DayPlan[] = DAYS.map(day => {
      const isWeekend = day === 'Saturday' || day === 'Sunday';
      const count = isWeekend ? 2 : 1;
      const selectedMeals: Meal[] = [];
      
      for (let i = 0; i < count; i++) {
        selectedMeals.push(meals[Math.floor(Math.random() * meals.length)]);
      }

      return {
        day,
        meals: selectedMeals
      };
    });

    setMealPlan(newPlan);
    setError(null);
  };

  const clearData = () => {
    setMeals([]);
    setMealPlan([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csvContent = "name,calories,ingredients\nOatmeal,300,Oats;Milk;Berries\nChicken Salad,450,Chicken;Lettuce;Dressing\nSpaghetti,600,Pasta;Tomato Sauce;Meatballs\nEggs,250,Eggs;Toast\nTurkey Sandwich,400,Turkey;Bread;Cheese\nSalmon,550,Salmon;Asparagus";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "meal_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-200">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Weekly Meal Planner</h1>
              <p className="text-slate-500">Upload your meals and generate a plan in seconds.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            {meals.length > 0 && (
              <button 
                onClick={clearData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                Step 1: Upload CSV
              </h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {meals.length > 0 ? `${meals.length} meals loaded` : 'Click to upload CSV'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports .csv files</p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                Step 2: Generate
              </h2>
              <button 
                onClick={generateMealPlan}
                disabled={meals.length === 0}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Generate Plan
              </button>
            </div>

            <div className="bg-emerald-900 text-emerald-100 p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <ChefHat className="w-4 h-4" />
                Plan Info
              </h3>
              <p className="text-xs leading-relaxed opacity-80">
                Weekdays get 1 meal, while weekends get 2 meals per day.
              </p>
            </div>
          </div>

          {/* Meal Plan Display */}
          <div className="lg:col-span-3">
            {mealPlan.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mealPlan.map((day, idx) => (
                  <motion.div 
                    key={day.day}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
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
                ))}
              </div>
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Calendar className="w-16 h-16 opacity-20" />
                </div>
                <p className="font-bold text-slate-600 text-xl">No meal plan generated yet</p>
                <p className="text-sm mt-2 max-w-xs text-center">Upload your meal list in CSV format and click the generate button to see your weekly schedule.</p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all"
                >
                  Start by uploading CSV <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
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
