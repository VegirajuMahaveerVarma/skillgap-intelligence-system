"""
Database initialization and helper utilities for SQLite.
Updated: added total_dept_skills, missing_skills_count, student_skills columns.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "database", "skillgap.db")


def get_connection():
    """Return a SQLite connection with row_factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_connection()
    cursor = conn.cursor()

    # Users
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Profiles (1:1 with users)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            full_name TEXT,
            college TEXT,
            department TEXT,
            graduation_year INTEGER,
            avatar_initials TEXT,
            gmail TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # User skills — dept-validated
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill TEXT NOT NULL,
            department TEXT,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Analysis results — all fields needed by dashboard
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            skill_score REAL,
            level TEXT,
            demand_breakdown TEXT,
            recommendations TEXT,
            roadmap TEXT,
            radar_data TEXT,
            trend_data TEXT DEFAULT '{}',
            total_dept_skills INTEGER DEFAULT 0,
            missing_skills_count INTEGER DEFAULT 0,
            student_skills TEXT DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    _migrate(cursor, conn)
    conn.close()
    print("✅ Database initialized.")


def _migrate(cursor, conn):
    """Safely add new columns to existing databases without losing data."""
    migrations = [
        ("user_skills",      "department TEXT"),
        ("profiles",          "gmail TEXT"),
        ("analysis_results", "trend_data TEXT DEFAULT '{}'"),
        ("analysis_results", "total_dept_skills INTEGER DEFAULT 0"),
        ("analysis_results", "missing_skills_count INTEGER DEFAULT 0"),
        ("analysis_results", "student_skills TEXT DEFAULT '[]'"),
    ]
    for table, col_def in migrations:
        col_name = col_def.split()[0]
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
            conn.commit()
            print(f"  ↳ Migrated: added {col_name} to {table}")
        except Exception:
            pass  # Column already exists — safe to ignore
