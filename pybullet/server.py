import os
import pybullet as p
import pybullet_data
from PIL import Image
from stable_baselines3.common.env_checker import check_env
from gymenv import SimpleDrivingEnv
from stable_baselines3 import PPO
import gymnasium as gym
import numpy as np
from dataclasses import dataclass

PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))


@dataclass
class Joint:
    index: int
    name: str
    type: int
    gIndex: int
    uIndex: int
    flags: int
    damping: float
    friction: float
    lowerLimit: float
    upperLimit: float
    maxForce: float
    maxVelocity: float
    linkName: str
    axis: tuple
    parentFramePosition: tuple
    parentFrameOrientation: tuple
    parentIndex: int

    def __post_init__(self):
        self.name = str(self.name, 'utf-8')
        self.linkName = str(self.linkName, 'utf-8')


def render(pybullet_scene):
    width = 320
    height = 200

    pybullet_scene.setRealTimeSimulation(1)

    img_arr = pybullet_scene.getCameraImage(
        width,
        height,
        viewMatrix=pybullet_scene.computeViewMatrixFromYawPitchRoll(
            cameraTargetPosition=[0, 0, 0],
            distance=2,
            yaw=45,
            pitch=-30,
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

    width, height, rgbPixels, depth, mask = img_arr

    # Make a new image object from the bytes
    img = Image.frombytes('RGBA', (width, height), bytes(rgbPixels))

    img.save(os.path.join(os.path.dirname(PROJECT_DIR), 'data', 'pybullet.png'))


def _train():
    env = SimpleDrivingEnv()

    # check_env(env)

    env.reset()

    model = PPO('MlpPolicy', env, verbose=1,
                tensorboard_log=os.path.join(PROJECT_DIR, 'logs'))

    TIMESTEPS = 10000

    model.learn(total_timesteps=TIMESTEPS,
                reset_num_timesteps=False, tb_log_name=f"{TIMESTEPS}")


def demo():

    client_id = p.connect(p.DIRECT)

    # The module pybullet_data provides many example Universal Robotic Description Format (URDF) files.
    p.setAdditionalSearchPath(pybullet_data.getDataPath())

    # car_urdf = os.path.join(PROJECT_DIR, "urdf", "simplecar.urdf")
    # car_id = p.loadURDF(fileName=car_urdf,
    #                     basePosition=[0, 0, 0.1],
    #                     physicsClientId=client_id)

    arm_urdf = os.path.join(PROJECT_DIR, "urdf", "simplearm.urdf")
    arm_id = p.loadURDF(fileName=arm_urdf,
                        basePosition=[0, 0, 0.1],
                        physicsClientId=client_id)

    plane_urdf = os.path.join(PROJECT_DIR, "urdf", "simpleplane.urdf")
    planeId = p.loadURDF(fileName=plane_urdf,
                         basePosition=[0, 0, 0.1],
                         physicsClientId=client_id)

    # n_joints = p.getNumJoints(arm_id, physicsClientId=client_id)

    # print("==========joints info=========")

    # for i in range(n_joints):
    #     joint = Joint(*p.getJointInfo(arm_id, i, physicsClientId=client_id))
    #     print(joint)

    p.setJointMotorControlArray(arm_id, [0],
                                controlMode=p.POSITION_CONTROL,
                                targetPositions=[2],
                                physicsClientId=client_id)

    # action_space = gym.spaces.box.Box(low=np.array([0, -.6], dtype=np.float32),high=np.array([1, .6], dtype=np.float32))

    # print(action_space)
    # print(action_space.sample())

    ct = 0

    while ct < 1:

        ct += 1

        p.stepSimulation(physicsClientId=client_id)
    # p.stepSimulation(physicsClientId=client_id)

    render(p)


demo()
