# GymAI - Smart Training & Nutrition Optimizer

GymAI is a professional web application designed to provide personalized workout and diet plans using AI. It features user authentication, profile management, and progress tracking.

## 📂 Project Structure

```text
Gym-AI_Systme-/
├── client/              # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/         # API client configurations
│   │   ├── assets/      # Images and styles
│   │   ├── components/  # Reusable UI components
│   │   └── ...          # Pages and routes
├── server/              # Backend (Node.js + Express + MySQL)
│   ├── controllers/     # Business logic for each route
│   ├── middleware/      # Auth and safety middleware
│   ├── routes/          # API endpoint definitions
│   ├── services/        # AI and background services
│   └── index.ts         # Server entry point
├── .env.example         # Template for environment variables
└── package.json         # Project dependencies and scripts
```

## ✨ Key Features
*   **AI Plan Generation:** Personalized workout and meal plans based on your BMI, goals, and activity level.
*   **Progress Tracking:** Log your workouts and track your weight changes over time.
*   **Secure Auth:** OTP-based email verification and JWT-secured sessions.
*   **PRO Tier:** Unlock advanced AI features and detailed analytics.

## 🚀 Quick Start

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/Bachahussain/Gym-AI_Systme-.git
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Configure Environment:**
    Copy `.env.example` to `.env` and fill in your database and API keys.
4.  **Run Development Server:**
    ```bash
    pnpm dev
    ```

## 🛠 Tech Stack
*   **Frontend:** React, Vite, Tailwind CSS, Lucide React, Axios.
*   **Backend:** Node.js, Express, MySQL (mysql2), JWT, Nodemailer.
*   **AI:** Google Gemini 1.5 Flash, Mistral AI.

---
*Cleaned and restructured for professional use.*
