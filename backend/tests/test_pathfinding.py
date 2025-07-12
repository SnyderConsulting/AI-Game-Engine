import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.game.world import SEGMENT_SIZE, create_wall, find_path
from app.game.models import ZombieState, PlayerState


def test_find_path_around_wall():
    start = ZombieState(x=0, y=0)
    goal = PlayerState(x=SEGMENT_SIZE * 2 + 10, y=10)
    walls = [create_wall(1, 0)]
    path = find_path(start, goal, walls, SEGMENT_SIZE * 3, SEGMENT_SIZE * 2)
    assert path[0] == (0, 0)
    assert path[-1] == (2, 0)
    assert (1, 0) not in path
    assert len(path) > 2
