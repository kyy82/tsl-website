import numpy as np
import pickle
from typing import List, Dict, Tuple
from bandit_environment import MultiArmedBandit


class EpsilonGreedyAgent:
    """Epsilon-greedy algorithm for multi-armed bandits."""

    def __init__(self, num_arms: int = 3, epsilon: float = 0.1):
        """Initialize the epsilon-greedy agent.

        Args:
            num_arms: Number of arms in the bandit
            epsilon: Exploration probability (0 to 1)
        """
        self.num_arms = num_arms
        self.epsilon = epsilon
        self.reset()

    def reset(self):
        """Reset the agent's estimates and counts."""
        self.arm_counts = np.zeros(self.num_arms)  # Number of times each arm was pulled
        self.arm_values = np.zeros(self.num_arms)  # Estimated value (mean reward) for each arm
        self.total_pulls = 0
        self.total_reward = 0
        self.pull_history = []  # History of (arm, reward, estimates) tuples

    def select_arm(self) -> int:
        """Select an arm using epsilon-greedy strategy.

        Returns:
            Index of the selected arm (0-based)
        """
        if np.random.random() < self.epsilon:
            # Explore: choose random arm
            arm = np.random.choice(self.num_arms)
            action_type = 'explore'
        else:
            # Exploit: choose arm with highest estimated value
            arm = np.argmax(self.arm_values)
            action_type = 'exploit'

        return arm, action_type

    def update(self, arm: int, reward: float):
        """Update estimates based on the reward received.

        Args:
            arm: Index of the arm that was pulled
            reward: Reward received from pulling the arm
        """
        self.arm_counts[arm] += 1
        self.total_pulls += 1
        self.total_reward += reward

        # Update the estimated value using incremental mean
        n = self.arm_counts[arm]
        self.arm_values[arm] += (reward - self.arm_values[arm]) / n

        # Store history
        self.pull_history.append({
            'arm': int(arm),
            'reward': float(reward),
            'estimates': self.arm_values.copy().tolist(),
            'counts': self.arm_counts.copy().tolist(),
            'action_type': getattr(self, '_last_action_type', 'unknown')
        })

    def get_estimates(self) -> Dict:
        """Get current estimates and statistics.

        Returns:
            Dictionary with current agent state
        """
        return {
            'arm_estimates': self.arm_values.tolist(),
            'arm_counts': self.arm_counts.tolist(),
            'total_pulls': int(self.total_pulls),
            'total_reward': float(self.total_reward),
            'average_reward': float(self.total_reward / max(1, self.total_pulls)),
            'epsilon': self.epsilon
        }

    def train(self, bandit: MultiArmedBandit, num_steps: int) -> List[Dict]:
        """Train the agent on the bandit environment.

        Args:
            bandit: The bandit environment to train on
            num_steps: Number of training steps

        Returns:
            List of training step information
        """
        self.reset()
        training_history = []

        for step in range(num_steps):
            # Select arm
            arm, action_type = self.select_arm()
            self._last_action_type = action_type

            # Pull arm and get reward
            reward = bandit.pull_arm(arm)

            # Update estimates
            self.update(arm, reward)

            # Record step info
            step_info = {
                'step': step + 1,
                'arm': int(arm),
                'reward': float(reward),
                'action_type': action_type,
                'estimates': self.arm_values.copy().tolist(),
                'counts': self.arm_counts.copy().tolist(),
                'cumulative_reward': float(self.total_reward)
            }
            training_history.append(step_info)

        return training_history

    def save_model(self, filepath: str):
        """Save the trained model to a file.

        Args:
            filepath: Path to save the model
        """
        model_data = {
            'arm_values': self.arm_values,
            'arm_counts': self.arm_counts,
            'epsilon': self.epsilon,
            'num_arms': self.num_arms,
            'total_pulls': self.total_pulls,
            'total_reward': self.total_reward
        }

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)

    def load_model(self, filepath: str):
        """Load a trained model from a file.

        Args:
            filepath: Path to load the model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)

        self.arm_values = model_data['arm_values']
        self.arm_counts = model_data['arm_counts']
        self.epsilon = model_data['epsilon']
        self.num_arms = model_data['num_arms']
        self.total_pulls = model_data['total_pulls']
        self.total_reward = model_data['total_reward']
        self.pull_history = []

    def demonstrate_performance(self, bandit: MultiArmedBandit, num_steps: int) -> List[Dict]:
        """Demonstrate the performance of the trained agent.

        Args:
            bandit: The bandit environment to test on
            num_steps: Number of demonstration steps

        Returns:
            List of demonstration step information
        """
        demo_history = []
        demo_total_reward = 0

        for step in range(num_steps):
            # Select arm (using trained estimates)
            arm, action_type = self.select_arm()

            # Pull arm and get reward
            reward = bandit.pull_arm(arm)
            demo_total_reward += reward

            # Record step info (don't update estimates during demonstration)
            step_info = {
                'step': step + 1,
                'arm': int(arm),
                'reward': float(reward),
                'action_type': action_type,
                'estimates': self.arm_values.copy().tolist(),
                'cumulative_reward': float(demo_total_reward)
            }
            demo_history.append(step_info)

        return demo_history


class BanditSimulator:
    """Simulator for running bandit experiments."""

    def __init__(self):
        self.bandit = MultiArmedBandit()
        self.agent = EpsilonGreedyAgent(epsilon=0.1)

    def run_exploration_demo(self, num_steps: int = 50) -> Dict:
        """Run an exploration demonstration showing how the agent learns.

        Args:
            num_steps: Number of steps to demonstrate

        Returns:
            Dictionary with exploration results
        """
        # Train a fresh agent
        fresh_agent = EpsilonGreedyAgent(epsilon=0.1)
        training_history = fresh_agent.train(self.bandit, num_steps)

        # Calculate regret (cumulative difference from optimal)
        optimal_arm = self.bandit.get_optimal_arm()
        optimal_reward = self.bandit.true_means[optimal_arm]

        cumulative_regret = []
        regret = 0
        for step in training_history:
            regret += optimal_reward - step['reward']
            cumulative_regret.append(regret)

        return {
            'training_history': training_history,
            'final_estimates': fresh_agent.get_estimates(),
            'true_means': self.bandit.true_means.tolist() if hasattr(self.bandit.true_means, 'tolist') else self.bandit.true_means,
            'optimal_arm': int(optimal_arm),
            'cumulative_regret': cumulative_regret
        }

    def run_trained_demo(self, num_steps: int = 50) -> Dict:
        """Run a demonstration with a pre-trained agent.

        Args:
            num_steps: Number of steps to demonstrate

        Returns:
            Dictionary with trained performance results
        """
        # Use the trained agent
        demo_history = self.agent.demonstrate_performance(self.bandit, num_steps)

        # Calculate performance metrics
        total_reward = sum(step['reward'] for step in demo_history)
        optimal_arm = self.bandit.get_optimal_arm()
        optimal_count = sum(1 for step in demo_history if step['arm'] == optimal_arm)

        return {
            'demo_history': demo_history,
            'total_reward': float(total_reward),
            'average_reward': float(total_reward / num_steps),
            'optimal_arm_percentage': float((optimal_count / num_steps) * 100),
            'agent_estimates': self.agent.get_estimates(),
            'true_means': self.bandit.true_means.tolist() if hasattr(self.bandit.true_means, 'tolist') else self.bandit.true_means
        }


if __name__ == "__main__":
    # Test the epsilon-greedy agent
    print("Epsilon-Greedy Agent Test")
    print("=" * 30)

    # Create bandit and agent
    bandit = MultiArmedBandit()
    agent = EpsilonGreedyAgent(epsilon=0.1)

    print("True arm means:", [f"{mean:.3f}" for mean in bandit.true_means])
    print(f"Optimal arm: {bandit.get_optimal_arm() + 1}")

    # Train for 100 steps
    print("\nTraining for 100 steps...")
    training_history = agent.train(bandit, 100)

    # Print final estimates
    final_estimates = agent.get_estimates()
    print(f"\nFinal estimates: {[f'{est:.3f}' for est in final_estimates['arm_estimates']]}")
    print(f"Arm counts: {final_estimates['arm_counts']}")
    print(f"Total reward: {final_estimates['total_reward']:.1f}")
    print(f"Average reward: {final_estimates['average_reward']:.3f}")

    # Test simulator
    print("\nTesting simulator...")
    simulator = BanditSimulator()

    # Run exploration demo
    exploration_results = simulator.run_exploration_demo(50)
    print(f"Exploration demo completed. Final estimates: "
          f"{[f'{est:.3f}' for est in exploration_results['final_estimates']['arm_estimates']]}")

    # Test saving/loading
    print("\nTesting model save/load...")
    agent.save_model("test_model.pkl")

    new_agent = EpsilonGreedyAgent()
    new_agent.load_model("test_model.pkl")
    print(f"Loaded estimates: {[f'{est:.3f}' for est in new_agent.arm_values]}")

    import os
    os.remove("test_model.pkl")
    print("Test completed successfully!")