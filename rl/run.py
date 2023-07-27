import os

import gymnasium as gym
import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.ppo.policies import MlpPolicy
from stable_baselines3.common.base_class import BaseAlgorithm
from stable_baselines3.common.evaluation import evaluate_policy

from utils import record_video


def evaluate(
    model: BaseAlgorithm,
    num_episodes: int = 100,
    deterministic: bool = True,
) -> float:
    """
    Evaluate an RL agent for `num_episodes`.

    :param model: the RL Agent
    :param env: the gym Environment
    :param num_episodes: number of episodes to evaluate it
    :param deterministic: Whether to use deterministic or stochastic actions
    :return: Mean reward for the last `num_episodes`
    """
    # This function will only work for a single environment
    vec_env = model.get_env()
    obs = vec_env.reset()
    all_episode_rewards = []
    for _ in range(num_episodes):
        episode_rewards = []
        done = False
        # Note: SB3 VecEnv resets automatically:
        # https://stable-baselines3.readthedocs.io/en/master/guide/vec_envs.html#vecenv-api-vs-gym-api
        # obs = vec_env.reset()
        while not done:
            # _states are only useful when using LSTM policies
            # `deterministic` is to use deterministic actions
            action, _states = model.predict(obs, deterministic=deterministic)
            # here, action, rewards and dones are arrays
            # because we are using vectorized env
            obs, reward, done, _info = vec_env.step(action)
            episode_rewards.append(reward)

        all_episode_rewards.append(sum(episode_rewards))

    mean_episode_reward = np.mean(all_episode_rewards)
    print(
        f"Mean reward: {mean_episode_reward:.2f} - Num episodes: {num_episodes}")

    return mean_episode_reward

class MyMonitorWrapper(gym.Wrapper):
    """
    :param env: (gym.Env) Gym environment that will be wrapped
    """

    def __init__(self, env):
        # Call the parent constructor, so we can access self.env later
        super().__init__(env)
        # === YOUR CODE HERE ===#
        # Initialize the variables that will be used
        # to store the episode length and episode reward
        self.episode_length = 0
        self.episode_reward = 0

        # ====================== #

    def reset(self, **kwargs):
        """
        Reset the environment
        """
        obs = self.env.reset(**kwargs)
        # === YOUR CODE HERE ===#
        # Reset the variables
        self.episode_length = 0
        self.episode_reward = 0

        # ====================== #
        return obs

    def step(self, action):
        """
        :param action: ([float] or int) Action taken by the agent
        :return: (np.ndarray, float, bool, bool, dict)
            observation, reward, is the episode over?, is the episode truncated?, additional information
        """
        obs, reward, terminated, truncated, info = self.env.step(action)
        # === YOUR CODE HERE ===#
        # Update the current episode reward and episode length
        self.episode_length = self.episode_length + 1
        self.episode_reward = reward + self.episode_reward

        # ====================== #

        if terminated or truncated:
            # === YOUR CODE HERE ===#
            # Store the episode length and episode reward in the info dict
            info['episode_length'] = self.episode_length
            info['episode_reward'] = self.episode_reward

            # ====================== #
        return obs, reward, terminated, truncated, info

env = gym.make("CartPole-v1")
env = MyMonitorWrapper(env=env)

model = PPO(MlpPolicy, env, verbose=0)

# Random Agent, before training
mean_reward_before_train = evaluate(
    model, num_episodes=100, deterministic=True)

mean_reward, std_reward = evaluate_policy(
    model, env, n_eval_episodes=100, warn=False)

print(f"mean_reward: {mean_reward:.2f} +/- {std_reward:.2f}")

# Train the agent for 10000 steps
model.learn(total_timesteps=10_000)

# Evaluate the trained agent
mean_reward, std_reward = evaluate_policy(model, env, n_eval_episodes=100)

print(f"pre save mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

save_dir = "/tmp/gym/"
os.makedirs(save_dir, exist_ok=True)

# The model will be saved under PPO_tutorial.zip
model.save(f"{save_dir}/PPO_tutorial")

del model  # delete trained model to demonstrate loading

loaded_model = PPO.load(f"{save_dir}/PPO_tutorial")

mean_reward, std_reward = evaluate_policy(loaded_model, env, n_eval_episodes=100)
# Check that the prediction is the same after loading (for the same observation)
print(f"loaded mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

# record_video("CartPole-v1", model, video_length=500, prefix="ppo-cartpole")

# show_videos("videos", prefix="ppo")
