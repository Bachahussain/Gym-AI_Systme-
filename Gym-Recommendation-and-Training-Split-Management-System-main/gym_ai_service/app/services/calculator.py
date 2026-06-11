from app.schemas import BaseUserFitnessInput

def calculate_fitness_metrics(user: BaseUserFitnessInput) -> dict:
    # 1. Calculate BMI
    height_m = user.height / 100
    bmi = round(user.weight / (height_m ** 2), 1)

    # BMI Category
    if bmi < 18.5:
        bmi_category = "Underweight"
    elif 18.5 <= bmi < 24.9:
        bmi_category = "Normal"
    elif 25 <= bmi < 29.9:
        bmi_category = "Overweight"
    else:
        bmi_category = "Obese"

    # 2. Calculate BMR (Mifflin-St Jeor Equation)
    if user.gender.lower() == "male":
        bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5
    else:
        # Female or "other" defaults to female equation for safety
        bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161
    
    bmr = round(bmr, 0)

    # 3. Calculate TDEE
    activity_multipliers = {
        "sedentary": 1.2,
        "moderate": 1.55,
        "active": 1.725
    }
    tdee = round(bmr * activity_multipliers.get(user.activity_level.lower(), 1.2), 0)

    # 4. Recommended Calories (Goal Adjustment)
    if user.goal == "weight_loss":
        recommended_calories = tdee - 500
    elif user.goal == "muscle_gain":
        recommended_calories = tdee + 300
    else: # maintenance
        recommended_calories = tdee

    return {
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmr": bmr,
        "tdee": tdee,
        "recommended_calories": int(recommended_calories)
    }
