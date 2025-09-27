#!/usr/bin/env python3
"""
Data extraction script for Multi-Armed Bandit demo
Exports all training logic and pretrained models to JSON format
"""

import json
import os
import sys
import numpy as np
import logging
from bandit_environment import MultiArmedBandit, BanditSession
from epsilon_greedy import EpsilonGreedyAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def extract_bandit_environment():
    """Extract bandit environment configuration to JSON-serializable format."""
    logger.info("Extracting bandit environment configuration...")

    bandit = MultiArmedBandit()

    # Extract arm configurations
    arms_config = []
    for i in range(bandit.num_arms):
        arm_info = bandit.get_arm_info(i)
        arms_config.append({
            'arm_index': arm_info['arm_index'],
            'rewards': arm_info['rewards'],
            'probabilities': arm_info['probabilities'],
            'true_mean': arm_info['true_mean'],
            'name': f'Arm {i + 1}'
        })

    environment_data = {
        'num_arms': bandit.num_arms,
        'arms': arms_config,
        'optimal_arm': bandit.get_optimal_arm(),
        'true_means': bandit.true_means
    }

    logger.info(f"Extracted configuration for {bandit.num_arms} arms")
    return environment_data


def load_pretrained_agent():
    """Load the pretrained agent if available."""
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'trained_bandit.pkl')

    if not os.path.exists(model_path):
        logger.warning(f"No pretrained model found at {model_path}")
        return None

    try:
        logger.info(f"Loading pretrained agent from {model_path}")
        agent = EpsilonGreedyAgent()
        agent.load_model(model_path)
        return agent
    except Exception as e:
        logger.error(f"Failed to load pretrained model: {e}")
        return None


def generate_exploration_simulation(bandit, num_steps=100):
    """Generate exploration phase simulation data."""
    logger.info(f"Generating exploration simulation with {num_steps} steps...")

    # Create agent for exploration (higher epsilon for more exploration)
    agent = EpsilonGreedyAgent(num_arms=3, epsilon=0.3)

    simulation_steps = []
    for step in range(num_steps):
        # Select arm
        arm, action_type = agent.select_arm()

        # Pull arm and get reward
        reward = bandit.pull_arm(arm)

        # Store step data before updating (to show learning progression)
        step_data = {
            'step': step,
            'arm': arm,
            'action_type': action_type,
            'reward': reward,
            'arm_values_before': agent.arm_values.tolist(),
            'arm_counts_before': agent.arm_counts.tolist()
        }

        # Update agent
        agent.update(arm, reward)

        # Add post-update state
        step_data.update({
            'arm_values_after': agent.arm_values.tolist(),
            'arm_counts_after': agent.arm_counts.tolist(),
            'total_reward': agent.total_reward,
            'average_reward': agent.total_reward / (step + 1) if step >= 0 else 0
        })

        simulation_steps.append(step_data)

    # Add summary statistics
    final_stats = {
        'total_steps': num_steps,
        'final_arm_values': agent.arm_values.tolist(),
        'final_arm_counts': agent.arm_counts.tolist(),
        'total_reward': agent.total_reward,
        'average_reward': agent.total_reward / num_steps,
        'epsilon': 0.3  # Higher exploration rate
    }

    return {
        'simulation_steps': simulation_steps,
        'summary': final_stats
    }


def generate_trained_simulation(agent, bandit, num_steps=100):
    """Generate trained agent demonstration data using pure greedy algorithm."""
    if agent is None:
        logger.warning("No trained agent available, attempting to load from file")
        try:
            # Try to load the actual trained agent
            agent = load_pretrained_agent()
            if agent is not None:
                logger.info(f"Successfully loaded trained agent with estimates: {agent.arm_values}")
        except Exception as e:
            logger.error(f"Failed to load trained agent: {e}")
            agent = None

    if agent is None:
        logger.error("No trained agent available and unable to load from file. Run pretrain_model.py first!")
        raise ValueError("No trained agent available. Please run pretrain_model.py to train an agent first.")

    logger.info(f"Generating trained agent simulation with {num_steps} steps (pure greedy)...")

    simulation_steps = []
    # Use learned estimates but don't update them during demo (they're already "learned")
    learned_estimates = agent.arm_values.copy()

    for step in range(num_steps):
        # Pure greedy: always choose arm with highest learned estimate
        arm = np.argmax(learned_estimates)
        action_type = 'exploit'  # Always exploit with pure greedy

        # Pull arm and get reward
        reward = bandit.pull_arm(arm)

        # Store step data
        step_data = {
            'step': step,
            'arm': arm,
            'action_type': action_type,
            'reward': reward,
            'arm_values': learned_estimates.tolist(),  # Fixed learned estimates
            'arm_counts': agent.arm_counts.tolist(),   # Original training counts
            'confidence': 'high'  # Trained agent has high confidence
        }

        # Don't update learned estimates - they're already optimized from training
        simulation_steps.append(step_data)

    # Calculate performance metrics
    optimal_arm = bandit.get_optimal_arm()
    optimal_selections = sum(1 for step in simulation_steps if step['arm'] == optimal_arm)
    optimal_percentage = (optimal_selections / num_steps) * 100

    summary = {
        'total_steps': num_steps,
        'initial_arm_values': learned_estimates.tolist(),
        'initial_arm_counts': agent.arm_counts.tolist(),
        'optimal_arm_selections': optimal_selections,
        'optimal_percentage': optimal_percentage,
        'epsilon': 0.0,  # Pure greedy algorithm
        'performance': 'pure_greedy'
    }

    return {
        'simulation_steps': simulation_steps,
        'summary': summary
    }


def generate_sample_user_sessions():
    """Generate sample user session data for demonstration."""
    logger.info("Generating sample user session scenarios...")

    bandit = MultiArmedBandit()
    scenarios = []

    # Scenario 1: Random exploration
    session1 = BanditSession(max_pulls=20)
    for _ in range(20):
        arm = np.random.choice([1, 2, 3])
        result = session1.pull_arm(arm)

    scenarios.append({
        'name': 'random_exploration',
        'description': 'Random arm selection',
        'final_statistics': session1.get_statistics(),
        'max_pulls': session1.max_pulls
    })

    # Scenario 2: Greedy approach (always pick first good result)
    session2 = BanditSession(max_pulls=20)
    first_arm = 1
    for i in range(20):
        if i < 5:  # Explore first 5 pulls randomly
            arm = np.random.choice([1, 2, 3])
        else:  # Then stick with best so far
            stats = session2.get_statistics()
            arm_means = stats['arm_means']
            best_arm = arm_means.index(max(arm_means)) + 1
            arm = best_arm
        session2.pull_arm(arm)

    scenarios.append({
        'name': 'greedy_approach',
        'description': 'Explore then exploit best arm',
        'final_statistics': session2.get_statistics(),
        'max_pulls': session2.max_pulls
    })

    return scenarios


def main():
    """Main function to extract all bandit data."""
    logger.info("Starting multi-armed bandit data extraction...")

    try:
        # Create output directory
        output_dir = 'data'
        os.makedirs(output_dir, exist_ok=True)

        # Extract all components
        bandit = MultiArmedBandit()
        pretrained_agent = load_pretrained_agent()

        # Generate all data
        export_data = {
            'environment': extract_bandit_environment(),
            'exploration_simulation': generate_exploration_simulation(bandit, 100),
            'trained_simulation': generate_trained_simulation(pretrained_agent, bandit, 100),
            'sample_sessions': generate_sample_user_sessions(),
            'metadata': {
                'version': '1.0',
                'description': 'Multi-armed bandit demo data for frontend-only implementation',
                'algorithms': ['epsilon-greedy', 'pure-greedy'],
                'max_user_pulls': 50,
                'exploration_epsilon': 0.3,
                'trained_epsilon': 0.0  # Pure greedy
            }
        }

        # Save to JSON with numpy type conversion
        output_file = os.path.join(output_dir, 'bandit_data.json')
        with open(output_file, 'w') as f:
            json.dump(export_data, f, indent=2, default=lambda x: int(x) if isinstance(x, np.integer) else float(x) if isinstance(x, np.floating) else str(x))

        logger.info(f"Data extraction complete! Saved to: {output_file}")

        # Print summary
        logger.info("Export Summary:")
        logger.info(f"  - Environment: {export_data['environment']['num_arms']} arms")
        logger.info(f"  - Exploration simulation: {len(export_data['exploration_simulation']['simulation_steps'])} steps")
        logger.info(f"  - Trained simulation: {len(export_data['trained_simulation']['simulation_steps'])} steps")
        logger.info(f"  - Sample sessions: {len(export_data['sample_sessions'])} scenarios")
        logger.info(f"  - Optimal arm: {export_data['environment']['optimal_arm'] + 1} (expected reward: {export_data['environment']['true_means'][export_data['environment']['optimal_arm']]:.3f})")

        # File size info
        file_size = os.path.getsize(output_file)
        logger.info(f"  - File size: {file_size / 1024:.1f} KB")

    except Exception as e:
        logger.error(f"Error during data extraction: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()