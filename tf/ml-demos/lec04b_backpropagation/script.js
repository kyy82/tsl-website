class BackpropagationDemo {
    constructor() {
        this.networkContainer = document.getElementById('network-container');
        this.lossValueDisplay = document.getElementById('loss-value');
        this.stepCountDisplay = document.getElementById('step-count');
        this.lossCanvas = document.getElementById('loss-canvas');
        this.lossCtx = this.lossCanvas.getContext('2d');
        
        // Input controls
        this.input1Slider = document.getElementById('input1');
        this.input2Slider = document.getElementById('input2');
        this.input1Num = document.getElementById('input1-num');
        this.input2Num = document.getElementById('input2-num');
        this.targetInput = document.getElementById('target');
        
        // Learning controls
        this.learningRateSlider = document.getElementById('learning-rate');
        this.learningRateNum = document.getElementById('learning-rate-num');
        this.stepBtn = document.getElementById('step-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Fixed network architecture: 2 inputs -> 3 hidden -> 1 output
        this.architecture = [2, 3, 1];
        
        // Network state
        this.weights = [];
        this.activations = [];
        this.preActivations = [];
        this.gradients = {
            weights: []
        };
        
        // Training state
        this.stepCount = 0;
        this.lossHistory = [];
        this.currentLoss = 0;
        
        // UI state
        this.highlightedConnection = null;
        
        // Visualization
        this.nodePositions = [];
        
        this.initializeNetwork();
        this.setupEventListeners();
        this.renderNetwork();
        this.forwardPass();
        this.updateVisualization();
        this.drawLossGraph();
    }
    
    initializeNetwork() {
        this.weights = [];
        
        // Initialize weights between layers
        for (let i = 0; i < this.architecture.length - 1; i++) {
            const currentSize = this.architecture[i];
            const nextSize = this.architecture[i + 1];
            
            // Weight matrix [nextSize x currentSize]
            const layerWeights = [];
            for (let j = 0; j < nextSize; j++) {
                const neuronWeights = [];
                for (let k = 0; k < currentSize; k++) {
                    // Xavier initialization
                    const limit = Math.sqrt(6 / (currentSize + nextSize));
                    neuronWeights.push((Math.random() * 2 - 1) * limit);
                }
                layerWeights.push(neuronWeights);
            }
            this.weights.push(layerWeights);
        }
        
        // Initialize gradient storage
        this.gradients.weights = this.weights.map(layer => 
            layer.map(neuron => neuron.map(() => 0))
        );
    }
    
    setupEventListeners() {
        // Input controls
        [this.input1Slider, this.input2Slider].forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                const numInput = [this.input1Num, this.input2Num][index];
                numInput.value = e.target.value;
                this.forwardPass();
                this.backwardPass();
                this.updateVisualization();
            });
        });
        
        [this.input1Num, this.input2Num].forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const slider = [this.input1Slider, this.input2Slider][index];
                const inputValue = e.target.value;
                
                // Allow empty input, decimal points, and negative signs while typing
                if (inputValue === '' || inputValue === '-' || inputValue.endsWith('.') || inputValue === '-.') {
                    return; // Don't process incomplete input
                }
                
                const numValue = parseFloat(inputValue);
                if (isNaN(numValue)) {
                    return; // Don't process invalid numbers
                }
                
                const clampedValue = Math.max(-5, Math.min(5, numValue));
                slider.value = clampedValue;
                
                // Only update input value if it was clamped
                if (clampedValue !== numValue) {
                    e.target.value = clampedValue;
                }
                
                this.forwardPass();
                this.backwardPass();
                this.updateVisualization();
            });
        });
        
        this.targetInput.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            
            // Allow empty input, decimal points, and negative signs while typing
            if (inputValue === '' || inputValue === '-' || inputValue.endsWith('.') || inputValue === '-.') {
                return; // Don't process incomplete input
            }
            
            const numValue = parseFloat(inputValue);
            if (isNaN(numValue)) {
                return; // Don't process invalid numbers
            }
            
            this.forwardPass();
            this.backwardPass();
            this.updateVisualization();
        });
        
        // Learning rate controls
        this.learningRateSlider.addEventListener('input', (e) => {
            this.learningRateNum.value = e.target.value;
        });
        
        this.learningRateNum.addEventListener('input', (e) => {
            const inputValue = e.target.value;
            
            // Handle empty input - reset to default
            if (inputValue === '') {
                this.learningRateSlider.value = 0.01; // Reset to default
                return;
            }
            
            // Allow empty input, decimal points, and negative signs while typing
            if (inputValue === '' || inputValue === '-' || inputValue.endsWith('.') || inputValue === '-.') {
                return; // Don't process incomplete input
            }
            
            const numValue = parseFloat(inputValue);
            if (isNaN(numValue)) {
                return; // Don't process invalid numbers
            }
            
            const clampedValue = Math.max(0, Math.min(1.0, numValue));
            this.learningRateSlider.value = clampedValue;
            
            // Only update input value if it was clamped
            if (clampedValue !== numValue) {
                e.target.value = clampedValue;
            }
        });
        
        // Buttons
        this.stepBtn.addEventListener('click', () => this.stepOptimization());
        this.resetBtn.addEventListener('click', () => this.resetNetwork());
    }
    
    forwardPass() {
        // Get inputs
        const inputs = [
            parseFloat(this.input1Slider.value),
            parseFloat(this.input2Slider.value)
        ];

        this.activations = [inputs];
        this.preActivations = [inputs]; // Input layer has no pre-activation

        // Forward through each layer
        for (let i = 0; i < this.weights.length; i++) {
            const currentActivations = this.activations[i];
            const layerWeights = this.weights[i];

            const nextPreActivations = [];
            const nextActivations = [];

            for (let j = 0; j < layerWeights.length; j++) {
                let sum = 0; // No bias term
                for (let k = 0; k < currentActivations.length; k++) {
                    sum += currentActivations[k] * layerWeights[j][k];
                }
                nextPreActivations.push(sum);

                // Apply activation function
                let activation;
                if (i === this.weights.length - 1) {
                    // Output layer: linear activation
                    activation = sum;
                } else {
                    // Hidden layer: ReLU activation
                    activation = Math.max(0, sum);
                }
                nextActivations.push(activation);
            }

            this.preActivations.push(nextPreActivations);
            this.activations.push(nextActivations);
        }

        // Calculate loss (MSE)
        const prediction = this.activations[this.activations.length - 1][0];
        const targetValue = parseFloat(this.targetInput.value);
        const target = isNaN(targetValue) ? 0 : targetValue; // Default to 0 if invalid
        this.currentLoss = 0.5 * Math.pow(prediction - target, 2);
    }
    
    backwardPass() {
        const targetValue = parseFloat(this.targetInput.value);
        const target = isNaN(targetValue) ? 0 : targetValue; // Default to 0 if invalid
        const prediction = this.activations[this.activations.length - 1][0];
        
        // Initialize gradients
        const deltaActivations = [];
        
        // Output layer gradient
        const outputDelta = [prediction - target]; // ∂L/∂a for MSE
        deltaActivations.push(outputDelta);
        
        // Backward through layers
        for (let i = this.weights.length - 1; i >= 0; i--) {
            const currentDeltas = deltaActivations[deltaActivations.length - 1];
            const layerWeights = this.weights[i];
            
            // Compute gradients for weights only
            for (let j = 0; j < layerWeights.length; j++) {
                for (let k = 0; k < layerWeights[j].length; k++) {
                    this.gradients.weights[i][j][k] = currentDeltas[j] * this.activations[i][k];
                }
            }
            
            // Compute deltas for previous layer (if not input layer)
            if (i > 0) {
                const prevDeltas = [];
                for (let k = 0; k < this.activations[i].length; k++) {
                    let delta = 0;
                    for (let j = 0; j < layerWeights.length; j++) {
                        delta += currentDeltas[j] * layerWeights[j][k];
                    }
                    
                    // Apply derivative of activation function
                    if (i > 0) { // Hidden layers use ReLU
                        delta *= this.preActivations[i][k] > 0 ? 1 : 0; // ReLU derivative
                    }
                    
                    prevDeltas.push(delta);
                }
                deltaActivations.push(prevDeltas);
            }
        }
    }
    
    stepOptimization() {
        const learningRate = parseFloat(this.learningRateSlider.value);
        
        // Update weights only
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    this.weights[i][j][k] -= learningRate * this.gradients.weights[i][j][k];
                }
            }
        }
        
        // Update step count and loss history
        this.stepCount++;
        this.lossHistory.push(this.currentLoss);
        
        // Recompute forward and backward pass with new weights
        this.forwardPass();
        this.backwardPass();
        this.updateVisualization();
        this.drawLossGraph();
        
        // Keep loss history manageable
        if (this.lossHistory.length > 100) {
            this.lossHistory.shift();
        }
    }
    
    resetNetwork() {
        this.initializeNetwork();
        this.stepCount = 0;
        this.lossHistory = [];
        this.forwardPass();
        this.backwardPass();
        this.updateVisualization();
        this.drawLossGraph();
    }
    
    renderNetwork() {
        this.networkContainer.innerHTML = '';
        
        const containerWidth = this.networkContainer.clientWidth - 100;
        const containerHeight = this.networkContainer.clientHeight - 100;
        
        // Increase spacing between layers significantly
        const layerSpacing = containerHeight / (this.architecture.length + 0.5);
        
        this.nodePositions = [];
        
        this.architecture.forEach((layerSize, layerIndex) => {
            const layerPositions = [];
            
            // Increase spacing between nodes within layers
            const nodeSpacing = Math.min(containerWidth / (layerSize + 0.5), 120);
            const totalWidth = (layerSize - 1) * nodeSpacing;
            const startX = (containerWidth - totalWidth) / 2 + 50;
            
            // Create layer label
            const layerLabel = document.createElement('div');
            layerLabel.className = 'network-layer-label';
            layerLabel.style.left = '10px';
            layerLabel.style.top = `${(layerIndex + 1) * layerSpacing + 30 - 10}px`;
            
            if (layerIndex === 0) layerLabel.textContent = 'Input';
            else if (layerIndex === this.architecture.length - 1) layerLabel.textContent = 'Output';
            else layerLabel.textContent = 'Hidden';
            
            this.networkContainer.appendChild(layerLabel);
            
            // Create nodes
            for (let nodeIndex = 0; nodeIndex < layerSize; nodeIndex++) {
                const node = document.createElement('div');
                node.className = `network-node ${layerIndex === 0 ? 'input' : 
                                 layerIndex === this.architecture.length - 1 ? 'output' : 'hidden'}`;
                
                const x = startX + nodeIndex * nodeSpacing - 22.5;
                const y = (layerIndex + 1) * layerSpacing + 30 - 22.5;
                
                node.style.left = `${x}px`;
                node.style.top = `${y}px`;
                node.textContent = '0.00';
                
                layerPositions.push({ x: x + 22.5, y: y + 22.5 });
                this.networkContainer.appendChild(node);
            }
            
            this.nodePositions.push(layerPositions);
        });
        
        this.drawConnections();
    }
    
    drawConnections() {
        // Remove existing connections
        document.querySelectorAll('.network-edge').forEach(el => el.remove());
        
        for (let layerIndex = 0; layerIndex < this.architecture.length - 1; layerIndex++) {
            const currentPositions = this.nodePositions[layerIndex];
            const nextPositions = this.nodePositions[layerIndex + 1];
            
            currentPositions.forEach((fromPos, fromIndex) => {
                nextPositions.forEach((toPos, toIndex) => {
                    // Draw connection line with styling based on weight and gradient
                    const edge = document.createElement('div');
                    edge.className = 'network-edge';
                    
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    edge.style.left = `${fromPos.x}px`;
                    edge.style.top = `${fromPos.y}px`;
                    edge.style.width = `${length}px`;
                    edge.style.transform = `rotate(${angle}rad)`;
                    
                    // Style connection based on weight and gradient
                    this.styleConnection(edge, layerIndex, toIndex, fromIndex);
                    
                    this.networkContainer.appendChild(edge);
                });
            });
        }
    }
    
    styleConnection(edge, layerIndex, toIndex, fromIndex) {
        const weight = this.weights[layerIndex][toIndex][fromIndex];
        
        // Base thickness (can be overridden by hover highlighting)
        let thickness = 3;
        
        // Check if this connection should be highlighted
        const connectionId = `${layerIndex}-${toIndex}-${fromIndex}`;
        if (this.highlightedConnection === connectionId) {
            thickness = 6; // Thicker when highlighted
        }
        
        // Determine color based on weight sign and magnitude using saturation
        const weightMagnitude = Math.abs(weight);
        const saturation = Math.min(weightMagnitude / 2, 1) * 100; // 0-100% saturation
        
        let color;
        if (weight > 0) {
            // Positive weights: green with varying saturation
            color = `hsl(120, ${saturation}%, 40%)`; // Green hue, variable saturation, medium lightness
        } else {
            // Negative weights: red with varying saturation
            color = `hsl(0, ${saturation}%, 40%)`; // Red hue, variable saturation, medium lightness
        }
        
        // Apply styles
        edge.style.height = `${thickness}px`;
        edge.style.background = color;
        edge.style.opacity = this.highlightedConnection === connectionId ? 1.0 : 0.8;
    }
    
    updateVisualization() {
        // Update node values
        const nodes = document.querySelectorAll('.network-node');
        let nodeIndex = 0;
        
        this.activations.forEach((layerActivations, layerIdx) => {
            layerActivations.forEach((activation, nodeIdx) => {
                const node = nodes[nodeIndex];
                if (node) {
                    node.textContent = activation.toFixed(2);
                    
                    // Color based on value
                    const isPositive = activation >= 0;
                    const intensity = Math.min(Math.abs(activation), 3) / 3;
                    const alpha = 0.3 + intensity * 0.5;
                    
                    let baseColor;
                    if (layerIdx === 0) {
                        baseColor = [25, 118, 210]; // Blue
                    } else if (layerIdx === this.activations.length - 1) {
                        baseColor = [56, 142, 60]; // Green
                    } else {
                        baseColor = [123, 31, 162]; // Purple
                    }
                    
                    node.style.backgroundColor = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
                    node.style.color = intensity > 0.6 ? 'white' : (isPositive ? `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})` : '#d32f2f');
                }
                nodeIndex++;
            });
        });
        
        // Update connection styling
        this.drawConnections();
        
        // Update tables
        this.updateTables();
        
        // Update loss display
        this.lossValueDisplay.textContent = this.currentLoss.toFixed(4);
        this.stepCountDisplay.textContent = this.stepCount;
    }
    
    updateTables() {
        this.updateWeightsTable();
        this.updateGradientsTable();
    }
    
    updateWeightsTable() {
        const container = document.getElementById('weights-table');
        if (!container) return;
        
        let html = '';
        
        // Input → Hidden weights (organized by input columns)
        html += `<div class="layer-section">
            <div class="layer-title">Input → Hidden Weights</div>
            <div class="weights-grid">
                <div class="column-header">From I1</div>
                <div class="column-header">From I2</div>
                <div class="column-header">Hidden → Output</div>
                
                <div class="column-data">`;
        
        // I1 to Hidden weights
        for (let toIndex = 0; toIndex < 3; toIndex++) {
            const weight = this.weights[0][toIndex][0];
            const valueClass = weight >= 0 ? 'positive-value' : 'negative-value';
            html += `<div class="weight-row" 
                onmouseover="demo.highlightConnection(0, ${toIndex}, 0)"
                onmouseout="demo.clearHighlight()">
                <span>→ H${toIndex + 1}:</span>
                <span class="connection-value ${valueClass}">${weight.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div><div class="column-data">`;
        
        // I2 to Hidden weights  
        for (let toIndex = 0; toIndex < 3; toIndex++) {
            const weight = this.weights[0][toIndex][1];
            const valueClass = weight >= 0 ? 'positive-value' : 'negative-value';
            html += `<div class="weight-row" 
                onmouseover="demo.highlightConnection(0, ${toIndex}, 1)"
                onmouseout="demo.clearHighlight()">
                <span>→ H${toIndex + 1}:</span>
                <span class="connection-value ${valueClass}">${weight.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div><div class="column-data">`;
        
        // Hidden to Output weights
        for (let fromIndex = 0; fromIndex < 3; fromIndex++) {
            const weight = this.weights[1][0][fromIndex];
            const valueClass = weight >= 0 ? 'positive-value' : 'negative-value';
            html += `<div class="weight-row" 
                onmouseover="demo.highlightConnection(1, 0, ${fromIndex})"
                onmouseout="demo.clearHighlight()">
                <span>H${fromIndex + 1} →:</span>
                <span class="connection-value ${valueClass}">${weight.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div></div></div>`;
        
        container.innerHTML = html;
    }
    
    updateGradientsTable() {
        const container = document.getElementById('gradients-table');
        if (!container) return;
        
        let html = '';
        
        // Input → Hidden gradients (organized by input columns)
        html += `<div class="layer-section">
            <div class="layer-title">Input → Hidden Gradients</div>
            <div class="weights-grid">
                <div class="column-header">From I1</div>
                <div class="column-header">From I2</div>
                <div class="column-header">Hidden → Output</div>
                
                <div class="column-data">`;
        
        // I1 to Hidden gradients
        for (let toIndex = 0; toIndex < 3; toIndex++) {
            const gradient = this.gradients.weights[0][toIndex][0];
            const valueClass = gradient >= 0 ? 'positive-value' : 'negative-value';
            const magnitude = Math.abs(gradient);
            
            let rowClass = 'gradient-row';
            
            html += `<div class="${rowClass}" 
                onmouseover="demo.highlightConnection(0, ${toIndex}, 0)"
                onmouseout="demo.clearHighlight()">
                <span>→ H${toIndex + 1}:</span>
                <span class="connection-value ${valueClass}">${gradient.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div><div class="column-data">`;
        
        // I2 to Hidden gradients  
        for (let toIndex = 0; toIndex < 3; toIndex++) {
            const gradient = this.gradients.weights[0][toIndex][1];
            const valueClass = gradient >= 0 ? 'positive-value' : 'negative-value';
            const magnitude = Math.abs(gradient);
            
            let rowClass = 'gradient-row';
            
            html += `<div class="${rowClass}" 
                onmouseover="demo.highlightConnection(0, ${toIndex}, 1)"
                onmouseout="demo.clearHighlight()">
                <span>→ H${toIndex + 1}:</span>
                <span class="connection-value ${valueClass}">${gradient.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div><div class="column-data">`;
        
        // Hidden to Output gradients
        for (let fromIndex = 0; fromIndex < 3; fromIndex++) {
            const gradient = this.gradients.weights[1][0][fromIndex];
            const valueClass = gradient >= 0 ? 'positive-value' : 'negative-value';
            const magnitude = Math.abs(gradient);
            
            let rowClass = 'gradient-row';
            
            html += `<div class="${rowClass}" 
                onmouseover="demo.highlightConnection(1, 0, ${fromIndex})"
                onmouseout="demo.clearHighlight()">
                <span>H${fromIndex + 1} →:</span>
                <span class="connection-value ${valueClass}">${gradient.toFixed(3)}</span>
            </div>`;
        }
        
        html += `</div></div></div>`;
        
        container.innerHTML = html;
    }
    
    highlightConnection(layerIndex, toIndex, fromIndex) {
        this.highlightedConnection = `${layerIndex}-${toIndex}-${fromIndex}`;
        this.drawConnections(); // Redraw connections with highlighting
    }
    
    clearHighlight() {
        this.highlightedConnection = null;
        this.drawConnections(); // Redraw connections without highlighting
    }
    
    drawLossGraph() {
        const ctx = this.lossCtx;
        const canvas = this.lossCanvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.lossHistory.length < 2) return;
        
        // Find min/max for scaling
        const maxLoss = Math.max(...this.lossHistory);
        const minLoss = Math.min(...this.lossHistory);
        const range = maxLoss - minLoss || 1;
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, 180);
        ctx.lineTo(380, 180);
        ctx.stroke();
        
        // Draw loss curve
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const xStep = 340 / (this.lossHistory.length - 1);
        
        this.lossHistory.forEach((loss, index) => {
            const x = 40 + index * xStep;
            const y = 180 - ((loss - minLoss) / range) * 160;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        
        // Y-axis labels
        ctx.fillText(maxLoss.toFixed(3), 35, 25);
        ctx.fillText(minLoss.toFixed(3), 35, 185);
        
        // X-axis label
        ctx.textAlign = 'center';
        ctx.fillText('Steps', 210, 200);
    }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new BackpropagationDemo();
});