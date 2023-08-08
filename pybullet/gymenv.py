
import math
import os
import pybullet as p
import numpy as np
import gymnasium as gym


PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))


class Car:
    def __init__(self, client):
        self.client = client
        f_name = os.path.join(PROJECT_DIR, "urdf", "simplecar.urdf")
        self.car = p.loadURDF(fileName=f_name,
                              basePosition=[0, 0, 0.1],
                              physicsClientId=client)

        # Joint indices as found by p.getJointInfo()
        self.steering_joints = [0, 2]
        self.drive_joints = [1, 3, 4, 5]
        # Joint speed
        self.joint_speed = 0
        # Drag constants
        self.c_rolling = 0.2
        self.c_drag = 0.01
        # Throttle constant increases "speed" of the car
        self.c_throttle = 20

    def get_ids(self):
        return self.car, self.client

    def apply_action(self, action):
        # Expects action to be two dimensional
        throttle, steering_angle = action

        # Clip throttle and steering angle to reasonable values
        throttle = min(max(throttle, 0), 1)
        steering_angle = max(min(steering_angle, 0.6), -0.6)

        # Set the steering joint positions
        p.setJointMotorControlArray(self.car, self.steering_joints,
                                    controlMode=p.POSITION_CONTROL,
                                    targetPositions=[steering_angle] * 2,
                                    physicsClientId=self.client)

        # Calculate drag / mechanical resistance ourselves
        # Using velocity control, as torque control requires precise models
        friction = -self.joint_speed * (self.joint_speed * self.c_drag +
                                        self.c_rolling)
        acceleration = self.c_throttle * throttle + friction
        # Each time step is 1/240 of a second
        self.joint_speed = self.joint_speed + 1/30 * acceleration
        if self.joint_speed < 0:
            self.joint_speed = 0

        # Set the velocity of the wheel joints directly
        p.setJointMotorControlArray(
            bodyUniqueId=self.car,
            jointIndices=self.drive_joints,
            controlMode=p.VELOCITY_CONTROL,
            targetVelocities=[self.joint_speed] * 4,
            forces=[1.2] * 4,
            physicsClientId=self.client)

    def get_observation(self):
        # Get the position and orientation of the car in the simulation
        pos, ang = p.getBasePositionAndOrientation(self.car, self.client)
        ang = p.getEulerFromQuaternion(ang)
        ori = (math.cos(ang[2]), math.sin(ang[2]))
        pos = pos[:2]
        # Get the velocity of the car
        vel = p.getBaseVelocity(self.car, self.client)[0][0:2]

        # Concatenate position, orientation, velocity
        observation = (pos + ori + vel)

        return observation


class Goal:
    def __init__(self, client, base):
        f_name = os.path.join(PROJECT_DIR, "urdf", "simplegoal.urdf")
        self.goal_id = p.loadURDF(fileName=f_name,
                                  basePosition=[base[0], base[1], 0],
                                  physicsClientId=client)


class Plane:
    def __init__(self, client):
        f_name = os.path.join(PROJECT_DIR, "urdf", "simpleplane.urdf")
        self.plane_id = p.loadURDF(fileName=f_name,
                                   basePosition=[0, 0, 0],
                                   physicsClientId=client)


class SimpleDrivingEnv(gym.Env):
    metadata = {'render.modes': ['human']}

    def __init__(self):
        self.action_space = gym.spaces.box.Box(
            low=np.array([0, -.6], dtype=np.float32),
            high=np.array([1, .6], dtype=np.float32))
        self.observation_space = gym.spaces.box.Box(
            low=np.array([-10, -10, -1, -1, -5, -5, -10, -10], dtype=np.float32),
            high=np.array([10, 10, 1, 1, 5, 5, 10, 10], dtype=np.float32))
        self.np_random = np.random

        self.client = p.connect(p.DIRECT)
        # Reduce length of episodes for RL algorithms
        p.setTimeStep(1/30, self.client)

        self.car = None
        self.goal = None
        self.done = False
        self.prev_dist_to_goal = None
        self.rendered_img = None
        self.render_rot_matrix = None
        self.reset()

    def step(self, action):
        # Feed action to the car and get observation of car's state
        self.car.apply_action(action)
        p.stepSimulation()
        car_ob = self.car.get_observation()

        # Compute reward as L2 change in distance to goal
        dist_to_goal = math.sqrt(((car_ob[0] - self.goal[0]) ** 2 +
                                  (car_ob[1] - self.goal[1]) ** 2))
        reward = max(self.prev_dist_to_goal - dist_to_goal, 0)
        self.prev_dist_to_goal = dist_to_goal

        # Done by running off boundaries
        if (car_ob[0] >= 10 or car_ob[0] <= -10 or
                car_ob[1] >= 10 or car_ob[1] <= -10):
            self.done = True
        # Done by reaching goal
        elif dist_to_goal < 1:
            self.done = True
            reward = 50

        ob = np.array(car_ob + self.goal, dtype=np.float32)
        return ob, reward, self.done, False, dict()

    def reset(self, seed=None):
        p.resetSimulation(self.client)
        p.setGravity(0, 0, -10)
        # Reload the plane and car
        Plane(self.client)
        self.car = Car(self.client)

        # Set the goal to a random target
        x = (self.np_random.uniform(5, 9) if self.np_random.randint(2) else
             self.np_random.uniform(-5, -9))
        y = (self.np_random.uniform(5, 9) if self.np_random.randint(2) else
             self.np_random.uniform(-5, -9))
        self.goal = (x, y)
        self.done = False

        # Visual element of the goal
        Goal(self.client, self.goal)

        # Get observation to return
        car_ob = self.car.get_observation()

        self.prev_dist_to_goal = math.sqrt(((car_ob[0] - self.goal[0]) ** 2 +
                                           (car_ob[1] - self.goal[1]) ** 2))
        return np.array(car_ob + self.goal, dtype=np.float32), {}

    # def render(self, mode='human'):
    #     if self.rendered_img is None:
    #         self.rendered_img = plt.imshow(np.zeros((100, 100, 4)))

    #     # Base information
    #     car_id, client_id = self.car.get_ids()
    #     proj_matrix = p.computeProjectionMatrixFOV(fov=80, aspect=1,
    #                                                nearVal=0.01, farVal=100)
    #     pos, ori = [list(l) for l in
    #                 p.getBasePositionAndOrientation(car_id, client_id)]
    #     pos[2] = 0.2

    #     # Rotate camera direction
    #     rot_mat = np.array(p.getMatrixFromQuaternion(ori)).reshape(3, 3)
    #     camera_vec = np.matmul(rot_mat, [1, 0, 0])
    #     up_vec = np.matmul(rot_mat, np.array([0, 0, 1]))
    #     view_matrix = p.computeViewMatrix(pos, pos + camera_vec, up_vec)

    #     # Display image
    #     frame = p.getCameraImage(100, 100, view_matrix, proj_matrix)[2]
    #     frame = np.reshape(frame, (100, 100, 4))
    #     self.rendered_img.set_data(frame)
    #     plt.draw()
    #     plt.pause(.00001)

    def render(self):
        pass

    def close(self):
        p.disconnect(self.client)
