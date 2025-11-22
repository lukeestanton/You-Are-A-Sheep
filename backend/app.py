from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.get_shorts import (
    InvalidGuessError,
    RoundNotFoundError,
    evaluate_guess,
    get_daily_dissident_path,
    get_game_round_data,
)
from services.theme_manager import get_daily_theme

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "From the CommentGuesser API"}


class GuessPayload(BaseModel):
    roundId: str
    commentId: str


@app.post("/api/submit-guess")
def submit_guess(payload: GuessPayload):
    try:
        result = evaluate_guess(payload.roundId, payload.commentId)
        return result
    except RoundNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except InvalidGuessError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/daily-challenge")
def get_daily_challenge():
    try:
        path_data = get_daily_dissident_path()
        return path_data
    except Exception as e:
        print(f"Error getting daily challenge: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate daily challenge.")
