import os
import pybullet as p
import pybullet_data
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))

def render(pybullet_scene):
    width = 320
    height = 200
    img_arr = pybullet_scene.getCameraImage(
        width,
        height,
        viewMatrix=pybullet_scene.computeViewMatrixFromYawPitchRoll(
            cameraTargetPosition=[0, 0, 0],
            distance=1,
            yaw=0,
            pitch=0,
            roll=0,
            upAxisIndex=2,
        ),
        projectionMatrix=pybullet_scene.computeProjectionMatrixFOV(
            fov=60,
            aspect=width/height,
            nearVal=0.01,
            farVal=100,
        ),
        shadow=True,
        lightDirection=[1, 1, 1],
    )

    width, height, rgba, depth, mask = img_arr
    
    rgba = np.array(rgba)
    depth = np.array(depth)
    mask = np.array(mask)

    # # Count the occurrence of each item
    # unique, counts = np.unique(rgba, return_counts=True)

    # print(unique)
    # print(counts)

    # # print(width)
    # # print(height)
    # print(rgba)
    # print(depth)
    # print(mask)
    np.save(os.path.join(os.path.dirname(CURRENT_DIR), 'data', 'pybullet.npy'), rgba)

client_id = p.connect(p.DIRECT)

# The module pybullet_data provides many example Universal Robotic Description Format (URDF) files.
p.setAdditionalSearchPath(pybullet_data.getDataPath())



car_urdf = os.path.join(CURRENT_DIR, "urdf", "simplecar.urdf")
car_id = p.loadURDF(fileName=car_urdf,
                        basePosition=[0, 0, 0.1],
                        physicsClientId=client_id)

plane_urdf = os.path.join(CURRENT_DIR,"urdf", "simpleplane.urdf")
planeId = p.loadURDF(fileName=plane_urdf,
                        basePosition=[0, 0, 0.1],
                        physicsClientId=client_id)


# p.resetSimulation(client_id)

ct = 0

while ct < 300:

    ct += 1

    p.stepSimulation(physicsClientId=client_id)
# p.stepSimulation(physicsClientId=client_id)

render(p)