import os
import pybullet as p
import pybullet_data
import numpy as np

def render(pybullet_scene):
    width = 320
    height = 200
    img_arr = pybullet_scene.getCameraImage(
        width,
        height,
        viewMatrix=pybullet_scene.computeViewMatrixFromYawPitchRoll(
            cameraTargetPosition=[0, 0, 0],
            distance=10,
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

    counts = np.bincount(rgba)

    print(counts)

    # print(width)
    # print(height)
    print(rgba)
    print(depth)
    print(mask)

client_id = p.connect(p.DIRECT)


car_urdf = os.path.join("urdf", "simplecar.urdf")
car_id = p.loadURDF(fileName=car_urdf,
                        basePosition=[0, 0, 0.1],
                        physicsClientId=client_id)


p.resetSimulation(client_id)

ct = 0

while ct < 1:

    ct += 1

    p.stepSimulation()


render(p)