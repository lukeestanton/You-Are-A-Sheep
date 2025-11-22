import sqlite3
import json
from datetime import date
from typing import List, Dict, Optional

DB_PATH = "game_data.db"

def init_db():
    """Initialize the database tables."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS daily_pool (
            date TEXT,
            round_id TEXT PRIMARY KEY,
            round_data JSON,
            theme TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def save_round_to_pool(round_data: Dict, theme: str):
    """Saves a generated round to today's pool."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    today = date.today().isoformat()
    
    c.execute('''
        INSERT OR REPLACE INTO daily_pool (date, round_id, round_data, theme)
        VALUES (?, ?, ?, ?)
    ''', (today, round_data['roundId'], json.dumps(round_data), theme))
    
    conn.commit()
    conn.close()

def get_daily_pool(theme_filter: Optional[str] = None) -> List[Dict]:
    """Retrieves all rounds available for today."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    today = date.today().isoformat()
    
    query = "SELECT round_data FROM daily_pool WHERE date = ?"
    params = [today]
    
    if theme_filter:
        query += " AND theme = ?"
        params.append(theme_filter)
        
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    
    return [json.loads(row[0]) for row in rows]

def get_pool_size() -> int:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    today = date.today().isoformat()
    c.execute("SELECT COUNT(*) FROM daily_pool WHERE date = ?", (today,))
    count = c.fetchone()[0]
    conn.close()
    return count

