import os
import math
import time

import pybullet as p
import pybullet_data

PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))


client_id = p.connect(p.DIRECT)
# client_id = p.connect(p.GUI)

# The module pybullet_data provides many example Universal Robotic Description Format (URDF) files.
p.setAdditionalSearchPath(pybullet_data.getDataPath())

# car_urdf = os.path.join(PROJECT_DIR, "urdf", "simplecar.urdf")
# car_id = p.loadURDF(fileName=car_urdf,
#                     basePosition=[0, 0, 0.1],
#                     physicsClientId=client_id)

arm_urdf = os.path.join(PROJECT_DIR, "urdf", "simplearm.urdf")
arm_id = p.loadURDF(fileName=arm_urdf,
                    basePosition=[0.5, 0, 0.15],
                    physicsClientId=client_id)

plane_urdf = os.path.join(PROJECT_DIR, "urdf", "simpleplane.urdf")
planeId = p.loadURDF(fileName=plane_urdf,
                     basePosition=[0, 0, -0.1],
                     physicsClientId=client_id)


# Set gravity
p.setGravity(0, 0, -9.8)

# Define the camera rotation
cameraDistance = 4.0
cameraYaw = 0
cameraPitch = -40

# Get the joint indices
jointIndices = [i for i in range(p.getNumJoints(arm_id))]
# print(jointIndices)

# Set the initial joint positions
jointPositions = [0 for _ in jointIndices]
# print(jointPositions)

# Duration of one cycle (in seconds)
cycleDuration = 2.0

# Amount of time to sleep each step
timeStep = 1. / 240.

zahlen = 0
targetPos = [0.5, 0.2, 0.3]

while True:

    zahlen += 1

    # for i in range(len(jointIndices)):
    # for i in range(1):
    for i in [0]:
        # Calculate the new joint position
        # jointPositions[i] = math.sin(
        #     2.0 * math.pi * (time.time() % cycleDuration) / cycleDuration)

        # print(jointPositions[i])

        # You need to know the index of the end effector link. Let's say it's the last link
        endEffectorLinkIndex = i

        # Calculate the inverse kinematics
        jointPoses = p.calculateInverseKinematics(
            arm_id, endEffectorLinkIndex, targetPos)

        print(jointPoses)

        cartesian_pos, cartesian_orientation = p.getLinkState(
            arm_id, i, physicsClientId=client_id)[:2]

        print(cartesian_pos)
        # print(cartesian_orientation)

        # Set the new joint position
        # p.setJointMotorControl2(
        #     arm_id, jointIndices[i], p.POSITION_CONTROL, jointPositions[i])

    # # Update the camera rotation
    # cameraYaw += 0.1
    # p.resetDebugVisualizerCamera(
    #     cameraDistance, cameraYaw, cameraPitch, [0, 0, 0])

    # Step the simulation
    p.stepSimulation(physicsClientId=client_id)

    # Sleep for a bit
    time.sleep(timeStep)
