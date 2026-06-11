import os
import json
import asyncio
import re
import sys
import logging
from dotenv import load_dotenv
from mistralai import Mistral
from app.schemas import BaseUserFitnessInput

# Configure logging
logger = logging.getLogger(__name__)

# Configure Mistral
DEFAULT_MODEL_NAME = "mistral-small-latest"

def _read_mistral_api_key() -> str | None:
    # Reload .env on each request in development to avoid stale keys after edits.
    load_dotenv(override=True)
    raw_key = os.getenv("MISTRAL_API_KEY")
    if not raw_key:
        return None
    # Protect against accidental wrapping quotes/spaces in env value.
    return raw_key.strip().strip('"').strip("'")

async def generate_ai_plan_mistral(user: BaseUserFitnessInput, metrics: dict) -> dict:
    api_key = _read_mistral_api_key()
    model_name = os.getenv("MISTRAL_MODEL", DEFAULT_MODEL_NAME)

    if not api_key:
        return {"error": "MISTRAL_API_KEY is not configured."}

    client = Mistral(api_key=api_key)
    n = user.workout_days

    # ── Prompt Building ──
    workout_prompt = _build_workout_prompt(user, metrics, n)
    diet_prompt = _build_diet_prompt(user, metrics)

    last_workout_plan = []
    last_diet_plan = []

    for attempt in range(3):
        try:
            if attempt > 0:
                await asyncio.sleep(2)

            print(f"Mistral Attempt {attempt+1}..."); sys.stdout.flush()
            
            # --- Workout Plan ---
            w_response = client.chat.complete(
                model=model_name,
                messages=[{"role": "user", "content": workout_prompt}],
                response_format={"type": "json_object"}
            )
            w_text = w_response.choices[0].message.content
            workout_data = _parse_json(w_text)
            workout_plan = workout_data.get("workout_plan", [])
            last_workout_plan = workout_plan

            if len(workout_plan) != n:
                print(f"Workout count mismatch: Got {len(workout_plan)}, Expected {n}"); sys.stdout.flush()
                continue

            # --- Diet Plan ---
            d_response = client.chat.complete(
                model=model_name,
                messages=[{"role": "user", "content": diet_prompt}],
                response_format={"type": "json_object"}
            )
            d_text = d_response.choices[0].message.content
            diet_data = _parse_json(d_text)
            diet_plan = diet_data.get("diet_plan", [])
            last_diet_plan = diet_plan

            if len(diet_plan) != 7:
                print(f"Diet count mismatch: Got {len(diet_plan)}, Expected 7"); sys.stdout.flush()
                continue

            return {
                "weekly_workout_plan": workout_plan[:n],
                "weekly_diet_plan": diet_plan[:7]
            }

        except Exception as e:
            err_msg = str(e)
            status_code = getattr(e, "status_code", None)
            if status_code is None:
                response = getattr(e, "response", None)
                status_code = getattr(response, "status_code", None)

            with open('mistral_debug.txt', 'a') as f:
                f.write(f"Mistral Error (Attempt {attempt+1}) Type: {type(e)}\n")
                f.write(f"Mistral Error (Attempt {attempt+1}) Status: {status_code}\n")
                f.write(f"Mistral Error (Attempt {attempt+1}) Full: {repr(e)}\n\n")
            
            print(f"Mistral Error (Attempt {attempt+1}) Type: {type(e)}"); sys.stdout.flush()
            print(f"Mistral Error (Attempt {attempt+1}) Status: {status_code}"); sys.stdout.flush()
            print(f"Mistral Error (Attempt {attempt+1}) Full: {repr(e)}"); sys.stdout.flush()
            if status_code == 401 or "401" in err_msg or "Unauthorized" in err_msg or "401" in repr(e):
                return {"error": "Mistral authentication failed (401). Please verify MISTRAL_API_KEY in gym_ai_service/.env."}
            if attempt == 2:
                return {"error": f"Mistral failed after 3 attempts: {err_msg}"}

    # Fallback to last successful parse if available
    if last_workout_plan and last_diet_plan:
        return {
            "weekly_workout_plan": last_workout_plan[:n],
            "weekly_diet_plan": last_diet_plan[:7]
        }

    return {"error": "Failed to generate a valid plan with Mistral."}

def _parse_json(text: str) -> dict:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[-1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[-1].split("```")[0]
    
    text = text.strip()
    # Remove potential trailing commas before closing braces/brackets
    text = re.sub(r',\s*([\]}])', r'\1', text)
    return json.loads(text)

def _build_workout_prompt(user: BaseUserFitnessInput, metrics: dict, n: int) -> str:
    context = ""
    # Prefer last 1-week plan if available, fallback to 2-week plan
    if hasattr(user, 'past_1_week_plan') and user.past_1_week_plan:
        context = f"\nPAST 1-WEEK PLAN CONTEXT (use this to make the new plan progressive and non-repetitive):\n{user.past_1_week_plan}\n"
    elif hasattr(user, 'past_2_weeks_plan') and user.past_2_weeks_plan:
        context = f"\nPAST 2-WEEK PLAN CONTEXT (use this to make the new plan progressive and non-repetitive):\n{user.past_2_weeks_plan}\n"

    day_labels = ", ".join([f'"Day {i+1}"' for i in range(n)])

    return f"""You are an elite AI personal trainer.
Generate a {n}-day workout plan.

USER:
- Goal: {user.goal.replace('_', ' ').title()}
- Activity level: {user.activity_level.title()}
- Workout days per week: {n}
- BMI: {metrics['bmi']} ({metrics['bmi_category']})
- Medical conditions: {user.medical_conditions}{context}

RULES:
1. The JSON array "workout_plan" MUST have EXACTLY {n} elements.
2. Label days precisely: {day_labels}
3. No rest days.
4. Each entry MUST be unique.
5. EXERCISE NAMES: Use ONLY basic, standard, and singular names (e.g., "Bicep Curl", "Squat", "Push Up"). Do NOT use plural forms (no "s" at the end) and avoid overly complex descriptors like "Seated Torso Twists" (use "Russian Twist" or "Twist" instead).

Return ONLY JSON:
{{
  "workout_plan": [
    {{
      "day": "Day 1",
      "muscle_focus": "string",
      "warm_up": "string",
      "exercises": [
        {{"name": "string", "sets": 3, "reps": "10-12", "rest": "60s"}}
      ],
      "cardio": "string",
      "estimated_calories_burned": 300,
      "difficulty_level": "Intermediate"
    }}
  ]
}}"""

def _build_diet_prompt(user: BaseUserFitnessInput, metrics: dict) -> str:
    return f"""You are an elite nutritionist.
Generate a 7-day meal plan.

USER:
- Goal: {user.goal.replace('_', ' ').title()}
- Daily calories: {metrics['recommended_calories']} kcal
- Dietary preference: {user.dietary_preference}
- Medical conditions: {user.medical_conditions}

RULES:
1. The "diet_plan" array MUST have EXACTLY 7 elements.
2. Target: {metrics['recommended_calories']} kcal.
3. Label days: Day 1 to Day 7.

Return ONLY JSON:
{{
  "diet_plan": [
    {{
      "day": "Day 1",
      "breakfast": {{"name": "string", "description": "string", "calories": 0}},
      "lunch": {{"name": "string", "description": "string", "calories": 0}},
      "snack": {{"name": "string", "description": "string", "calories": 0}},
      "dinner": {{"name": "string", "description": "string", "calories": 0}},
      "total_daily_calories": {metrics['recommended_calories']},
      "protein_intake": "string",
      "water_intake": "string"
    }}
  ]
}}"""
