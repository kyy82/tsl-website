# Multi-Armed Bandit Training Documentation

This document explains how to train and regenerate the multi-armed bandit models and simulation data used in the frontend-only demo.

## Overview

The multi-armed bandit demo uses precomputed simulation data and trained agent parameters stored in `data/bandit_data.json`. This file contains:

- **Environment Configuration**: Three arms with different reward probability distributions
- **Exploration Simulation**: 100-step epsilon-greedy learning demonstration (ε=0.1)
- **Trained Agent Simulation**: 100-step performance demonstration with well-trained parameters (ε=0.05)
- **Sample User Sessions**: Example scenarios for comparison

## Training Scripts

### Core Implementation Files

1. **`bandit_environment.py`**: Implements the multi-armed bandit environment
   - `MultiArmedBandit`: Environment with 3 arms and probability distributions
   - `BanditSession`: Session management for user interactions
   - Arm configurations:
     - Arm 1: P(-1)=0.5, P(1)=0.5, E[reward]=0.0
     - Arm 2: P(1)=0.4, P(0)=0.6, E[reward]=0.4
     - Arm 3: P(2)=0.3, P(-1)=0.1, P(0)=0.6, E[reward]=0.5 (optimal)

2. **`epsilon_greedy.py`**: Implements the epsilon-greedy algorithm
   - `EpsilonGreedyAgent`: Core reinforcement learning agent
   - Supports incremental reward averaging and exploration/exploitation balance
   - Model saving/loading for persistence

3. **`extract_bandit_data.py`**: Data extraction and export script
   - Converts Python training logic to JSON format for frontend consumption
   - Generates exploration and trained agent simulations
   - Creates sample user session scenarios

### Training Process

#### Step 1: Train the Agent (Optional)
```bash
python pretrain_model.py
```

This script:
- Trains an epsilon-greedy agent for 10,000 steps with ε=0.1
- Saves the trained model to `models/trained_bandit.pkl`
- Provides convergence statistics and performance metrics

**Expected Output:**
- Agent learns optimal arm (Arm 3) over ~1000-2000 steps
- Final arm estimates should approximate true means [0.0, 0.4, 0.5]
- Model saved for use in demonstrations

#### Step 2: Extract Training Data
```bash
python extract_bandit_data.py
```

This script:
- Loads the pretrained model (if available, otherwise creates mock trained agent)
- Generates 100-step exploration simulation showing learning process
- Generates 100-step trained agent simulation demonstrating optimal performance
- Extracts environment configuration and arm probability distributions
- Creates sample user session scenarios
- Exports all data to `data/bandit_data.json`

**Output File Structure:**
```json
{
  "environment": {
    "num_arms": 3,
    "arms": [...],
    "optimal_arm": 2,
    "true_means": [0.0, 0.4, 0.5]
  },
  "exploration_simulation": {
    "simulation_steps": [...],
    "summary": {...}
  },
  "trained_simulation": {
    "simulation_steps": [...],
    "summary": {...}
  },
  "sample_sessions": [...],
  "metadata": {...}
}
```

## Environment Setup

### Python Dependencies
```bash
pip install numpy
```

### Alternative: Conda Environment
If the `ml-demos` conda environment is available:
```bash
conda activate ml-demos
python extract_bandit_data.py
```

## Understanding the Algorithm

### Epsilon-Greedy Strategy
The agent uses an epsilon-greedy policy for balancing exploration and exploitation:

```
Action Selection:
- With probability (1-ε): Choose arm with highest estimated reward (exploit)
- With probability ε: Choose random arm (explore)

Value Update (incremental averaging):
Q(a) ← Q(a) + (1/n) * [r - Q(a)]
where n is the number of times arm a has been selected
```

### Training Parameters
- **Exploration Phase**: ε = 0.1 (10% random exploration)
- **Trained Agent**: ε = 0.05 (5% random exploration, mostly exploitation)
- **Training Steps**: 10,000 steps for convergence
- **Demonstration Steps**: 100 steps each for exploration and trained simulations

## Troubleshooting

### Common Issues

1. **Missing Trained Model**
   - If `models/trained_bandit.pkl` doesn't exist, the extraction script creates a mock trained agent
   - Mock agent uses hand-crafted parameters close to optimal values
   - For authentic results, run `pretrain_model.py` first

2. **JSON Serialization Errors**
   - Script includes custom numpy type conversion for JSON compatibility
   - Handles numpy.int64 and numpy.float64 types automatically

3. **File Permissions**
   - Ensure write permissions for `data/` and `models/` directories
   - Script creates directories automatically if they don't exist

### Verification

After running the extraction script, verify the output:
- `data/bandit_data.json` should be ~95KB
- Check that exploration simulation shows learning progression
- Confirm trained simulation favors optimal arm (Arm 3)
- Validate that true means match expected values [0.0, 0.4, 0.5]

## Customization

### Modifying Arm Configurations
To change the reward distributions, edit `bandit_environment.py`:

```python
def _setup_arms(self):
    return [
        # Arm 1: Custom distribution
        {
            'rewards': [reward_values],
            'probabilities': [probability_values]
        },
        # ... other arms
    ]
```

### Adjusting Training Parameters
Modify `epsilon_greedy.py` for different exploration strategies:
- Change epsilon value for different exploration rates
- Implement other algorithms (UCB, Thompson sampling)
- Adjust learning rates and convergence criteria

### Simulation Length
Edit `extract_bandit_data.py` to change simulation parameters:
```python
generate_exploration_simulation(bandit, num_steps=200)  # Longer exploration
generate_trained_simulation(agent, bandit, num_steps=50)  # Shorter demo
```

## Integration with Frontend

The generated `bandit_data.json` is consumed by:
- `bandit-engine.js`: JavaScript implementation of the bandit algorithms
- `script.js`: Demo interface that loads and displays simulation data
- Frontend provides identical educational experience without Python dependencies

To update the demo after retraining:
1. Run training scripts to generate new data
2. Refresh browser to load updated `bandit_data.json`
3. No server restart required - purely frontend implementation