from pydantic import BaseModel, Field
from typing import Literal, List, Optional

class BaseUserFitnessInput(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: Literal["male", "female", "other"]
    height: float = Field(..., description="Height in cm", gt=0)
    weight: float = Field(..., description="Weight in kg", gt=0)
    goal: Literal["weight_loss", "muscle_gain", "maintenance"]
    activity_level: Literal["sedentary", "moderate", "active"]
    dietary_preference: str = Field(default="none")
    medical_conditions: str = Field(default="none")
    workout_days: int = Field(default=3, ge=1, le=7)

class NewUserFitnessInput(BaseUserFitnessInput):
    pass

class ExistingUserFitnessInput(BaseUserFitnessInput):
    past_2_weeks_plan: Optional[str] = Field(None, description="Serialized context of the user's past 2-week plan (sent by main backend if 1-week plan is unavailable)")
    past_1_week_plan: Optional[str] = Field(None, description="Serialized context of the user's past 1-week plan (preferred by AI if present)")

class WorkoutExercise(BaseModel):
    name: str = Field(..., description="Name of the exercise")
    sets: int = Field(..., description="Number of sets")
    reps: str = Field(..., description="Number of reps or duration")
    rest: str = Field(..., description="Rest between sets")

class WorkoutDay(BaseModel):
    day: str = Field(..., description="E.g., Day 1, Day 2")
    muscle_focus: str = Field(..., description="E.g., Chest & Triceps")
    warm_up: str = Field(..., description="Warm-up routine")
    exercises: List[WorkoutExercise]
    cardio: str = Field(..., description="Cardio routine for the day")
    estimated_calories_burned: int
    difficulty_level: str

class Meal(BaseModel):
    name: str = Field(..., description="Name of the meal")
    description: str = Field(..., description="Description of the meal")
    calories: int = Field(..., description="Calories for this meal")

class DietDay(BaseModel):
    day: str = Field(..., description="E.g., Day 1, Day 2")
    breakfast: Meal
    lunch: Meal
    snack: Meal
    dinner: Meal
    total_daily_calories: int
    protein_intake: str
    water_intake: str

class AIPlanOutput(BaseModel):
    bmi: float
    bmi_category: str
    bmr: float
    tdee: float
    recommended_calories: int
    weekly_workout_plan: List[WorkoutDay]
    weekly_diet_plan: List[DietDay]
