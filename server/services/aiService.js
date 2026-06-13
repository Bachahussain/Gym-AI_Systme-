import { Mistral } from '@mistralai/mistralai';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_MODEL_NAME = "mistral-small-latest"; // You can change this to "mistral-large-latest" for better results

export function calculateFitnessMetrics(user) {
  const heightM = user.height / 100;
  const bmi = Math.round((user.weight / (heightM * heightM)) * 10) / 10;

  let bmiCategory = "Underweight";
  if (bmi >= 18.5 && bmi < 24.9) bmiCategory = "Normal";
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = "Overweight";
  else if (bmi >= 30) bmiCategory = "Obese";

  let bmr;
  if (user.gender && user.gender.toLowerCase() === "male") {
    bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
  } else {
    bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
  }
  bmr = Math.round(bmr);

  const activityMultipliers = {
    "sedentary": 1.2,
    "moderate": 1.55,
    "active": 1.725
  };
  const tdee = Math.round(bmr * (activityMultipliers[user.activity_level ? user.activity_level.toLowerCase() : 'sedentary'] || 1.2));

  let recommendedCalories;
  if (user.goal === "weight_loss") {
    recommendedCalories = tdee - 500;
  } else if (user.goal === "muscle_gain") {
    recommendedCalories = tdee + 300;
  } else {
    recommendedCalories = tdee;
  }

  return {
    bmi,
    bmi_category: bmiCategory,
    bmr,
    tdee,
    recommended_calories: Math.round(recommendedCalories)
  };
}

export async function generateAiPlanMistral(user, metrics) {
  const apiKey = process.env.MISTRAL_API_KEY;
  const modelName = process.env.MISTRAL_MODEL || DEFAULT_MODEL_NAME;

  if (!apiKey) {
    return { error: "MISTRAL_API_KEY is not configured." };
  }

  try {
    const client = new Mistral({ apiKey });
    const n = user.workout_days || 3;

    const workoutPrompt = buildWorkoutPrompt(user, metrics, n);
    const dietPrompt = buildDietPrompt(user, metrics);

    // Workout Plan
    const wResponse = await client.chat.complete({
      model: modelName,
      messages: [{ role: "user", content: workoutPrompt }],
      responseFormat: { type: "json_object" }
    });
    const workoutData = JSON.parse(wResponse.choices[0].message.content);
    const workoutPlan = workoutData.workout_plan || [];

    // Diet Plan
    const dResponse = await client.chat.complete({
      model: modelName,
      messages: [{ role: "user", content: dietPrompt }],
      responseFormat: { type: "json_object" }
    });
    const dietData = JSON.parse(dResponse.choices[0].message.content);
    const dietPlan = dietData.diet_plan || [];

    return {
      weekly_workout_plan: workoutPlan.slice(0, n),
      weekly_diet_plan: dietPlan.slice(0, 7)
    };
  } catch (error) {
    console.error("Mistral generation error:", error);
    return { error: `Mistral failed: ${error.message}` };
  }
}

export async function generateAiPlanGemini(user, metrics) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured." };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const n = user.workout_days || 3;
    const workoutPrompt = buildWorkoutPrompt(user, metrics, n);
    const dietPrompt = buildDietPrompt(user, metrics);

    // Workout Plan using Gemini 3.5 Flash
    const wResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: workoutPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const workoutData = JSON.parse(wResponse.text);
    const workoutPlan = workoutData.workout_plan || [];

    // Diet Plan using Gemini 3.5 Flash
    const dResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dietPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const dietData = JSON.parse(dResponse.text);
    const dietPlan = dietData.diet_plan || [];

    return {
      weekly_workout_plan: workoutPlan.slice(0, n),
      weekly_diet_plan: dietPlan.slice(0, 7)
    };
  } catch (error) {
    console.error("Gemini representation/generation error:", error);
    return { error: `Gemini failed: ${error.message}` };
  }
}

export async function generateAiPlan(user, metrics) {
  if (process.env.GEMINI_API_KEY) {
    console.log("🤖 Generating workout & diet plans using Gemini GPT-like engine (Google 3.5 Flash)...");
    const plan = await generateAiPlanGemini(user, metrics);
    if (!plan.error) {
      return plan;
    }
    console.warn("⚠️ Gemini failed, falling back to Mistral if available... Error was: " + plan.error);
  }
  
  if (process.env.MISTRAL_API_KEY) {
    console.log("🤖 Generating workout & diet plans using Mistral...");
    return await generateAiPlanMistral(user, metrics);
  }

  return { 
    error: "Neither GEMINI_API_KEY nor MISTRAL_API_KEY is configured in your Settings > Secrets panel. Please ensure you put your API key in Secrets under GEMINI_API_KEY." 
  };
}

function buildWorkoutPrompt(user, metrics, n) {
  const context = user.past_1_week_plan ? `\nPAST 1-WEEK PLAN CONTEXT:\n${user.past_1_week_plan}\n` : 
                 (user.past_2_weeks_plan ? `\nPAST 2-WEEK PLAN CONTEXT:\n${user.past_2_weeks_plan}\n` : "");

  const dayLabels = Array.from({ length: n }, (_, i) => `"Day ${i + 1}"`).join(", ");

  return `You are an elite AI personal trainer. Generate a ${n}-day workout plan.
USER:
- Goal: ${user.goal ? user.goal.replace(/_/g, ' ') : 'fitness'}
- Activity level: ${user.activity_level || 'moderate'}
- Workout days per week: ${n}
- BMI: ${metrics.bmi} (${metrics.bmi_category})
- Medical conditions: ${user.medical_conditions || 'none'}${context}

RULES:
1. The JSON array "workout_plan" MUST have EXACTLY ${n} elements.
2. Label days precisely: ${dayLabels}
3. No rest days.
4. Each entry MUST be unique.
5. EXERCISE NAMES: Use ONLY basic, standard, and singular names (e.g., "Bicep Curl", "Squat").

Return ONLY JSON:
{
  "workout_plan": [
    {
      "day": "Day 1",
      "muscle_focus": "string",
      "warm_up": "string",
      "exercises": [
        {"name": "string", "sets": 3, "reps": "10-12", "rest": "60s"}
      ],
      "cardio": "string",
      "estimated_calories_burned": 300,
      "difficulty_level": "Intermediate"
    }
  ]
}`;
}

function buildDietPrompt(user, metrics) {
  return `You are an elite nutritionist. Generate a 7-day meal plan.
USER:
- Goal: ${user.goal ? user.goal.replace(/_/g, ' ') : 'fitness'}
- Daily calories: ${metrics.recommended_calories} kcal
- Dietary preference: ${user.dietary_preference || 'none'}
- Medical conditions: ${user.medical_conditions || 'none'}

RULES:
1. The "diet_plan" array MUST have EXACTLY 7 elements.
2. Target: ${metrics.recommended_calories} kcal.
3. Label days: Day 1 to Day 7.

Return ONLY JSON:
{
  "diet_plan": [
    {
      "day": "Day 1",
      "breakfast": {"name": "string", "description": "string", "calories": 0},
      "lunch": {"name": "string", "description": "string", "calories": 0},
      "snack": {"name": "string", "description": "string", "calories": 0},
      "dinner": {"name": "string", "description": "string", "calories": 0},
      "total_daily_calories": ${metrics.recommended_calories},
      "protein_intake": "string",
      "water_intake": "string"
    }
  ]
}`;
}
