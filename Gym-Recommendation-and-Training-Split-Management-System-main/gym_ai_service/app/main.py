import os
import sys
from fastapi import FastAPI, Header, HTTPException, Depends
from dotenv import load_dotenv

load_dotenv()

from typing import Union
from app.schemas import NewUserFitnessInput, ExistingUserFitnessInput, AIPlanOutput
from app.services.calculator import calculate_fitness_metrics
from app.services.mistral import generate_ai_plan_mistral

app = FastAPI(title="Gym AI Microservice")

INTERNAL_KEY = os.getenv("X_INTERNAL_KEY", "your_jwt_secret_key")

def verify_internal_key(x_internal_key: str = Header(None)):
    if x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid Internal Key")
    return x_internal_key

@app.post("/generate-plan/new", response_model=AIPlanOutput)
async def generate_plan_new(
    user_data: NewUserFitnessInput,
    internal_key: str = Depends(verify_internal_key)
):
    print(f"New Plan Request: {user_data.workout_days} workout days, goal: {user_data.goal}"); sys.stdout.flush()
    
    metrics = calculate_fitness_metrics(user_data)
    ai_response = await generate_ai_plan_mistral(user_data, metrics)
    
    if "error" in ai_response:
        print(f"Mistral Error: {ai_response['error']}"); sys.stdout.flush()
        raise HTTPException(status_code=500, detail=ai_response["error"])
        
    return AIPlanOutput(
        bmi=metrics["bmi"],
        bmi_category=metrics["bmi_category"],
        bmr=metrics["bmr"],
        tdee=metrics["tdee"],
        recommended_calories=metrics["recommended_calories"],
        weekly_workout_plan=ai_response["weekly_workout_plan"],
        weekly_diet_plan=ai_response["weekly_diet_plan"]
    )

@app.post("/generate-plan/existing", response_model=AIPlanOutput)
async def generate_plan_existing(
    user_data: ExistingUserFitnessInput,
    internal_key: str = Depends(verify_internal_key)
):
    print(f"Existing User Plan Request: {user_data.workout_days} workout days, goal: {user_data.goal}"); sys.stdout.flush()
    print(f"  Context: past_1_week={'yes' if user_data.past_1_week_plan else 'no'}, past_2_weeks={'yes' if user_data.past_2_weeks_plan else 'no'}"); sys.stdout.flush()

    metrics = calculate_fitness_metrics(user_data)
    ai_response = await generate_ai_plan_mistral(user_data, metrics)
    
    if "error" in ai_response:
        print(f"Mistral Error: {ai_response['error']}"); sys.stdout.flush()
        raise HTTPException(status_code=500, detail=ai_response["error"])
        
    return AIPlanOutput(
        bmi=metrics["bmi"],
        bmi_category=metrics["bmi_category"],
        bmr=metrics["bmr"],
        tdee=metrics["tdee"],
        recommended_calories=metrics["recommended_calories"],
        weekly_workout_plan=ai_response["weekly_workout_plan"],
        weekly_diet_plan=ai_response["weekly_diet_plan"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
