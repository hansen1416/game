import os
import asyncio
import websockets
from PIL import Image
import io
import base64


CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'data')
 
# Server data
PORT = 5174
print("Server listening on Port " + str(PORT))

# A set of connected ws clients
connected = set()

# The main behavior function for this server
async def echo(websocket, path):
    print("A client just connected")
    # Store a copy of the connected client
    connected.add(websocket)
    # Handle incoming messages
    try:
        async for message in websocket:

            if message == 'render':

                # img_arr = np.load(os.path.join(DATA_DIR, 'pybullet.npy'))
                # img = Image.fromarray(img_arr, 'RGBA')

                # # Convert the Image object to a byte array
                # img_bytes = io.BytesIO()
                # img.save(img_bytes, format='PNG')
                # img_bytes = img_bytes.getvalue()

                # # Encode the byte array as base64
                # img_base64 = base64.b64encode(img_bytes).decode('utf-8')

                img = Image.open(os.path.join(DATA_DIR, 'pybullet.png'))

                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

                await websocket.send(img_str)
            else:
                print("Received message from client: " + message)
                # Send a response to all connected clients except sender

                # # Send a response to all connected clients except sender
                # for conn in connected:
                #     if conn != websocket:
                #         await conn.send("Someone said: " + message)

    # Handle disconnecting clients 
    except websockets.exceptions.ConnectionClosed as e:
        print("A client just disconnected")
    finally:
        connected.remove(websocket)

# Start the server
start_server = websockets.serve(echo, "0.0.0.0", PORT)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
