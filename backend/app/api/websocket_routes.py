"""WebSocket routes for real-time communication."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..game.manager import manager

router = APIRouter()


@router.websocket("/ws/game/{game_id}")
async def game_ws(websocket: WebSocket, game_id: str) -> None:
    """Handle a websocket connection for the provided game session."""

    session = manager.get_session(game_id)
    if not session:
        await websocket.close()
        return

    await websocket.accept()
    player_id = session.add_player(websocket)
    await websocket.send_json({"type": "welcome", "playerId": player_id})
    print(f"Player {player_id} connected to game {game_id}")
    try:
        while True:
            data = await websocket.receive_json()
            session.update_player_state(player_id, data)
    except WebSocketDisconnect:
        session.remove_player(player_id)
        print(f"Player {player_id} disconnected from game {game_id}")
