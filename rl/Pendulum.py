import numpy as np
import gymnasium as gym
from stable_baselines3 import A2C, SAC, PPO, TD3
from stable_baselines3.common.evaluation import evaluate_policy

from utils import record_video

env_id = "Pendulum-v1"

eval_env = gym.make(env_id)

default_model = SAC(
    "MlpPolicy",
    env_id,
    verbose=1,
    seed=0,
    batch_size=64,
    policy_kwargs=dict(net_arch=[64, 64]),
).learn(8000)

mean_reward, std_reward = evaluate_policy(default_model, eval_env, n_eval_episodes=100)
print(f"mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

record_video(env_id, default_model, video_length=500, prefix="mlp-default-")

tuned_model = SAC(
    "MlpPolicy",
    env_id,
    batch_size=256,
    verbose=1,
    policy_kwargs=dict(net_arch=[256, 256]),
    seed=0,
).learn(8000)

mean_reward, std_reward = evaluate_policy(tuned_model, eval_env, n_eval_episodes=100)
print(f"mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

record_video(env_id, tuned_model, video_length=500, prefix="mlp-tuned-")