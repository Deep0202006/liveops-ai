from fastapi import APIRouter, WebSocket
from typing import List

router = APIRouter()
clients: List[WebSocket] = []

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        while True:
            # Keep socket alive by listening for any text
            await ws.receive_text()
    except Exception:
        pass
    finally:
        if ws in clients:
            clients.remove(ws)

async def broadcast(message: dict):
    # Iterate copy to allow modifications during iterations
    to_remove = []
    for client in list(clients):
        try:
            await client.send_json(message)
        except Exception:
            to_remove.append(client)
    
    for client in to_remove:
        if client in clients:
            clients.remove(client)

