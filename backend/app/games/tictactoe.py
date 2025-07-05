from __future__ import annotations

from dataclasses import dataclass, field
import random
import uuid
from typing import Dict, List, Optional


@dataclass
class Game:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    board: List[str] = field(default_factory=lambda: [" "] * 9)
    current_player: str = "X"  # human is always X
    winner: Optional[str] = None

    def check_winner(self) -> Optional[str]:
        lines = [
            (0, 1, 2),
            (3, 4, 5),
            (6, 7, 8),
            (0, 3, 6),
            (1, 4, 7),
            (2, 5, 8),
            (0, 4, 8),
            (2, 4, 6),
        ]
        for a, b, c in lines:
            if self.board[a] == self.board[b] == self.board[c] != " ":
                return self.board[a]
        if " " not in self.board:
            return "draw"
        return None

    def make_move(self, position: int) -> None:
        if self.board[position] != " " or self.winner:
            raise ValueError("Invalid move")
        self.board[position] = "X"
        self.winner = self.check_winner()
        if not self.winner:
            self.computer_move()

    def computer_move(self) -> None:
        empty = [i for i, v in enumerate(self.board) if v == " "]
        if not empty:
            return
        choice = random.choice(empty)
        self.board[choice] = "O"
        self.winner = self.check_winner()


class GameStore:
    def __init__(self) -> None:
        self._games: Dict[str, Game] = {}

    def create_game(self) -> Game:
        game = Game()
        self._games[game.id] = game
        return game

    def get_game(self, game_id: str) -> Game:
        if game_id not in self._games:
            raise KeyError("Game not found")
        return self._games[game_id]


game_store = GameStore()
