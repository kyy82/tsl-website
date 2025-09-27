#!/usr/bin/env python3
"""
Script to pretrain the epsilon-greedy agent for the multi-armed bandit demo.
This creates a trained model that can be used to demonstrate optimal performance.
"""

import os
import sys
import logging
from bandit_environment import MultiArmedBandit
from epsilon_greedy import EpsilonGreedyAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def train_agent(num_training_steps=10000, epsilon=0.1):
    """Train an epsilon-greedy agent on the bandit environment.

    Args:
        num_training_steps: Number of training steps
        epsilon: Exploration probability

    Returns:
        Trained agent
    """
    logger.info(f"Creating bandit environment...")
    bandit = MultiArmedBandit()

    # Print environment information
    logger.info("Bandit environment created with the following arms:")
    for i, arm_info in enumerate(bandit.get_all_arms_info()):
        logger.info(f"  Arm {i+1}: rewards={arm_info['rewards']}, "
                   f"probabilities={arm_info['probabilities']}, "
                   f"expected_reward={arm_info['true_mean']:.3f}")

    optimal_arm = bandit.get_optimal_arm()
    logger.info(f"Optimal arm: {optimal_arm + 1} (expected reward: {bandit.true_means[optimal_arm]:.3f})")

    # Create and train agent
    logger.info(f"Training epsilon-greedy agent with epsilon={epsilon} for {num_training_steps} steps...")
    agent = EpsilonGreedyAgent(num_arms=3, epsilon=epsilon)

    # Train the agent
    training_history = agent.train(bandit, num_training_steps)

    # Print training results
    final_estimates = agent.get_estimates()
    logger.info("Training completed!")
    logger.info(f"Final estimates: {[f'{est:.3f}' for est in final_estimates['arm_estimates']]}")
    logger.info(f"True means:      {[f'{mean:.3f}' for mean in bandit.true_means]}")
    logger.info(f"Arm counts:      {final_estimates['arm_counts']}")
    logger.info(f"Total reward:    {final_estimates['total_reward']:.1f}")
    logger.info(f"Average reward:  {final_estimates['average_reward']:.3f}")

    # Calculate performance metrics
    optimal_arm_pulls = final_estimates['arm_counts'][optimal_arm]
    optimal_percentage = (optimal_arm_pulls / num_training_steps) * 100
    logger.info(f"Optimal arm chosen {optimal_percentage:.1f}% of the time")

    # Calculate regret
    optimal_reward = bandit.true_means[optimal_arm]
    total_regret = sum(optimal_reward - step['reward'] for step in training_history)
    average_regret = total_regret / num_training_steps
    logger.info(f"Total regret:    {total_regret:.1f}")
    logger.info(f"Average regret:  {average_regret:.3f}")

    return agent, bandit


def save_model(agent, filepath):
    """Save the trained model to a file.

    Args:
        agent: Trained epsilon-greedy agent
        filepath: Path to save the model
    """
    # Ensure the directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    logger.info(f"Saving trained model to {filepath}...")
    agent.save_model(filepath)
    logger.info("Model saved successfully!")


def test_model(filepath):
    """Test the saved model by loading it and running a demonstration.

    Args:
        filepath: Path to the saved model
    """
    logger.info(f"Testing saved model from {filepath}...")

    # Load the model
    test_agent = EpsilonGreedyAgent()
    test_agent.load_model(filepath)

    # Test on a fresh bandit environment
    test_bandit = MultiArmedBandit()

    logger.info("Running 100-step demonstration with loaded model...")
    demo_results = test_agent.demonstrate_performance(test_bandit, 100)

    # Calculate performance
    total_reward = sum(step['reward'] for step in demo_results)
    optimal_arm = test_bandit.get_optimal_arm()
    optimal_count = sum(1 for step in demo_results if step['arm'] == optimal_arm)

    logger.info("Demonstration results:")
    logger.info(f"  Total reward: {total_reward}")
    logger.info(f"  Average reward: {total_reward / 100:.3f}")
    logger.info(f"  Optimal arm chosen: {optimal_count}/100 times ({optimal_count}%)")
    logger.info(f"  Agent estimates: {[f'{est:.3f}' for est in test_agent.arm_values]}")

    return demo_results


def main():
    """Main function to train and save the model."""
    logger.info("Starting multi-armed bandit model training...")

    # Training parameters
    num_training_steps = 10000
    epsilon = 0.1

    try:
        # Train the agent
        agent, bandit = train_agent(num_training_steps, epsilon)

        # Save the model
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'models', 'trained_bandit.pkl')
        save_model(agent, model_path)

        # Test the saved model
        test_model(model_path)

        logger.info("Training and testing completed successfully!")

    except Exception as e:
        logger.error(f"Error during training: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()