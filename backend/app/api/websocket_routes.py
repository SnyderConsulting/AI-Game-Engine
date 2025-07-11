"""WebSocket routes for real-time communication."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..game.manager import manager

router = APIRouter()


@router.websocket("/ws/game")
async def game_ws(websocket: WebSocket) -> None:
    """Handle a websocket connection from a game client."""

    await websocket.accept()
    player_id = str(id(websocket))
    manager.add_player(player_id, websocket)
    print(f"Player {player_id} connected")
    try:
        while True:
            data = await websocket.receive_json()
            manager.update_player_state(player_id, data)
    except WebSocketDisconnect:
        manager.remove_player(player_id)
        print(f"Player {player_id} disconnected")
