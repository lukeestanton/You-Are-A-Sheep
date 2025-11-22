import argparse
import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
from services.get_shorts import populate_daily_pool
from db import init_db

def stock_database(days: int, target_size: int):
    init_db()
    start_date = date.today()
    
    print(f"Starting stock process...")
    print(f"Target: {days} days, {target_size} rounds per day.")
    print(f"Start Date: {start_date}")
    
    # Approx 30 units cost per valid round (very rough estimate: 1 search (100) / 5 rounds + checks)
    # If we assume worst case:
    # Search (100) gets 50 videos. 
    # We check all 50. 50 * (1 detail + 1 comment) = 100 units.
    # Total 200 units for batch.
    # If yield is low (e.g. 5 rounds from 50 videos), then 200 units / 5 rounds = 40 units/round.
    # 10,000 units / 40 = 250 rounds max per day.
    
    total_rounds = days * target_size
    print(f"Total rounds to generate: {total_rounds}")
    if total_rounds > 250:
        print("WARNING: This may exceed the daily YouTube API quota of 10,000 units.")
        print("Consider running for fewer days or reducing batch size.")
        confirm = input("Continue? (y/n): ")
        if confirm.lower() != 'y':
            print("Aborted.")
            return

    for i in range(days):
        target_date_str = (start_date + timedelta(days=i)).isoformat()
        print(f"\n[{i+1}/{days}] Processing date: {target_date_str}")
        
        try:
            populate_daily_pool(target_size=target_size, target_date=target_date_str)
            print(f"Successfully stocked {target_date_str}.")
        except Exception as e:
            print(f"Error stocking for {target_date_str}: {e}")
        
        print("Sleeping for 2 seconds...")
        time.sleep(2)

    print("\nStocking complete!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stock the CommentGuesser database.")
    parser.add_argument("--days", type=int, default=7, help="Number of days to stock (starting today)")
    parser.add_argument("--size", type=int, default=20, help="Target pool size per day")
    
    args = parser.parse_args()
    
    stock_database(args.days, args.size)

