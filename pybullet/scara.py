import os
import math
import time

import pybullet as p
import pybullet_data

from pybullet_utils import display_joints_info

PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))

# client_id = p.connect(p.DIRECT)
client_id = p.connect(p.GUI)

# Set gravity
p.setGravity(0, 0, -9.8)


# The module pybullet_data provides many example Universal Robotic Description Format (URDF) files.
p.setAdditionalSearchPath(pybullet_data.getDataPath())


planeId = p.loadURDF(fileName=os.path.join(PROJECT_DIR, "urdf", "simpleplane.urdf"),
                     basePosition=[0, 0, -0.1],
                     physicsClientId=client_id)


robot = p.loadURDF(fileName=os.path.join(PROJECT_DIR, "urdf", "scara_robot.urdf"),
                   basePosition=[0.5, 0.5, -0.1],
                   physicsClientId=client_id)

# Define the camera rotation
cameraDistance = 4.0
cameraYaw = 0
cameraPitch = -40

# Amount of time to sleep each step
timeStep = 1. / 240.

display_joints_info(robot, client_id=client_id)

endEffectorLinkIndex = p.getNumJoints(robot, physicsClientId=client_id) - 1

targetPos = (1, 0, 1)

# Calculate the inverse kinematics
jointPoses = p.calculateInverseKinematics(
    robot, endEffectorLinkIndex, targetPos)

print(jointPoses)

while False:

    # Update the camera rotation
    # cameraYaw += 0.1
    # p.resetDebugVisualizerCamera(
    #     cameraDistance, cameraYaw, cameraPitch, [0, 0, 0])

    target_arm_1 = -0.456
    target_arm_2 = 0.24

    # two-degree-of-freedom (2-DOF) scara robot model in URDF format with details
    # about the joints and axis of rotation.
    p.setJointMotorControlArray(robot, [1, 2], p.POSITION_CONTROL, targetPositions=[
                                target_arm_1, target_arm_2])

    # Step the simulation
    p.stepSimulation(physicsClientId=client_id)

    # Sleep for a bit
    time.sleep(timeStep)
