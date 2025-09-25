class MultiarmedBanditDemo {
    constructor() {
        // Frontend-only components
        this.banditSession = new BanditSession(50);
        this.banditSimulator = new BanditSimulator();

        // UI elements
        this.armButtons = {
            1: document.getElementById('arm1-btn'),
            2: document.getElementById('arm2-btn'),
            3: document.getElementById('arm3-btn')
        };

        this.statElements = {
            1: {
                total: document.getElementById('arm1-total'),
                count: document.getElementById('arm1-count'),
                mean: document.getElementById('arm1-mean')
            },
            2: {
                total: document.getElementById('arm2-total'),
                count: document.getElementById('arm2-count'),
                mean: document.getElementById('arm2-mean')
            },
            3: {
                total: document.getElementById('arm3-total'),
                count: document.getElementById('arm3-count'),
                mean: document.getElementById('arm3-mean')
            }
        };

        this.totalPullsElement = document.getElementById('total-pulls');
        this.totalRewardsElement = document.getElementById('total-rewards');
        this.resultsContainer = document.getElementById('results-container');
        this.explorationDisplay = document.getElementById('exploration-display');
        this.performanceDisplay = document.getElementById('performance-display');
        this.explorationProgress = document.getElementById('exploration-progress');
        this.distributionReveal = document.getElementById('distribution-reveal');
        this.distributionDisplay = document.getElementById('distribution-display');

        // Demo buttons
        this.exploreBtn = document.getElementById('explore-btn');
        this.trainedBtn = document.getElementById('trained-btn');
        this.revealBtn = document.getElementById('reveal-btn');

        // Animation state
        this.isAnimating = false;

        // Initialize
        this.initializeDemo();
    }

    async initializeDemo() {
        try {
            // Initialize frontend components
            await this.initializeFrontend();

            // Reset session to ensure fresh start on page load
            this.resetUserSession(false);

            console.log('Multi-armed bandit demo initialized successfully');
        } catch (error) {
            console.error('Failed to initialize demo:', error);
            this.showError('Failed to initialize frontend components.');
        }
    }

    async initializeFrontend() {
        console.log('Initializing frontend bandit components...');
        try {
            // Preload bandit data for demonstrations
            await this.banditSimulator.loadBanditData();
            console.log('Frontend initialization successful');
            return { status: 'ready', message: 'Frontend components initialized' };
        } catch (error) {
            console.error('Frontend initialization error:', error);
            throw error;
        }
    }

    updateSessionState() {
        try {
            const statistics = this.banditSession.getStatistics();
            const canPull = this.banditSession.canPull();

            this.updateUI(statistics);
            this.updateButtonStates(canPull);
        } catch (error) {
            console.error('Error updating session state:', error);
        }
    }

    updateUI(statistics) {
        // Update total pulls
        this.totalPullsElement.textContent = statistics.total_pulls;

        // Update total rewards
        const totalRewards = statistics.arm_rewards.reduce((sum, reward) => sum + reward, 0);
        this.totalRewardsElement.textContent = totalRewards;

        // Color code the total rewards
        if (totalRewards > 0) {
            this.totalRewardsElement.style.color = '#28a745'; // Green
        } else if (totalRewards < 0) {
            this.totalRewardsElement.style.color = '#dc3545'; // Red
        } else {
            this.totalRewardsElement.style.color = '#007bff'; // Blue
        }

        // Update arm statistics
        for (let arm = 1; arm <= 3; arm++) {
            const armIndex = arm - 1;
            this.statElements[arm].total.textContent = statistics.arm_rewards[armIndex];
            this.statElements[arm].count.textContent = statistics.arm_pulls[armIndex];
            this.statElements[arm].mean.textContent = statistics.arm_means[armIndex].toFixed(3);
        }
    }

    updateButtonStates(canPull) {
        const disabled = !canPull || this.isAnimating;
        for (let arm = 1; arm <= 3; arm++) {
            this.armButtons[arm].disabled = disabled;
        }
    }

    showError(message) {
        alert(`Error: ${message}`);
    }

    showSuccess(reward, unused = null, armIndex = null) {
        const color = reward > 0 ? '#28a745' : reward < 0 ? '#dc3545' : '#6c757d';
        const prefix = reward > 0 ? '+' : '';
        this.showToast(`${prefix}${reward}`, color, armIndex);
    }

    showToast(message, color = 'blue', armIndex = null) {
        // Create toast notification
        const toast = document.createElement('div');

        let position = '';
        if (armIndex && this.armButtons[armIndex]) {
            // Position near the clicked button
            const buttonRect = this.armButtons[armIndex].getBoundingClientRect();
            const centerX = buttonRect.left + buttonRect.width / 2;
            const topY = buttonRect.top - 10;

            position = `
                position: fixed;
                left: ${centerX}px;
                top: ${topY}px;
                transform: translateX(-50%) translateY(-100%);
            `;
        } else {
            // Fallback to center-top position
            position = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
            `;
        }

        toast.style.cssText = `
            ${position}
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.2);
            animation: toastSlideIn 0.3s ease-out;
        `;
        toast.textContent = message;

        // Add CSS animation
        if (!document.querySelector('#toast-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'toast-styles';
            styleSheet.textContent = `
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-120%) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-100%) scale(1);
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(-100%) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-120%) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(toast);

        // Remove after 2.5 seconds with fade out animation
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2500);
    }

    pullArm(arm) {
        if (this.isAnimating) return;

        try {
            // Visual feedback
            this.armButtons[arm].style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.armButtons[arm].style.transform = '';
            }, 150);

            // Use frontend bandit session
            const result = this.banditSession.pullArm(arm);

            if (result.success) {
                this.updateUI(result.statistics);
                this.updateButtonStates(result.statistics.total_pulls < result.statistics.max_pulls);
                this.showSuccess(result.reward, null, arm);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('Error pulling arm:', error);
            this.showError('Failed to pull arm. Please try again.');
        }
    }

    resetUserSession(showMessage = true) {
        try {
            // Reset frontend bandit session
            this.banditSession.reset();

            const statistics = this.banditSession.getStatistics();
            this.updateUI(statistics);
            this.updateButtonStates(true);

            if (showMessage) {
                this.showToast('Game reset successfully!', '#28a745');
            }

            // Hide results if shown
            this.resultsContainer.style.display = 'none';
            this.distributionReveal.classList.add('hidden');
        } catch (error) {
            console.error('Error resetting session:', error);
            this.showError('Failed to reset session. Please try again.');
        }
    }

    async demonstrateExploration() {
        if (this.isAnimating) return;

        try {
            this.isAnimating = true;
            this.updateButtonStates(false);
            this.setDemoButtonStates(false);

            this.resultsContainer.style.display = 'grid';
            this.explorationDisplay.textContent = 'Starting exploration demonstration...';
            this.performanceDisplay.textContent = 'Algorithm estimates will appear here...';
            this.explorationProgress.style.width = '0%';

            // Force layout reflow to fix positioning
            this.resultsContainer.offsetHeight;

            // Use frontend bandit simulator
            const results = await this.banditSimulator.demonstrateExploration(50);
            await this.animateExploration(results);
        } catch (error) {
            console.error('Error in exploration demo:', error);
            this.showError('Failed to run exploration demo. Please try again.');
        } finally {
            this.isAnimating = false;
            this.updateButtonStates(true);
            this.setDemoButtonStates(true);
        }
    }

    async animateExploration(results) {
        const history = results.simulation_steps;
        const summary = results.summary;
        const trueMeans = [0.0, 0.4, 0.5]; // Known true means

        for (let i = 0; i < history.length; i++) {
            const step = history[i];

            // Update progress bar
            const progress = ((i + 1) / history.length) * 100;
            this.explorationProgress.style.width = `${progress}%`;

            // Update exploration display
            const actionType = step.action_type === 'explore' ? '🔍 EXPLORE' : '⚡ EXPLOIT';
            this.explorationDisplay.innerHTML = `
                <strong>Step ${step.step + 1}/${history.length}</strong><br>
                Action: ${actionType}<br>
                Chose Arm ${step.arm + 1}, Got Reward: ${step.reward}<br>
                Cumulative Reward: ${step.total_reward.toFixed(1)}
            `;

            // Update performance display with estimates
            let estimatesText = '<strong>Algorithm Estimates:</strong><br>';
            for (let j = 0; j < 3; j++) {
                const estimate = step.estimates[j].toFixed(3);
                const trueValue = trueMeans[j].toFixed(3);
                const count = step.counts[j];
                estimatesText += `Arm ${j + 1}: ${estimate} (true: ${trueValue}, pulls: ${count})<br>`;
            }
            this.performanceDisplay.innerHTML = estimatesText;

            // Wait before next step
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Final summary
        this.explorationDisplay.innerHTML = `
            <strong>Exploration Complete!</strong><br>
            Total Reward: ${summary.total_reward.toFixed(1)}<br>
            Average Reward: ${summary.average_reward.toFixed(3)}<br>
            Algorithm has learned the arm values!
        `;
    }

    async demonstrateTrained() {
        if (this.isAnimating) return;

        try {
            this.isAnimating = true;
            this.updateButtonStates(false);
            this.setDemoButtonStates(false);

            this.resultsContainer.style.display = 'grid';
            this.explorationDisplay.textContent = 'Running trained algorithm demonstration...';
            this.performanceDisplay.textContent = 'Performance metrics will appear here...';
            this.explorationProgress.style.width = '0%';

            // Force layout reflow to fix positioning
            this.resultsContainer.offsetHeight;

            // Use frontend bandit simulator
            const results = await this.banditSimulator.demonstrateTrained(50);
            await this.animateTrainedPerformance(results);
        } catch (error) {
            console.error('Error in trained demo:', error);
            this.showError('Failed to run trained demo. Please try again.');
        } finally {
            this.isAnimating = false;
            this.updateButtonStates(true);
            this.setDemoButtonStates(true);
        }
    }

    async animateTrainedPerformance(results) {
        const history = results.simulation_steps;
        const trueMeans = [0.0, 0.4, 0.5]; // Known true means
        const finalEstimates = results.summary.initial_estimates;

        // Track performance statistics during demo
        let cumulativeReward = 0;
        let armPulls = [0, 0, 0];
        let armRewards = [0, 0, 0];

        for (let i = 0; i < history.length; i++) {
            const step = history[i];
            cumulativeReward += step.reward;

            // Update arm-specific statistics
            armPulls[step.arm]++;
            armRewards[step.arm] += step.reward;

            // Update progress bar
            const progress = ((i + 1) / history.length) * 100;
            this.explorationProgress.style.width = `${progress}%`;

            // Update exploration display
            const actionType = step.action_type === 'explore' ? '🔍 EXPLORE' : '⚡ EXPLOIT';
            this.explorationDisplay.innerHTML = `
                <strong>Step ${step.step + 1}/${history.length}</strong><br>
                Action: ${actionType}<br>
                Chose Arm ${step.arm + 1}, Got Reward: ${step.reward}<br>
                Cumulative Reward: ${cumulativeReward.toFixed(1)}
            `;

            // Update performance display with live statistics
            let performanceText = '<strong>Pure Greedy Performance:</strong><br>';
            for (let j = 0; j < 3; j++) {
                const meanReward = armPulls[j] > 0 ? (armRewards[j] / armPulls[j]).toFixed(3) : '0.000';
                performanceText += `Arm ${j + 1}: Mean=${meanReward}, Pulls=${armPulls[j]}<br>`;
            }
            performanceText += `<br>Overall Average: ${(cumulativeReward / (i + 1)).toFixed(3)}`;
            this.performanceDisplay.innerHTML = performanceText;

            // Wait before next step
            await new Promise(resolve => setTimeout(resolve, 80));
        }

        // After demo completes, show the final stats and agent's learned estimates
        setTimeout(() => {
            let finalText = '<strong>Pure Greedy Demo Results:</strong><br>';
            for (let j = 0; j < 3; j++) {
                const meanReward = armPulls[j] > 0 ? (armRewards[j] / armPulls[j]).toFixed(3) : '0.000';
                finalText += `Arm ${j + 1}: Mean=${meanReward}, Pulls=${armPulls[j]}<br>`;
            }
            finalText += `<br><strong>Agent's Learned Estimates (Fixed):</strong><br>`;
            for (let j = 0; j < 3; j++) {
                const estimate = finalEstimates[j].toFixed(3);
                const trueValue = trueMeans[j].toFixed(3);
                finalText += `Arm ${j + 1}: Learned=${estimate}, True=${trueValue}<br>`;
            }
            this.performanceDisplay.innerHTML = finalText;
        }, 1000); // Show after 1 second delay

        // Final summary
        this.explorationDisplay.innerHTML = `
            <strong>Pure Greedy Performance Complete!</strong><br>
            Total Reward: ${cumulativeReward.toFixed(1)}<br>
            Average Reward: ${(cumulativeReward / history.length).toFixed(3)}<br>
            Optimal Arm Usage: ${results.summary.optimal_percentage.toFixed(1)}%
        `;
    }

    async revealDistributions() {
        try {
            // Use frontend bandit simulator
            const data = await this.banditSimulator.revealDistributions();
            this.displayDistributions(data);
        } catch (error) {
            console.error('Error revealing distributions:', error);
            this.showError('Failed to reveal distributions. Please try again.');
        }
    }

    displayDistributions(data) {
        let distributionText = '<h4>True Probability Distributions</h4>';

        data.arms_info.forEach(armInfo => {
            distributionText += `<div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">`;
            distributionText += `<strong>Arm ${armInfo.arm}:</strong><br>`;

            // Format probability distribution text
            let distText = '';
            for (let i = 0; i < armInfo.rewards.length; i++) {
                if (i > 0) distText += ', ';
                distText += `P(${armInfo.rewards[i]}) = ${armInfo.probabilities[i]}`;
            }

            distributionText += `${distText}<br>`;
            distributionText += `<strong>Expected Reward: ${armInfo.expected_reward.toFixed(3)}</strong>`;
            distributionText += `</div>`;
        });

        distributionText += `<div style="margin: 15px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">`;
        distributionText += `<strong>Optimal Strategy:</strong> Choose Arm ${data.optimal_arm} (highest expected reward)`;
        distributionText += `</div>`;

        distributionText += `<div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">`;
        distributionText += 'The epsilon-greedy algorithm balances exploration and exploitation by choosing the best-known arm most of the time, but occasionally exploring other options to gather more information.';
        distributionText += `</div>`;

        this.distributionDisplay.innerHTML = distributionText;
        this.distributionReveal.classList.remove('hidden');

        // Scroll to reveal
        this.distributionReveal.scrollIntoView({ behavior: 'smooth' });
    }

    setDemoButtonStates(enabled) {
        this.exploreBtn.disabled = !enabled;
        this.trainedBtn.disabled = !enabled;
        this.revealBtn.disabled = !enabled;
    }
}

// Global functions for HTML event handlers
function pullArm(arm) {
    if (window.banditDemo) {
        window.banditDemo.pullArm(arm);
    }
}

function resetUserSession() {
    if (window.banditDemo) {
        window.banditDemo.resetUserSession();
    }
}

function demonstrateExploration() {
    if (window.banditDemo) {
        window.banditDemo.demonstrateExploration();
    }
}

function demonstrateTrained() {
    if (window.banditDemo) {
        window.banditDemo.demonstrateTrained();
    }
}

function revealDistributions() {
    if (window.banditDemo) {
        window.banditDemo.revealDistributions();
    }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.banditDemo = new MultiarmedBanditDemo();
});