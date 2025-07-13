import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.game.manager import GameSession
from app.game.models import PlayerState, ZombieState, PLAYER_MAX_HEALTH


def test_zombie_damage_player():
    session = GameSession()
    session.state.players = {"p": PlayerState(x=50, y=50)}
    session.state.zombies = [ZombieState(x=50, y=50)]
    session.update_world()
    player = session.state.players["p"]
    assert player.health == PLAYER_MAX_HEALTH - 1
    assert player.damage_cooldown > 0
    assert session.state.zombies[0].attack_cooldown > 0


def test_input_ignored_after_death():
    session = GameSession()
    session.state.players = {"p": PlayerState(x=10, y=10, health=0)}
    session.update_player_state("p", {"action": "move", "moveX": 5, "moveY": 0})
    player = session.state.players["p"]
    assert player.x == 10
