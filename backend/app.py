from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.get_shorts import (
    InvalidGuessError,
    RoundNotFoundError,
    evaluate_guess,
    get_game_round_data,
)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------


@app.get("/")
def read_root():
    return {"Hello": "From the CommentGuesser API"}


@app.get("/api/get-game-round")
def get_game_round():
    game_data = get_game_round_data()
    return game_data


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
