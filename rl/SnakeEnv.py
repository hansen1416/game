import gymnasium as gym
from gymnasium import spaces
import numpy as np
import cv2
import random
import time
from collections import deque
from stable_baselines3.common.env_checker import check_env
from stable_baselines3 import PPO
from stable_baselines3.common.evaluation import evaluate_policy
import os


def collision_with_apple(apple_position, score):
    """
    when snake eats apple, reposition the apple and increase the score by 1
    """
    apple_position = [random.randrange(1, 50)*10, random.randrange(1, 50)*10]
    score += 1
    return apple_position, score


def collision_with_boundaries(snake_head):
    """
    if snake collides with boundaries, terminate the game
    """
    if snake_head[0] >= 500 or snake_head[0] < 0 or snake_head[1] >= 500 or snake_head[1] < 0:
        return 1
    else:
        return 0


def collision_with_self(snake_position):
    """
    when snake collides with its body, terminate the game
    """
    snake_head = snake_position[0]
    if snake_head in snake_position[1:]:
        return 1
    else:
        return 0


SNAKE_LEN_GOAL = 30
# 4 moves possible for a snake game
N_DISCRETE_ACTIONS = 4


class SnekEnv(gym.Env):
    """Custom Environment that follows gym interface"""

    def __init__(self):

        super(SnekEnv, self).__init__()
        # Define action and observation space
        # They must be gym.spaces objects
        # Example when using discrete actions:
        self.action_space = spaces.Discrete(N_DISCRETE_ACTIONS)
        # Example for using image as input (channel-first; channel-last also works):
        self.observation_space = spaces.Box(low=-500, high=500,
                                            shape=(5+SNAKE_LEN_GOAL,), dtype=np.int64)

    def step(self, action):

        self.prev_actions.append(action)
        cv2.imshow('a', self.img)
        cv2.waitKey(1)
        self.img = np.zeros((500, 500, 3), dtype='uint8')
        # Display Apple
        cv2.rectangle(self.img, (self.apple_position[0], self.apple_position[1]), (
            self.apple_position[0]+10, self.apple_position[1]+10), (0, 0, 255), 3)
        # Display Snake
        for position in self.snake_position:
            cv2.rectangle(self.img, (position[0], position[1]),
                          (position[0]+10, position[1]+10), (0, 255, 0), 3)

        # Takes step after fixed time
        t_end = time.time() + 0.05
        k = -1
        while time.time() < t_end:
            if k == -1:
                k = cv2.waitKey(1)
            else:
                continue

        button_direction = action
        # Change the head position based on the button direction
        if button_direction == 1:
            self.snake_head[0] += 10
        elif button_direction == 0:
            self.snake_head[0] -= 10
        elif button_direction == 2:
            self.snake_head[1] += 10
        elif button_direction == 3:
            self.snake_head[1] -= 10

        apple_reward = 0
        # Increase Snake length on eating apple
        if self.snake_head == self.apple_position:
            self.apple_position, self.score = collision_with_apple(
                self.apple_position, self.score)
            self.snake_position.insert(0, list(self.snake_head))
            apple_reward = 10000

        else:
            self.snake_position.insert(0, list(self.snake_head))
            self.snake_position.pop()

        # On collision kill the snake and print the score
        if collision_with_boundaries(self.snake_head) == 1 or collision_with_self(self.snake_position) == 1:
            font = cv2.FONT_HERSHEY_SIMPLEX
            self.img = np.zeros((500, 500, 3), dtype='uint8')
            cv2.putText(self.img, 'Your Score is {}'.format(
                self.score), (140, 250), font, 1, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.imshow('a', self.img)
            self.done = True

        # add euclidean distance
        euclidean_dist_to_apple = np.linalg.norm(
            np.array(self.snake_head) - np.array(self.apple_position))
        # self.total_reward = len(self.snake_position) - \
        #     3 - euclidean_dist_to_apple

        self.total_reward = (
            (250 - euclidean_dist_to_apple) + apple_reward)/100

        # self.total_reward = len(self.snake_position) - 3  # start length is 3

        self.reward = self.total_reward - self.prev_reward
        self.prev_reward = self.total_reward

        if self.done:
            self.reward = -10
        info = {}

        head_x = self.snake_head[0]
        head_y = self.snake_head[1]

        snake_length = len(self.snake_position)
        apple_delta_x = self.apple_position[0] - head_x
        apple_delta_y = self.apple_position[1] - head_y

        # create observation:

        observation = [head_x, head_y, apple_delta_x,
                       apple_delta_y, snake_length] + list(self.prev_actions)
        observation = np.array(observation)

        return observation, self.reward, self.done, False, info

    def reset(self, seed=None, options=None):
        """
        Important: the observation must be a numpy array
        :return: (np.array)
        """
        super().reset(seed=seed, options=options)

        self.img = np.zeros((500, 500, 3), dtype='uint8')
        # Initial Snake and Apple position
        self.snake_position = [[250, 250], [240, 250], [230, 250]]
        self.apple_position = [random.randrange(
            1, 50)*10, random.randrange(1, 50)*10]
        self.score = 0
        self.prev_button_direction = 1
        self.button_direction = 1
        self.snake_head = [250, 250]

        self.prev_reward = 0

        self.done = False

        head_x = self.snake_head[0]
        head_y = self.snake_head[1]

        snake_length = len(self.snake_position)
        apple_delta_x = self.apple_position[0] - head_x
        apple_delta_y = self.apple_position[1] - head_y

        # however long we aspire the snake to be
        self.prev_actions = deque(maxlen=SNAKE_LEN_GOAL)
        for i in range(SNAKE_LEN_GOAL):
            self.prev_actions.append(-1)  # to create history

        # create observation:
        observation = [head_x, head_y, apple_delta_x,
                       apple_delta_y, snake_length] + list(self.prev_actions)
        observation = np.array(observation)

        return observation, {}

    def render(self, mode='human'):
        pass

    def close(self):
        pass


env = SnekEnv()
# It will check your custom environment and output additional warnings if needed
check_env(env)


def run_env_demo():
    episodes = 50

    for episode in range(episodes):
        done = False
        obs = env.reset()
        while True:  # not done:
            random_action = env.action_space.sample()
            print("action", random_action)
            obs, reward, done, truncated, info = env.step(random_action)
            print('reward', reward)


def train_agent():

    models_dir = f"models/{int(time.time())}/"
    logdir = f"logs/{int(time.time())}/"

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    if not os.path.exists(logdir):
        os.makedirs(logdir)

    env = SnekEnv()
    env.reset()

    model = PPO('MlpPolicy', env, verbose=1, tensorboard_log=logdir)

    TIMESTEPS = 1000
    # iters = 0
    # while True:
    #     iters += 1
    model.learn(total_timesteps=TIMESTEPS,
                reset_num_timesteps=False, tb_log_name=f"PPO")
    model.save(f"{models_dir}/{TIMESTEPS}")


train_agent()


def evaludate_trained():

    model = PPO.load("models/1690624005/10000")

    env = SnekEnv()

    mean_reward, std_reward = evaluate_policy(
        model, env, n_eval_episodes=10, warn=False)

    print(f"mean_reward: {mean_reward:.2f} +/- {std_reward:.2f}")


# evaludate_trained()
