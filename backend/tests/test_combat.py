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
