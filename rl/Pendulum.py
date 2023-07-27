import os
import numpy as np
import gymnasium as gym
from stable_baselines3 import A2C, SAC, PPO, TD3
from stable_baselines3.common.evaluation import evaluate_policy
from stable_baselines3.common.callbacks import BaseCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.results_plotter import load_results, ts2xy

from utils import record_video


class CustomCallback(BaseCallback):
    """
    A custom callback that derives from ``BaseCallback``.

    :param verbose: (int) Verbosity level 0: not output 1: info 2: debug
    """

    def __init__(self, verbose=0):
        super().__init__(verbose)
        # Those variables will be accessible in the callback
        # (they are defined in the base class)
        # The RL model
        # self.model = None  # type: BaseRLModel
        # An alias for self.model.get_env(), the environment used for training
        # self.training_env = None  # type: Union[gym.Env, VecEnv, None]
        # Number of time the callback was called
        # self.n_calls = 0  # type: int
        # self.num_timesteps = 0  # type: int
        # local and global variables
        # self.locals = None  # type: Dict[str, Any]
        # self.globals = None  # type: Dict[str, Any]
        # The logger object, used to report things in the terminal
        # self.logger = None  # type: logger.Logger
        # # Sometimes, for event callback, it is useful
        # # to have access to the parent object
        # self.parent = None  # type: Optional[BaseCallback]

    def _on_training_start(self) -> None:
        """
        This method is called before the first rollout starts.
        """
        pass

    def _on_rollout_start(self) -> None:
        """
        A rollout is the collection of environment interaction
        using the current policy.
        This event is triggered before collecting new samples.
        """
        pass

    def _on_step(self) -> bool:
        """
        This method will be called by the model after each call to `env.step()`.

        For child callback (of an `EventCallback`), this will be called
        when the event is triggered.

        :return: (bool) If the callback returns False, training is aborted early.
        """
        return True

    def _on_rollout_end(self) -> None:
        """
        This event is triggered before updating the policy.
        """
        pass

    def _on_training_end(self) -> None:
        """
        This event is triggered before exiting the `learn()` method.
        """
        pass


class SaveOnBestTrainingRewardCallback(BaseCallback):
    """
    Callback for saving a model (the check is done every ``check_freq`` steps)
    based on the training reward (in practice, we recommend using ``EvalCallback``).

    :param check_freq: (int)
    :param log_dir: (str) Path to the folder where the model will be saved.
      It must contains the file created by the ``Monitor`` wrapper.
    :param verbose: (int)
    """

    def __init__(self, check_freq, log_dir, verbose=1):
        super().__init__(verbose)
        self.check_freq = check_freq
        self.log_dir = log_dir
        self.save_path = os.path.join(log_dir, "best_model")
        self.best_mean_reward = -np.inf

    def _init_callback(self) -> None:
        # Create folder if needed
        if self.save_path is not None:
            os.makedirs(self.save_path, exist_ok=True)

    def _on_step(self) -> bool:
        if self.n_calls % self.check_freq == 0:

            # Retrieve training reward
            x, y = ts2xy(load_results(self.log_dir), "timesteps")
            if len(x) > 0:
                # Mean training reward over the last 100 episodes
                mean_reward = np.mean(y[-100:])
                if self.verbose > 0:
                    print("Num timesteps: {}".format(self.num_timesteps))
                    print(
                        "Best mean reward: {:.2f} - Last mean reward per episode: {:.2f}".format(
                            self.best_mean_reward, mean_reward
                        )
                    )

                # New best model, you could save the agent here
                if mean_reward > self.best_mean_reward:
                    self.best_mean_reward = mean_reward
                    # Example for saving best model
                    if self.verbose > 0:
                        print(
                            "Saving new best model at {} timesteps".format(x[-1]))
                        print("Saving new best model to {}.zip".format(
                            self.save_path))
                    self.model.save(self.save_path)

        return True


env_id = "Pendulum-v1"

# eval_env = gym.make(env_id)

# default_model = SAC(
#     "MlpPolicy",
#     env_id,
#     verbose=1,
#     seed=0,
#     batch_size=64,
#     policy_kwargs=dict(net_arch=[64, 64]),
# ).learn(8000)

# mean_reward, std_reward = evaluate_policy(
#     default_model, eval_env, n_eval_episodes=100)
# print(f"mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

# record_video(env_id, default_model, video_length=500, prefix="mlp-default-")

log_dir = "/tmp/gym/"
os.makedirs(log_dir, exist_ok=True)

# Create Callback
callback = SaveOnBestTrainingRewardCallback(
    check_freq=20, log_dir=log_dir, verbose=1)

env = make_vec_env(env_id, n_envs=1, monitor_dir=log_dir)

if False:
    model = SAC(
        "MlpPolicy",
        env,
        batch_size=256,
        verbose=1,
        policy_kwargs=dict(net_arch=[256, 256]),
        seed=0,
    )

    model.learn(total_timesteps=5000, callback=callback)

# tuned_model = SAC(
#     "MlpPolicy",
#     env_id,
#     batch_size=256,
#     verbose=1,
#     policy_kwargs=dict(net_arch=[256, 256]),
#     seed=0,
# ).learn(1000, callback=callback)

# mean_reward, std_reward = evaluate_policy(
#     tuned_model, eval_env, n_eval_episodes=100)
# print(f"mean_reward:{mean_reward:.2f} +/- {std_reward:.2f}")

else:
    loaded_model = SAC.load(os.path.join(log_dir, "best_model"))

    record_video(env, loaded_model, video_length=500, prefix="mlp-tuned-")
