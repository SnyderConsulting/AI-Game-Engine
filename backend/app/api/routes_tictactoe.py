from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..games.tictactoe import Game, game_store

router = APIRouter(prefix="/tictactoe", tags=["tictactoe"])


class Move(BaseModel):
    game_id: str
    position: int


@router.post("/new", response_model=Game)
async def new_game():
    return game_store.create_game()


@router.post("/move", response_model=Game)
async def make_move(move: Move):
    try:
        game = game_store.get_game(move.game_id)
        game.make_move(move.position)
        return game
    except KeyError:
        raise HTTPException(status_code=404, detail="Game not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid move")
