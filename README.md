# 🧠 ML-Based Skill Gap Intelligence System

> A full-stack web application that uses Machine Learning to analyze the gap between a student's skills and industry requirements, generating personalized recommendations and a learning roadmap.

---

## 🖥️ Demo

Open `frontend/index.html` in your browser — **no installation required** for the frontend.  
The app runs in demo mode when the backend is offline.

---

## 🗂️ Project Structure

```
project/
│
├── frontend/                   # React + TypeScript UI
│   ├── index.html              # ✅ SELF-CONTAINED APP (open directly)
│   ├── src/
│   │   ├── App.tsx             # Root with React Router
│   │   ├── index.tsx           # Entry point
│   │   ├── index.css           # Tailwind + global styles
│   │   ├── context/
│   │   │   └── AuthContext.tsx # User auth state
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SkillsPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   └── StepBar.tsx
│   │   ├── utils/
│   │   │   ├── api.ts          # Axios API calls
│   │   │   └── mlFallback.ts   # Client-side ML fallback
│   │   └── types/
│   │       └── index.ts        # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                    # Flask REST API
│   ├── app.py                  # Main Flask app
│   ├── requirements.txt
│   ├── start.sh                # One-command startup
│   ├── models/
│   │   └── db.py               # SQLite init + helpers
│   └── routes/
│       ├── auth.py             # POST /signup, POST /login
│       ├── profile.py          # POST /profile, GET /profile/:id
│       └── skills.py           # POST /skills, POST /predict, GET /dashboard/:id
│
├── ml_model/                   # Machine Learning
│   ├── skill_dataset.csv       # 95-skill training dataset
│   ├── train_model.py          # DecisionTreeClassifier training
│   ├── predictor.py            # Model inference + skill gap analysis
│   ├── skill_model.pkl         # Saved trained model
│   ├── encoders.pkl            # Label encoders
│   └── model_metadata.json     # Dept→skills mapping, accuracy
│
└── database/
    └── skillgap.db             # SQLite database (auto-created)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS, Recharts, Axios |
| Backend    | Python, Flask, SQLite                       |
| ML         | scikit-learn (DecisionTreeClassifier), Pandas, NumPy, joblib |

---

## 🚀 Quick Start

### Option A — Frontend Only (No Installation)
```bash
# Simply open in browser:
open frontend/index.html
```
The app runs in **demo mode** with client-side ML — no backend needed.

---

### Option B — Full Stack (Backend + Frontend)

**Step 1: Train the ML model**
```bash
cd ml_model
python train_model.py
```

**Step 2: Start the Flask backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
# → Running on http://localhost:5000
```

**Step 3: Open the frontend**
```bash
open frontend/index.html
# or with npm:
cd frontend && npm install && npm start
```

---

## 📡 API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | `/signup`                 | Register new user                  |
| POST   | `/login`                  | Authenticate user                  |
| POST   | `/profile`                | Save/update user profile           |
| GET    | `/profile/<id>`           | Get user profile                   |
| GET    | `/departments`            | List available departments         |
| GET    | `/dept-skills/<dept>`     | Get skills for a department        |
| POST   | `/skills`                 | Save user's selected skills        |
| GET    | `/skills/<id>`            | Get user's skills                  |
| POST   | `/predict`                | Run ML analysis + save result      |
| GET    | `/dashboard/<id>`         | Get full dashboard data            |
| GET    | `/health`                 | Health check                       |

---

## 🤖 Machine Learning

### Dataset
- **95 skills** across 7 departments and 5 industry sectors
- Features: `job_frequency`, `trend_score`, `growth_rate`, `average_salary_score`, `emerging_role`, `required_experience`
- Target: `demand_level` → High / Medium / Low

### Model
```python
DecisionTreeClassifier(
    max_depth=8,
    min_samples_split=3,
    min_samples_leaf=2,
    criterion="gini",
    random_state=42
)
```
- **Accuracy: ~68%** on test set
- Saved with `joblib` for fast inference

### Skill Score Formula
```
Skill Score = (Student Skills / Total Department Skills) × 100

0–40%  → Beginner
40–70% → Intermediate
70%+   → Advanced
```

---

## 📊 Dashboard Features

| Feature             | Description                                           |
|---------------------|-------------------------------------------------------|
| 🎯 Skill Score Card  | Animated ring with score % and proficiency level      |
| 📈 Bar Chart         | High / Medium / Low demand breakdown of your skills   |
| 🕸️ Radar Chart      | Coverage across 6 skill categories                    |
| 💡 Recommendations  | Ranked missing skills sorted by demand + trend score  |
| 🗺️ Learning Roadmap | 3-phase personalized roadmap (1–6 months)             |
| 🔍 Skill Details    | Per-skill demand level predicted by Decision Tree     |

---

## 🎨 UI/UX

- **Theme**: Dark mode with indigo/violet accent palette
- **Fonts**: Syne (headings) + DM Sans (body)
- **Charts**: Recharts (Radar, Bar, Pie)
- **Responsive**: Works on mobile, tablet, and desktop
- **Animations**: Smooth fade-in, slide-up, and ring transitions

---

## 👨‍💻 User Flow

```
Signup → Login → Profile Setup (Name, Dept, College)
      → Skill Selection (Multi-select from 95 skills)
      → ML Prediction (DecisionTreeClassifier)
      → Dashboard (Score + Charts + Roadmap)
```

---

## 📝 Notes

- The frontend `index.html` is **fully self-contained** and works without npm or a build step.
- When the backend is offline, the app uses a **client-side JS ML fallback** that mirrors the Python logic.
- SQLite database is auto-created on first backend run at `database/skillgap.db`.
- Passwords are hashed with SHA-256 (no external auth libraries required).


*Built with ❤️ using React, Flask, and scikit-learn*
