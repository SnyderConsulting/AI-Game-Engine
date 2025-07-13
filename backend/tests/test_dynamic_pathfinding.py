import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.game.world import SEGMENT_SIZE, find_path
from app.game.models import ZombieState, PlayerState


def test_zombies_avoid_each_other():
    start = ZombieState(x=0, y=SEGMENT_SIZE / 2)
    goal = PlayerState(x=SEGMENT_SIZE * 2, y=SEGMENT_SIZE / 2)
    blocker = ZombieState(x=SEGMENT_SIZE, y=SEGMENT_SIZE / 2)
    path = find_path(
        start,
        goal,
        [],
        SEGMENT_SIZE * 3,
        SEGMENT_SIZE * 2,
        dynamic_blocks=[(int(blocker.x // SEGMENT_SIZE), int(blocker.y // SEGMENT_SIZE))],
    )
    assert (1, 0) not in path
