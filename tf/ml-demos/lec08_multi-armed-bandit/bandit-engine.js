/**
 * JavaScript Multi-Armed Bandit Engine
 * Frontend-only implementation of bandit environment and epsilon-greedy algorithm
 */

class MultiArmedBandit {
    constructor() {
        this.numArms = 3;
        this.armDistributions = this.setupArms();
        this.trueMeans = this.calculateTrueMeans();
    }

    setupArms() {
        return [
            // Arm 1: P(-1) = 0.5, P(1) = 0.5, E[reward] = 0.0
            {
                rewards: [-1, 1],
                probabilities: [0.5, 0.5]
            },
            // Arm 2: P(1) = 0.4, P(0) = 0.6, E[reward] = 0.4
            {
                rewards: [1, 0],
                probabilities: [0.4, 0.6]
            },
            // Arm 3: P(2) = 0.3, P(-1) = 0.1, P(0) = 0.6, E[reward] = 0.5 (optimal)
            {
                rewards: [2, -1, 0],
                probabilities: [0.3, 0.1, 0.6]
            }
        ];
    }

    calculateTrueMeans() {
        return this.armDistributions.map(arm =>
            arm.rewards.reduce((sum, reward, i) => sum + reward * arm.probabilities[i], 0)
        );
    }

    pullArm(armIndex) {
        if (armIndex < 0 || armIndex >= this.numArms) {
            throw new Error(`Invalid arm index: ${armIndex}. Must be 0, 1, or 2.`);
        }

        const arm = this.armDistributions[armIndex];
        const random = Math.random();
        let cumulativeProb = 0;

        for (let i = 0; i < arm.probabilities.length; i++) {
            cumulativeProb += arm.probabilities[i];
            if (random <= cumulativeProb) {
                return arm.rewards[i];
            }
        }

        // Fallback (should never reach here)
        return arm.rewards[arm.rewards.length - 1];
    }

    getArmInfo(armIndex) {
        if (armIndex < 0 || armIndex >= this.numArms) {
            throw new Error(`Invalid arm index: ${armIndex}`);
        }

        return {
            armIndex: armIndex,
            rewards: this.armDistributions[armIndex].rewards,
            probabilities: this.armDistributions[armIndex].probabilities,
            trueMean: this.trueMeans[armIndex]
        };
    }

    getAllArmsInfo() {
        return this.armDistributions.map((_, i) => this.getArmInfo(i));
    }

    getOptimalArm() {
        return this.trueMeans.indexOf(Math.max(...this.trueMeans));
    }
}

class BanditSession {
    constructor(maxPulls = 50) {
        this.bandit = new MultiArmedBandit();
        this.maxPulls = maxPulls;
        this.reset();
    }

    reset() {
        this.totalPulls = 0;
        this.armPulls = [0, 0, 0];
        this.armRewards = [0, 0, 0];
        this.pullHistory = [];
    }

    pullArm(armIndex) {
        // Convert from 1-based to 0-based indexing (for UI compatibility)
        const armIdx = armIndex - 1;

        if (this.totalPulls >= this.maxPulls) {
            return {
                success: false,
                message: `Maximum pulls (${this.maxPulls}) reached!`
            };
        }

        try {
            const reward = this.bandit.pullArm(armIdx);

            // Update statistics
            this.totalPulls++;
            this.armPulls[armIdx]++;
            this.armRewards[armIdx] += reward;
            this.pullHistory.push({arm: armIndex, reward: reward});

            return {
                success: true,
                reward: reward,
                arm: armIndex,
                statistics: this.getStatistics()
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    getStatistics() {
        const armMeans = this.armPulls.map((pulls, i) =>
            pulls > 0 ? Math.round((this.armRewards[i] / pulls) * 1000) / 1000 : 0.0
        );

        return {
            total_pulls: this.totalPulls,
            max_pulls: this.maxPulls,
            arm_pulls: this.armPulls,
            arm_rewards: this.armRewards,
            arm_means: armMeans,
            pull_history: this.pullHistory.slice(-10) // Last 10 pulls
        };
    }

    canPull() {
        return this.totalPulls < this.maxPulls;
    }
}

class EpsilonGreedyAgent {
    constructor(numArms = 3, epsilon = 0.1) {
        this.numArms = numArms;
        this.epsilon = epsilon;
        this.reset();
    }

    reset() {
        this.armCounts = new Array(this.numArms).fill(0);
        this.armValues = new Array(this.numArms).fill(0.0);
        this.totalPulls = 0;
        this.totalReward = 0;
        this.pullHistory = [];
    }

    selectArm() {
        if (Math.random() < this.epsilon) {
            // Explore: choose random arm
            const arm = Math.floor(Math.random() * this.numArms);
            return { arm: arm, actionType: 'explore' };
        } else {
            // Exploit: choose arm with highest estimated value
            const arm = this.armValues.indexOf(Math.max(...this.armValues));
            return { arm: arm, actionType: 'exploit' };
        }
    }

    update(arm, reward) {
        // Incremental update of the mean
        this.armCounts[arm]++;
        this.armValues[arm] += (reward - this.armValues[arm]) / this.armCounts[arm];
        this.totalPulls++;
        this.totalReward += reward;

        // Store in history
        this.pullHistory.push({
            arm: arm,
            reward: reward,
            armValues: [...this.armValues],
            armCounts: [...this.armCounts]
        });
    }

    getEstimates() {
        return {
            arm_estimates: [...this.armValues],
            arm_counts: [...this.armCounts],
            total_reward: this.totalReward,
            average_reward: this.totalPulls > 0 ? this.totalReward / this.totalPulls : 0,
            epsilon: this.epsilon
        };
    }
}

class BanditSimulator {
    constructor() {
        this.bandit = new MultiArmedBandit();
        this.banditData = null; // Will be loaded from JSON
    }

    async loadBanditData() {
        if (this.banditData) return this.banditData;

        try {
            const response = await fetch('./data/bandit_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.banditData = await response.json();
            console.log('Bandit data loaded successfully');
            return this.banditData;
        } catch (error) {
            console.error('Failed to load bandit data:', error);
            throw error;
        }
    }

    async demonstrateExploration(numSteps = 100) {
        await this.loadBanditData();

        // Use precomputed exploration simulation for consistency
        const explorationData = this.banditData.exploration_simulation;

        // Convert to format expected by frontend
        const results = {
            simulation_steps: explorationData.simulation_steps.map(step => ({
                step: step.step,
                arm: step.arm,
                action_type: step.action_type,
                reward: step.reward,
                estimates: step.arm_values_after || [0, 0, 0],
                counts: step.arm_counts_after || [0, 0, 0],
                total_reward: step.total_reward || 0
            })),
            summary: {
                total_reward: explorationData.summary.total_reward,
                average_reward: explorationData.summary.average_reward,
                epsilon: explorationData.summary.epsilon,
                final_estimates: explorationData.summary.final_arm_values
            }
        };

        return results;
    }

    async demonstrateTrained(numSteps = 100) {
        await this.loadBanditData();

        // Use precomputed trained simulation
        const trainedData = this.banditData.trained_simulation;

        // Convert to format expected by frontend
        const results = {
            simulation_steps: trainedData.simulation_steps.map(step => ({
                step: step.step,
                arm: step.arm,
                action_type: step.action_type,
                reward: step.reward,
                estimates: step.arm_values,
                confidence: step.confidence
            })),
            summary: {
                optimal_arm_selections: trainedData.summary.optimal_arm_selections,
                optimal_percentage: trainedData.summary.optimal_percentage,
                epsilon: trainedData.summary.epsilon,
                initial_estimates: trainedData.summary.initial_arm_values
            }
        };

        return results;
    }

    async revealDistributions() {
        await this.loadBanditData();

        const environment = this.banditData.environment;

        return {
            success: true,
            arms_info: environment.arms.map(arm => ({
                arm: arm.arm_index + 1, // Convert to 1-based for UI
                rewards: arm.rewards,
                probabilities: arm.probabilities,
                expected_reward: arm.true_mean
            })),
            optimal_arm: environment.optimal_arm + 1, // Convert to 1-based
            true_means: environment.true_means
        };
    }

    simulateExplorationStep(agent, step) {
        // Select arm using epsilon-greedy
        const selection = agent.selectArm();
        const arm = selection.arm;
        const actionType = selection.actionType;

        // Pull arm and get reward
        const reward = this.bandit.pullArm(arm);

        // Create step data before updating agent
        const stepData = {
            step: step,
            arm: arm,
            action_type: actionType,
            reward: reward,
            arm_values_before: [...agent.armValues],
            arm_counts_before: [...agent.armCounts]
        };

        // Update agent
        agent.update(arm, reward);

        // Add post-update state
        stepData.arm_values_after = [...agent.armValues];
        stepData.arm_counts_after = [...agent.armCounts];
        stepData.total_reward = agent.totalReward;
        stepData.average_reward = agent.totalReward / (step + 1);

        return stepData;
    }
}