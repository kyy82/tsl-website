import numpy as np
from typing import List, Tuple, Dict

class MultiArmedBandit:
    """Multi-armed bandit environment with three arms."""

    def __init__(self):
        """Initialize the three arms with their specific distributions."""
        self.num_arms = 3
        self.arm_distributions = self._setup_arms()
        self.true_means = self._calculate_true_means()

    def _setup_arms(self) -> List[Dict]:
        """Setup the three arms with their probability distributions.

        Returns:
            List of dictionaries defining each arm's distribution
        """
        arms = [
            # Arm 1: P(-1) = 0.5, P(1) = 0.5
            {
                'rewards': [-1, 1],
                'probabilities': [0.5, 0.5]
            },
            # Arm 2: P(1) = 0.4, P(0) = 0.6
            {
                'rewards': [1, 0],
                'probabilities': [0.4, 0.6]
            },
            # Arm 3: P(2) = 0.3, P(-1) = 0.1, P(0) = 0.6
            {
                'rewards': [2, -1, 0],
                'probabilities': [0.3, 0.1, 0.6]
            }
        ]
        return arms

    def _calculate_true_means(self) -> List[float]:
        """Calculate the true expected reward for each arm.

        Returns:
            List of true mean rewards for each arm
        """
        means = []
        for arm in self.arm_distributions:
            mean = sum(r * p for r, p in zip(arm['rewards'], arm['probabilities']))
            means.append(mean)
        return means

    def pull_arm(self, arm_index: int) -> int:
        """Pull an arm and get a reward.

        Args:
            arm_index: Index of the arm to pull (0, 1, or 2)

        Returns:
            Reward from pulling the arm

        Raises:
            ValueError: If arm_index is invalid
        """
        if arm_index < 0 or arm_index >= self.num_arms:
            raise ValueError(f"Invalid arm index: {arm_index}. Must be 0, 1, or 2.")

        arm = self.arm_distributions[arm_index]
        reward = np.random.choice(arm['rewards'], p=arm['probabilities'])
        return int(reward)

    def get_arm_info(self, arm_index: int) -> Dict:
        """Get information about a specific arm.

        Args:
            arm_index: Index of the arm

        Returns:
            Dictionary with arm information
        """
        if arm_index < 0 or arm_index >= self.num_arms:
            raise ValueError(f"Invalid arm index: {arm_index}")

        return {
            'arm_index': arm_index,
            'rewards': self.arm_distributions[arm_index]['rewards'],
            'probabilities': self.arm_distributions[arm_index]['probabilities'],
            'true_mean': self.true_means[arm_index]
        }

    def get_all_arms_info(self) -> List[Dict]:
        """Get information about all arms.

        Returns:
            List of dictionaries with information for each arm
        """
        return [self.get_arm_info(i) for i in range(self.num_arms)]

    def get_optimal_arm(self) -> int:
        """Get the index of the optimal arm (highest expected reward).

        Returns:
            Index of the optimal arm
        """
        return int(np.argmax(self.true_means))


class BanditSession:
    """Manages a user session with the bandit environment."""

    def __init__(self, max_pulls: int = 50):
        """Initialize a new session.

        Args:
            max_pulls: Maximum number of pulls allowed in this session
        """
        self.bandit = MultiArmedBandit()
        self.max_pulls = max_pulls
        self.reset()

    def reset(self):
        """Reset the session statistics."""
        self.total_pulls = 0
        self.arm_pulls = [0, 0, 0]  # Number of pulls for each arm
        self.arm_rewards = [0, 0, 0]  # Total rewards for each arm
        self.pull_history = []  # History of (arm, reward) tuples

    def pull_arm(self, arm_index: int) -> Dict:
        """Pull an arm and update session statistics.

        Args:
            arm_index: Index of the arm to pull (1, 2, or 3 for user interface)

        Returns:
            Dictionary with pull result and updated statistics
        """
        # Convert from 1-based to 0-based indexing
        arm_idx = arm_index - 1

        if self.total_pulls >= self.max_pulls:
            return {
                'success': False,
                'message': f'Maximum pulls ({self.max_pulls}) reached!'
            }

        try:
            reward = self.bandit.pull_arm(arm_idx)

            # Update statistics
            self.total_pulls += 1
            self.arm_pulls[arm_idx] += 1
            self.arm_rewards[arm_idx] += reward
            self.pull_history.append((arm_index, reward))

            return {
                'success': True,
                'reward': reward,
                'arm': arm_index,
                'statistics': self.get_statistics()
            }

        except ValueError as e:
            return {
                'success': False,
                'message': str(e)
            }

    def get_statistics(self) -> Dict:
        """Get current session statistics.

        Returns:
            Dictionary with session statistics
        """
        arm_means = []
        for i in range(3):
            if self.arm_pulls[i] > 0:
                mean = self.arm_rewards[i] / self.arm_pulls[i]
            else:
                mean = 0.0
            arm_means.append(round(mean, 3))

        return {
            'total_pulls': self.total_pulls,
            'max_pulls': self.max_pulls,
            'arm_pulls': self.arm_pulls,
            'arm_rewards': self.arm_rewards,
            'arm_means': arm_means,
            'pull_history': self.pull_history[-10:]  # Last 10 pulls
        }

    def can_pull(self) -> bool:
        """Check if more pulls are allowed.

        Returns:
            True if more pulls are allowed, False otherwise
        """
        return self.total_pulls < self.max_pulls


if __name__ == "__main__":
    # Test the bandit environment
    bandit = MultiArmedBandit()

    print("Multi-Armed Bandit Environment Test")
    print("=" * 40)

    # Print arm information
    for i, arm_info in enumerate(bandit.get_all_arms_info()):
        print(f"Arm {i+1}:")
        print(f"  Rewards: {arm_info['rewards']}")
        print(f"  Probabilities: {arm_info['probabilities']}")
        print(f"  True Mean: {arm_info['true_mean']:.3f}")

    print(f"\nOptimal arm: {bandit.get_optimal_arm() + 1}")

    # Test session
    print("\nTesting session with 10 random pulls:")
    session = BanditSession(max_pulls=10)

    for _ in range(10):
        arm = np.random.choice([1, 2, 3])
        result = session.pull_arm(arm)
        if result['success']:
            print(f"Pulled arm {arm}, got reward {result['reward']}")
        else:
            print(f"Failed: {result['message']}")

    print(f"\nFinal statistics:")
    stats = session.get_statistics()
    for i in range(3):
        print(f"Arm {i+1}: {stats['arm_pulls'][i]} pulls, "
              f"total reward {stats['arm_rewards'][i]}, "
              f"mean {stats['arm_means'][i]:.3f}")