import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import main


def test_start_invokes_uvicorn_run():
    with patch("uvicorn.run") as run_mock:
        main.start()
        run_mock.assert_called_with(
            "app.main:app", host="0.0.0.0", port=8000, reload=True
        )
