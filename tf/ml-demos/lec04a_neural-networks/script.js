class NeuralNetworkDemo {
    constructor() {
        this.networkContainer = document.getElementById('network-container');
        this.layerControls = document.getElementById('layer-controls');
        this.addLayerBtn = document.getElementById('add-layer-btn');
        this.removeLayerBtn = document.getElementById('remove-layer-btn');
        this.randomInputsBtn = document.getElementById('random-inputs-btn');
        
        // Input controls
        this.input1Slider = document.getElementById('input1');
        this.input2Slider = document.getElementById('input2');
        this.input3Slider = document.getElementById('input3');
        this.input1Num = document.getElementById('input1-num');
        this.input2Num = document.getElementById('input2-num');
        this.input3Num = document.getElementById('input3-num');
        
        // Network architecture
        this.layers = [
            { type: 'input', units: 3, activation: 'linear' },
            { type: 'hidden', units: 4, activation: 'relu' },
            { type: 'hidden', units: 3, activation: 'relu' },
            { type: 'output', units: 1, activation: 'sigmoid' }
        ];
        
        // Network weights and values
        this.weights = [];
        this.biases = [];
        this.layerValues = [];
        this.preActivationValues = []; // Store pre-activation values
        
        // UI state
        this.selectedNode = null;
        this.animationActive = false;
        
        this.initializeNetwork();
        this.setupEventListeners();
        this.renderLayerControls();
        this.updateLayerButtons();
        this.renderNetwork();
        this.updateNetwork();
    }
    
    initializeNetwork() {
        this.weights = [];
        this.biases = [];
        
        // Initialize weights between each consecutive layer
        for (let i = 0; i < this.layers.length - 1; i++) {
            const currentLayer = this.layers[i];
            const nextLayer = this.layers[i + 1];
            
            // Weight matrix: [nextLayer.units][currentLayer.units]
            const layerWeights = [];
            for (let j = 0; j < nextLayer.units; j++) {
                const neuronWeights = [];
                for (let k = 0; k < currentLayer.units; k++) {
                    neuronWeights.push((Math.random() - 0.5) * 2); // Random between -1 and 1
                }
                layerWeights.push(neuronWeights);
            }
            this.weights.push(layerWeights);
            
            // Biases for next layer
            const layerBiases = [];
            for (let j = 0; j < nextLayer.units; j++) {
                layerBiases.push((Math.random() - 0.5) * 2);
            }
            this.biases.push(layerBiases);
        }
    }
    
    setupEventListeners() {
        // Input controls
        [this.input1Slider, this.input2Slider, this.input3Slider].forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                const numInput = [this.input1Num, this.input2Num, this.input3Num][index];
                numInput.value = e.target.value;
                this.updateNetwork();
            });
        });
        
        [this.input1Num, this.input2Num, this.input3Num].forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const slider = [this.input1Slider, this.input2Slider, this.input3Slider][index];
                const value = Math.max(-5, Math.min(5, parseFloat(e.target.value) || 0));
                slider.value = value;
                e.target.value = value;
                this.updateNetwork();
            });
        });
        
        // Architecture controls
        this.addLayerBtn.addEventListener('click', () => this.addLayer());
        this.removeLayerBtn.addEventListener('click', () => this.removeLayer());
        this.randomInputsBtn.addEventListener('click', () => this.generateRandomInputs());
        
        // Modal close on outside click
        document.getElementById('weight-modal').addEventListener('click', (e) => {
            if (e.target.id === 'weight-modal') {
                this.closeWeightModal();
            }
        });
    }
    
    addLayer() {
        // Count current hidden layers
        const hiddenLayerCount = this.layers.filter(layer => layer.type === 'hidden').length;
        
        // Limit to maximum 3 hidden layers
        if (hiddenLayerCount >= 3) {
            return; // Don't add more layers
        }
        
        // Insert new hidden layer before output layer
        const newLayer = { type: 'hidden', units: 3, activation: 'relu' };
        this.layers.splice(this.layers.length - 1, 0, newLayer);
        this.initializeNetwork();
        this.renderLayerControls();
        this.renderNetwork();
        this.updateNetwork();
        
        // Update button state
        this.updateLayerButtons();
    }
    
    removeLayer() {
        if (this.layers.length > 2) { // Keep at least input and output
            this.layers.splice(this.layers.length - 2, 1); // Remove last hidden layer
            this.initializeNetwork();
            this.renderLayerControls();
            this.renderNetwork();
            this.updateNetwork();
            
            // Update button state
            this.updateLayerButtons();
        }
    }
    
    generateRandomInputs() {
        this.input1Slider.value = (Math.random() - 0.5) * 8;
        this.input2Slider.value = (Math.random() - 0.5) * 8;
        this.input3Slider.value = (Math.random() - 0.5) * 8;
        
        this.input1Num.value = this.input1Slider.value;
        this.input2Num.value = this.input2Slider.value;
        this.input3Num.value = this.input3Slider.value;
        
        this.updateNetwork();
    }
    
    updateLayerButtons() {
        const hiddenLayerCount = this.layers.filter(layer => layer.type === 'hidden').length;
        
        // Disable add button if at maximum layers (3 hidden layers)
        this.addLayerBtn.disabled = hiddenLayerCount >= 3;
        
        // Disable remove button if at minimum layers (0 hidden layers - just input and output)
        this.removeLayerBtn.disabled = hiddenLayerCount <= 0;
        
        // Update button text to show current state
        if (hiddenLayerCount >= 3) {
            this.addLayerBtn.textContent = '+ Add Layer (Max: 3)';
        } else {
            this.addLayerBtn.textContent = '+ Add Layer';
        }
        
        if (hiddenLayerCount <= 0) {
            this.removeLayerBtn.textContent = '- Remove Layer (Min: 0)';
        } else {
            this.removeLayerBtn.textContent = '- Remove Layer';
        }
    }
    
    renderLayerControls() {
        this.layerControls.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            if (layer.type === 'input') return; // Skip input layer controls
            
            const controlGroup = document.createElement('div');
            controlGroup.className = 'layer-control-group';
            
            const layerName = layer.type === 'output' ? 'Output Layer' : `Hidden Layer ${index}`;
            
            controlGroup.innerHTML = `
                <label style="flex: 1; font-weight: bold;">${layerName}:</label>
                <label style="width: 60px;">Units:</label>
                <input type="number" min="1" max="10" value="${layer.units}" 
                       onchange="demo.updateLayerUnits(${index}, this.value)" style="width: 60px;">
                <label style="width: 80px;">Activation:</label>
                <select onchange="demo.updateLayerActivation(${index}, this.value)" style="width: 100px;">
                    <option value="linear" ${layer.activation === 'linear' ? 'selected' : ''}>Linear</option>
                    <option value="relu" ${layer.activation === 'relu' ? 'selected' : ''}>ReLU</option>
                    <option value="sigmoid" ${layer.activation === 'sigmoid' ? 'selected' : ''}>Sigmoid</option>
                    <option value="tanh" ${layer.activation === 'tanh' ? 'selected' : ''}>Tanh</option>
                </select>
            `;
            
            this.layerControls.appendChild(controlGroup);
        });
    }
    
    updateLayerUnits(layerIndex, units) {
        const newUnits = Math.max(1, Math.min(10, parseInt(units)));
        this.layers[layerIndex].units = newUnits;
        this.initializeNetwork();
        this.renderNetwork();
        this.updateNetwork();
    }
    
    updateLayerActivation(layerIndex, activation) {
        this.layers[layerIndex].activation = activation;
        this.updateNetwork();
    }
    
    renderNetwork() {
        this.networkContainer.innerHTML = '';
        
        const containerWidth = this.networkContainer.clientWidth - 40;
        const containerHeight = this.networkContainer.clientHeight - 40;
        const layerSpacing = containerHeight / (this.layers.length + 1);
        
        // Store node positions for connection drawing
        this.nodePositions = [];
        
        this.layers.forEach((layer, layerIndex) => {
            const layerPositions = [];
            const maxUnits = Math.max(...this.layers.map(l => l.units));
            const nodeSpacing = containerWidth / (maxUnits + 1);
            const layerStartX = (containerWidth - (layer.units - 1) * nodeSpacing) / 2;
            
            // Create layer label
            const layerLabel = document.createElement('div');
            layerLabel.className = 'network-layer-label';
            layerLabel.style.left = `10px`;
            layerLabel.style.top = `${(layerIndex + 1) * layerSpacing - 10}px`;
            layerLabel.textContent = layer.type.charAt(0).toUpperCase() + layer.type.slice(1);
            this.networkContainer.appendChild(layerLabel);
            
            // Create nodes
            for (let nodeIndex = 0; nodeIndex < layer.units; nodeIndex++) {
                const node = document.createElement('div');
                node.className = `network-node ${layer.type}`;
                
                const x = layerStartX + nodeIndex * nodeSpacing;
                const y = (layerIndex + 1) * layerSpacing - 20;
                
                node.style.left = `${x}px`;
                node.style.top = `${y}px`;
                node.textContent = '0.00'; // Will be updated with actual values
                
                // Add click handler for weight editing
                if (layerIndex > 0) { // Not input layer
                    node.addEventListener('click', () => this.openWeightModal(layerIndex, nodeIndex));
                    
                    // Create pre-activation label for hidden and output layers
                    const preLabel = document.createElement('div');
                    preLabel.className = 'pre-activation-label';
                    preLabel.style.left = `${x + 10}px`;
                    preLabel.style.top = `${y - 25}px`;
                    preLabel.textContent = '0.00';
                    preLabel.id = `pre-${layerIndex}-${nodeIndex}`;
                    this.networkContainer.appendChild(preLabel);
                }
                
                layerPositions.push({ x: x + 20, y: y + 20 }); // Center of node
                this.networkContainer.appendChild(node);
            }
            
            this.nodePositions.push(layerPositions);
        });
        
        // Draw connections
        this.drawConnections();
    }
    
    drawConnections() {
        // Remove existing connections
        document.querySelectorAll('.network-edge').forEach(edge => edge.remove());
        
        for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
            const currentPositions = this.nodePositions[layerIndex];
            const nextPositions = this.nodePositions[layerIndex + 1];
            
            currentPositions.forEach((fromPos, fromIndex) => {
                nextPositions.forEach((toPos, toIndex) => {
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
                    
                    // Color and thickness based on weight magnitude
                    const weight = this.weights[layerIndex][toIndex][fromIndex];
                    const intensity = Math.min(Math.abs(weight), 2) / 2;
                    edge.style.opacity = 0.3 + intensity * 0.7;
                    edge.style.height = `${1 + intensity * 3}px`;
                    edge.style.background = weight >= 0 ? '#4caf50' : '#f44336';
                    
                    edge.dataset.layerIndex = layerIndex;
                    edge.dataset.fromIndex = fromIndex;
                    edge.dataset.toIndex = toIndex;
                    
                    this.networkContainer.appendChild(edge);
                });
            });
        }
    }
    
    updateNetwork() {
        // Get input values
        const inputs = [
            parseFloat(this.input1Slider.value),
            parseFloat(this.input2Slider.value),
            parseFloat(this.input3Slider.value)
        ];
        
        // Forward pass
        this.layerValues = [inputs];
        this.preActivationValues = [inputs]; // Input layer has no pre-activation
        
        for (let i = 0; i < this.layers.length - 1; i++) {
            const currentValues = this.layerValues[i];
            const layerWeights = this.weights[i];
            const layerBiases = this.biases[i];
            const activation = this.layers[i + 1].activation;
            
            const nextPreActivationValues = [];
            const nextValues = [];
            
            for (let j = 0; j < layerWeights.length; j++) {
                let sum = layerBiases[j];
                for (let k = 0; k < currentValues.length; k++) {
                    sum += currentValues[k] * layerWeights[j][k];
                }
                nextPreActivationValues.push(sum);
                nextValues.push(this.applyActivation(sum, activation));
            }
            
            this.preActivationValues.push(nextPreActivationValues);
            this.layerValues.push(nextValues);
        }
        
        this.updateNodeColors();
    }
    
    applyActivation(x, activation) {
        switch (activation) {
            case 'linear':
                return x;
            case 'relu':
                return Math.max(0, x);
            case 'sigmoid':
                return 1 / (1 + Math.exp(-x));
            case 'tanh':
                return Math.tanh(x);
            default:
                return x;
        }
    }
    
    updateNodeColors() {
        const nodes = document.querySelectorAll('.network-node');
        let nodeIndex = 0;
        
        this.layerValues.forEach((values, layerIndex) => {
            values.forEach((value, valueIndex) => {
                const node = nodes[nodeIndex];
                if (node) {
                    // Always show post-activation value in the node
                    node.textContent = value.toFixed(2);
                    
                    // Update pre-activation label if it exists
                    if (layerIndex > 0) {
                        const preLabel = document.getElementById(`pre-${layerIndex}-${valueIndex}`);
                        if (preLabel) {
                            const preValue = this.preActivationValues[layerIndex][valueIndex];
                            preLabel.textContent = preValue.toFixed(2);
                            
                            // Color pre-activation label based on sign
                            if (preValue >= 0) {
                                preLabel.style.color = '#2e7d32'; // Green for positive
                                preLabel.style.background = 'rgba(232, 245, 232, 0.9)';
                            } else {
                                preLabel.style.color = '#d32f2f'; // Red for negative
                                preLabel.style.background = 'rgba(255, 235, 238, 0.9)';
                            }
                        }
                    }
                    
                    // Determine colors based on value sign and magnitude
                    const isPositive = value >= 0;
                    const intensity = Math.min(Math.abs(value), 3) / 3;
                    const alpha = 0.3 + intensity * 0.7;
                    
                    // Base colors for different layer types
                    let baseColor;
                    if (layerIndex === 0) { // Input layer
                        baseColor = isPositive ? [25, 118, 210] : [63, 81, 181]; // Blue shades
                    } else if (layerIndex === this.layers.length - 1) { // Output layer  
                        baseColor = isPositive ? [56, 142, 60] : [76, 175, 80]; // Green shades
                    } else { // Hidden layers
                        baseColor = isPositive ? [123, 31, 162] : [156, 39, 176]; // Purple shades
                    }
                    
                    // Apply background with intensity
                    node.style.background = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
                    
                    // Dynamic text color for readability
                    if (intensity > 0.6) {
                        // High intensity (dark background) - use white text
                        node.style.color = 'white';
                    } else {
                        // Low intensity (light background) - use contrasting text color
                        node.style.color = isPositive ? '#1976d2' : '#d32f2f';
                    }
                    
                    // Add subtle border to distinguish positive/negative
                    node.style.borderColor = isPositive ? '#4caf50' : '#f44336';
                    node.style.borderWidth = '2px';
                }
                nodeIndex++;
            });
        });
    }
    
    
    openWeightModal(layerIndex, nodeIndex) {
        const modal = document.getElementById('weight-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalWeights = document.getElementById('modal-weights');
        
        this.selectedNode = { layerIndex, nodeIndex };
        
        const layerName = this.layers[layerIndex].type === 'output' ? 'Output' : 
                         `Hidden Layer ${layerIndex}`;
        modalTitle.textContent = `Edit Weights - ${layerName} Node ${nodeIndex + 1}`;
        
        // Create weight inputs
        modalWeights.innerHTML = '';
        const weights = this.weights[layerIndex - 1][nodeIndex];
        const bias = this.biases[layerIndex - 1][nodeIndex];
        
        weights.forEach((weight, index) => {
            const inputGroup = document.createElement('div');
            inputGroup.style.marginBottom = '10px';
            inputGroup.innerHTML = `
                <label style="display: inline-block; width: 120px;">
                    From Input ${index + 1}:
                </label>
                <input type="number" class="weight-input" value="${weight.toFixed(3)}" 
                       step="0.01" data-weight-index="${index}">
            `;
            modalWeights.appendChild(inputGroup);
        });
        
        // Add bias input
        const biasGroup = document.createElement('div');
        biasGroup.style.marginBottom = '10px';
        biasGroup.innerHTML = `
            <label style="display: inline-block; width: 120px;">
                Bias:
            </label>
            <input type="number" class="weight-input" value="${bias.toFixed(3)}" 
                   step="0.01" id="bias-input">
        `;
        modalWeights.appendChild(biasGroup);
        
        // Add event listeners to weight inputs
        modalWeights.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('input', () => this.updateWeights());
        });
        
        modal.style.display = 'flex';
    }
    
    updateWeights() {
        if (!this.selectedNode) return;
        
        const { layerIndex, nodeIndex } = this.selectedNode;
        const weightInputs = document.querySelectorAll('.weight-input[data-weight-index]');
        const biasInput = document.getElementById('bias-input');
        
        weightInputs.forEach((input, index) => {
            this.weights[layerIndex - 1][nodeIndex][index] = parseFloat(input.value);
        });
        
        if (biasInput) {
            this.biases[layerIndex - 1][nodeIndex] = parseFloat(biasInput.value);
        }
        
        this.drawConnections();
        this.updateNetwork();
    }
    
    closeWeightModal() {
        document.getElementById('weight-modal').style.display = 'none';
        this.selectedNode = null;
    }
    
    randomizeWeights() {
        if (!this.selectedNode) return;
        
        const { layerIndex, nodeIndex } = this.selectedNode;
        const weightInputs = document.querySelectorAll('.weight-input[data-weight-index]');
        const biasInput = document.getElementById('bias-input');
        
        weightInputs.forEach((input, index) => {
            const newWeight = (Math.random() - 0.5) * 2;
            input.value = newWeight.toFixed(3);
            this.weights[layerIndex - 1][nodeIndex][index] = newWeight;
        });
        
        if (biasInput) {
            const newBias = (Math.random() - 0.5) * 2;
            biasInput.value = newBias.toFixed(3);
            this.biases[layerIndex - 1][nodeIndex] = newBias;
        }
        
        this.drawConnections();
        this.updateNetwork();
    }
}

// Global functions for HTML event handlers
function closeWeightModal() {
    if (window.demo) window.demo.closeWeightModal();
}

function randomizeWeights() {
    if (window.demo) window.demo.randomizeWeights();
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new NeuralNetworkDemo();
});