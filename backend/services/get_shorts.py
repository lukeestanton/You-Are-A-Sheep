from dotenv import load_dotenv

load_dotenv()

import os
import random
from typing import Dict, List, Optional
from uuid import uuid4
import re
import json

import requests

from db import init_db, save_round_to_pool, get_daily_pool, get_pool_size

API_KEY = os.getenv("YOUTUBE_API_KEY")

if not API_KEY:
    raise EnvironmentError("YOUTUBE_API_KEY env variable not set.")

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
COMMENT_THREAD_URL = "https://www.googleapis.com/youtube/v3/commentThreads"

VIDEO_LINK = "https://www.youtube.com/watch?v="

ROUND_CACHE: Dict[str, Dict] = {}

init_db()

class RoundNotFoundError(Exception):
    """Raised when the round identifier cannot be located."""


class InvalidGuessError(Exception):
    """Raised when a guess references a comment outside of the round."""


def _parse_duration(duration_str: str) -> int:
    match = re.match(r'PT(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    
    minutes = int(match.group(1) or 0)
    seconds = int(match.group(2) or 0)
    
    return (minutes * 60) + seconds

def _get_video_details(video_id: str):
    params = {
        "part": "contentDetails,snippet,status",
        "id": video_id,
        "key": API_KEY,
    }
    
    try:
        response = requests.get("https://www.googleapis.com/youtube/v3/videos", params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        items = data.get("items", [])
        if not items:
            return None
            
        item = items[0]
        
        status = item.get("status", {})
        if not status.get("embeddable", True) or status.get("uploadStatus") != "processed":
            print(f"Skipping video {video_id}: Not embeddable or not processed.")
            return None
            
        duration_iso = item["contentDetails"]["duration"]
        duration_seconds = _parse_duration(duration_iso)
        
        return {
            "duration": duration_seconds,
            "title": item["snippet"]["title"]
        }
        
    except Exception as e:
        print(f"Error fetching video details: {e}")
        return None

def _get_shorts_batch(query: Optional[str] = None, max_results: int = 50) -> List[str]:
    """
    Fetches a batch of video IDs for a given query.
    This reduces API costs by performing ONE search for 50 videos.
    """
    default_search_terms = [
        "ludwig", "jschlatt", "squeex", "sambucha", "dougdoug",
        "northernlion", "penguinz0", "moistcr1tikal", "mrbeast", "veritasium"
    ]
    
    search_query = query if query else random.choice(default_search_terms)

    params = {
        "part": "snippet",
        "q": search_query,
        "key": API_KEY,
        "maxResults": max_results, 
        "type": "video",
        "videoDuration": "short",
        "order": "viewCount",
    }

    try:
        response = requests.get(SEARCH_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        items = data.get("items", [])
        if not items:
            print(f"No videos found for query '{search_query}'.")
            return []

        return [item["id"]["videoId"] for item in items]

    except Exception as e:
        print(f"Error fetching batch shorts: {e}")
        return []


def _get_top_comments(video_id: str, max_comments: int = 20) -> List[Dict]:
    params = {
        "part": "snippet",
        "videoId": video_id,
        "key": API_KEY,
        "order": "relevance",
        "maxResults": max_comments,
        "textFormat": "plainText",
    }

    comments: List[Dict] = []
    try:
        response = requests.get(COMMENT_THREAD_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        for item in data.get("items", []):
            top_level_comment = item["snippet"]["topLevelComment"]
            snippet = top_level_comment["snippet"]
            comment_text = snippet.get("textDisplay", "").strip()
            like_count = snippet.get("likeCount", 0)
            comment_id = top_level_comment.get("id")

            if not comment_text or not comment_id:
                continue
            
            if len(comment_text) < 5:
                continue
            
            if len(comment_text) > 140:
                continue

            comments.append({
                "id": comment_id,
                "text": comment_text,
                "points": like_count,
            })

        return comments

    except requests.exceptions.HTTPError as e:
        if e.response is not None:
            if e.response.status_code == 403 or "disabledComments" in str(e.response.content):
                print(f"Comments are disabled or forbidden for video {video_id}. Skipping.")
                return []
        raise

def get_game_round_data():
    populate_daily_pool(target_size=5)
    pool = get_daily_pool()
    if not pool:
        raise Exception("No pool")
    pool_item = random.choice(pool)
    return get_round_from_pool_data(pool_item, option_count=3)

def generate_round_data_batch(option_count: int, batch_size: int = 5):
    """
    Efficiently generates multiple rounds by fetching a large batch of video IDs first.
    """
    video_ids = _get_shorts_batch() # One API call for 50 candidates
    
    # Shuffle them so we don't always take the top ones
    random.shuffle(video_ids)
    
    generated_rounds = []
    
    for video_id in video_ids:
        if len(generated_rounds) >= batch_size:
            break
            
        # Check details (embeddable? duration?) - Cost: 1 unit
        details = _get_video_details(video_id)
        if not details or details["duration"] == 0:
            continue

        # Check comments - Cost: 1 unit
        comments = _get_top_comments(video_id, max_comments=40)
        
        if not comments or len(comments) < 8: 
            continue
        
        sorted_comments = sorted(comments, key=lambda x: x["points"], reverse=True)
        top_comment = sorted_comments[0]
        other_comments = sorted_comments[1:]
        
        if len(other_comments) < 5:
            continue

        round_id = str(uuid4())
        
        round_payload = {
            "roundId": round_id,
            "type": "dissident",
            "video_id": video_id,
            "video_link": VIDEO_LINK + video_id,
            "title": details["title"],
            "duration": details["duration"],
            "correct_comment_id": top_comment["id"],
            "top_comment": top_comment,
            "other_comments": other_comments[:20]
        }
        generated_rounds.append(round_payload)
        
    return generated_rounds


def populate_daily_pool(target_size: int = 20):
    """Ensures the daily pool has at least target_size videos."""
    current_size = get_pool_size()
    needed = target_size - current_size
    
    if needed <= 0:
        return

    print(f"Daily Pool: Generating {needed} new rounds...")
    
    # Instead of calling generate_round_data loop, we batch process
    # This will loop until we have enough, but using batched searches
    
    rounds_collected = 0
    attempts = 0
    
    while rounds_collected < needed and attempts < 5:
        attempts += 1
        new_rounds = generate_round_data_batch(option_count=6, batch_size=needed - rounds_collected)
        
        for r in new_rounds:
            save_round_to_pool(r, theme="Random")
            rounds_collected += 1
            
    if rounds_collected < needed:
        print(f"Warning: Could not fully populate pool. Got {rounds_collected}/{needed}")
            
def get_round_from_pool_data(pool_item: Dict, option_count: int):
    """Converts stored pool data into a playable round with specific option count."""
    round_id = pool_item["roundId"]
    
    top_comment = pool_item["top_comment"]
    other_comments = pool_item["other_comments"]
    
    distractors = random.sample(other_comments, min(len(other_comments), option_count - 1))
    
    options = [top_comment] + distractors
    random.shuffle(options)
    
    ROUND_CACHE[round_id] = {
        "type": "dissident",
        "video_id": pool_item["video_id"],
        "video_link": pool_item["video_link"],
        "correct_comment_id": top_comment["id"],
        "options": options
    }
    
    return {
        "roundId": round_id,
        "videoLink": pool_item["video_link"],
        "duration": pool_item["duration"],
        "options": [
            {"commentId": option["id"], "text": option["text"]}
            for option in options
        ],
    }

def get_daily_dissident_path():
    """
    Fetches 5 random unique videos from the daily pool.
    Generates the path with 6 -> 2 options.
    """
    
    populate_daily_pool(target_size=20)
    
    pool = get_daily_pool()
    
    if len(pool) < 5:
        raise Exception("Daily pool generation failed, not enough videos.")
        
    selected_rounds = random.sample(pool, 5)
    
    selected_rounds.sort(key=lambda x: x["duration"], reverse=True)
    
    rounds_config = [4, 4, 3, 3, 2]
    path_data = []
    
    for i, option_count in enumerate(rounds_config):
        pool_item = selected_rounds[i]
        game_round = get_round_from_pool_data(pool_item, option_count)
        path_data.append(game_round)
        
    return path_data


def evaluate_guess(round_id: str, comment_id: str):
    round_payload = ROUND_CACHE.get(round_id)

    if not round_payload:
        raise RoundNotFoundError("Round not found or has expired.")
    
    if round_payload.get("type") == "dissident":
        top_comment_id = round_payload["correct_comment_id"]
        
        is_win = comment_id != top_comment_id
        
        revealed_options = [
            {
                "commentId": option["id"],
                "text": option["text"],
                "likes": option["points"],
                "isTop": option["id"] == top_comment_id,
            }
            for option in round_payload["options"]
        ]
        revealed_options.sort(key=lambda x: x["likes"], reverse=True)
        
        return {
            "isCorrect": is_win,
            "selectedOptionId": comment_id,
            "options": revealed_options
        }

    return {} 
