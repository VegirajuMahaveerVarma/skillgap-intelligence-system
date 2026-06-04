"""
ML Model: Decision Tree Classifier for Skill Demand Prediction
Trains on skill dataset and saves model + encoders using joblib
"""

import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import json

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "skill_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "skill_model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "encoders.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "model_metadata.json")


def train_and_save_model():
    """Train Decision Tree on skill dataset and persist artifacts."""

    print("📂 Loading dataset...")
    df = pd.read_csv(DATASET_PATH)
    print(f"   Loaded {len(df)} rows × {len(df.columns)} columns")
    print(f"   Demand distribution:\n{df['demand_level'].value_counts()}\n")

    # ── Encode categorical columns ────────────────────────────────────────────
    categorical_cols = ["skill", "department", "sector"]
    encoders = {}

    for col in categorical_cols:
        le = LabelEncoder()
        df[f"{col}_enc"] = le.fit_transform(df[col])
        encoders[col] = le

    # Encode target
    target_encoder = LabelEncoder()
    df["demand_enc"] = target_encoder.fit_transform(df["demand_level"])
    encoders["demand_level"] = target_encoder

    # ── Feature matrix ────────────────────────────────────────────────────────
    feature_cols = [
        "department_enc",
        "sector_enc",
        "job_frequency",
        "trend_score",
        "growth_rate",
        "average_salary_score",
        "emerging_role",
        "required_experience",
    ]

    X = df[feature_cols].values
    y = df["demand_enc"].values

    # ── Train / Test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    # ── Decision Tree + GridSearchCV ─────────────────────────────────────────
    print("🤖 Finding best hyperparameters with GridSearchCV...")
    from sklearn.model_selection import GridSearchCV, StratifiedKFold

    param_grid = {
        "max_depth":         [3, 4, 5, 6, 8, 10, None],
        "min_samples_split": [2, 3, 4, 5],
        "min_samples_leaf":  [1, 2, 3, 4],
        "criterion":         ["gini", "entropy"],
        "class_weight":      ["balanced", None],
        "splitter":          ["best", "random"],
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator  = DecisionTreeClassifier(random_state=42),
        param_grid = param_grid,
        cv         = cv,
        scoring    = "accuracy",
        n_jobs     = -1,
        verbose    = 0,
    )
    grid_search.fit(X_train, y_train)
    print(f"   Best params: {grid_search.best_params_}")
    print(f"   Best CV score: {grid_search.best_score_:.4f}")
    clf = grid_search.best_estimator_
    clf.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    # Cross-val on full dataset for robust score
    from sklearn.model_selection import cross_val_score
    cv_full = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y, cv=cv_full, scoring="accuracy")
    print(f"   10-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"✅ Test Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=target_encoder.classes_,
        )
    )

    # ── Persist artifacts ─────────────────────────────────────────────────────
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    print(f"💾 Model saved → {MODEL_PATH}")
    print(f"💾 Encoders saved → {ENCODERS_PATH}")

    # ── Save metadata for API use ─────────────────────────────────────────────
    # Build department → skills mapping
    dept_skills = {}
    for dept in df["department"].unique():
        skills = df[df["department"] == dept]["skill"].tolist()
        dept_skills[dept] = skills

    metadata = {
        "accuracy": round(acc, 4),
        "feature_cols": feature_cols,
        "demand_classes": target_encoder.classes_.tolist(),
        "departments": df["department"].unique().tolist(),
        "dept_skills": dept_skills,
        "dataset_stats": {
            "total_skills": len(df),
            "high_demand": int((df["demand_level"] == "High").sum()),
            "medium_demand": int((df["demand_level"] == "Medium").sum()),
            "low_demand": int((df["demand_level"] == "Low").sum()),
        },
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"💾 Metadata saved → {METADATA_PATH}")

    return clf, encoders, metadata


if __name__ == "__main__":
    train_and_save_model()
    print("\n🎉 Model training complete!")
