class RNNDemo {
    constructor() {
        // Get canvas elements
        this.inputCanvas = document.getElementById('input-canvas');
        this.rnnCanvas = document.getElementById('rnn-canvas');
        this.outputCanvas = document.getElementById('output-canvas');

        // Get contexts
        this.inputCtx = this.inputCanvas.getContext('2d');
        this.rnnCtx = this.rnnCanvas.getContext('2d');
        this.outputCtx = this.outputCanvas.getContext('2d');

        // Get control elements
        this.sequenceSelect = document.getElementById('sequence-select');
        this.inputWeightSlider = document.getElementById('input-weight');
        this.hiddenWeightSlider = document.getElementById('hidden-weight');
        this.biasSlider = document.getElementById('bias');
        this.activationSelect = document.getElementById('activation-select');

        // Get buttons
        this.stepBtn = document.getElementById('step-btn');
        this.resetBtn = document.getElementById('reset-btn');

        // Get display elements
        this.inputWeightValue = document.getElementById('input-weight-value');
        this.hiddenWeightValue = document.getElementById('hidden-weight-value');
        this.biasValue = document.getElementById('bias-value');
        this.timestepDisplay = document.getElementById('timestep-display');
        this.hiddenStateDisplay = document.getElementById('hidden-state-display');
        this.outputDisplay = document.getElementById('output-display');

        // Setup high-DPI canvases
        this.setupHighDPICanvas(this.inputCanvas, this.inputCtx);
        this.setupHighDPICanvas(this.rnnCanvas, this.rnnCtx);
        this.setupHighDPICanvas(this.outputCanvas, this.outputCtx);

        // Define sequences
        this.sequences = {
            fibonacci: [1, 1, 2, 3, 5],
            linear: [1, 2, 3, 4, 5],
            alternating: [1, -1, 1, -1, 1],
            exponential: [1, 2, 4, 8, 16],
            sine: [0, 0.5, 1, 0.5, 0]
        };

        // Initialize demo state
        this.reset();

        // Setup event listeners
        this.setupEventListeners();

        // Initial render
        this.updateDisplay();
        this.render();
    }

    setupHighDPICanvas(canvas, ctx) {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = canvas.clientWidth || canvas.width;
        const displayHeight = canvas.clientHeight || canvas.height;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';

        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        return { displayWidth, displayHeight };
    }

    setupEventListeners() {
        // Slider listeners
        this.inputWeightSlider.addEventListener('input', () => {
            this.inputWeightValue.textContent = parseFloat(this.inputWeightSlider.value).toFixed(1);
            this.render();
        });

        this.hiddenWeightSlider.addEventListener('input', () => {
            this.hiddenWeightValue.textContent = parseFloat(this.hiddenWeightSlider.value).toFixed(1);
            this.render();
        });

        this.biasSlider.addEventListener('input', () => {
            this.biasValue.textContent = parseFloat(this.biasSlider.value).toFixed(1);
            this.render();
        });

        // Dropdown listeners
        this.sequenceSelect.addEventListener('change', () => {
            this.reset();
            this.render();
        });

        this.activationSelect.addEventListener('change', () => {
            this.render();
        });

        // Button listeners
        this.stepBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => {
            this.reset();
            this.render();
        });
    }

    reset() {
        this.currentTimestep = 0;
        this.hiddenState = 0;
        this.outputs = [];
        this.hiddenStates = [];

        // Get current sequence
        this.currentSequence = this.sequences[this.sequenceSelect.value];

        // Reset display
        this.updateDisplay();
    }

    step() {
        if (this.currentTimestep < this.currentSequence.length) {
            const input = this.currentSequence[this.currentTimestep];

            // RNN computation: h_t = f(W_input * x_t + W_hidden * h_{t-1} + bias)
            const inputWeight = parseFloat(this.inputWeightSlider.value);
            const hiddenWeight = parseFloat(this.hiddenWeightSlider.value);
            const bias = parseFloat(this.biasSlider.value);

            const preActivation = inputWeight * input + hiddenWeight * this.hiddenState + bias;
            this.hiddenState = this.applyActivation(preActivation);

            // Output is the hidden state
            const output = this.hiddenState;

            this.outputs.push(output);
            this.hiddenStates.push(this.hiddenState);
            this.currentTimestep++;

            this.updateDisplay();
            this.render();
        }
    }

    applyActivation(x) {
        const activation = this.activationSelect.value;
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


    updateDisplay() {
        this.timestepDisplay.textContent = this.currentTimestep;
        this.hiddenStateDisplay.textContent = this.hiddenState.toFixed(3);
        const currentOutput = this.outputs.length > 0 ? this.outputs[this.outputs.length - 1] : 0;
        this.outputDisplay.textContent = currentOutput.toFixed(3);
    }

    render() {
        this.clearCanvases();
        this.drawInputSequence();
        this.drawRNNCell();
        this.drawOutput();
    }

    clearCanvases() {
        const canvases = [this.inputCanvas, this.rnnCanvas, this.outputCanvas];
        const contexts = [this.inputCtx, this.rnnCtx, this.outputCtx];

        contexts.forEach((ctx, i) => {
            ctx.clearRect(0, 0, canvases[i].clientWidth, canvases[i].clientHeight);
        });
    }

    drawInputSequence() {
        const ctx = this.inputCtx;
        const canvas = this.inputCanvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const sequence = this.currentSequence;
        const cellWidth = width / sequence.length;
        const cellHeight = 60;
        const startY = (height - cellHeight) / 2;

        sequence.forEach((value, index) => {
            const x = index * cellWidth + cellWidth * 0.1;
            const y = startY;
            const w = cellWidth * 0.8;
            const h = cellHeight;

            // Highlight current timestep
            if (index === this.currentTimestep && this.currentTimestep < sequence.length) {
                ctx.fillStyle = '#ffd700';
                ctx.strokeStyle = '#ff8c00';
                ctx.lineWidth = 3;
            } else if (index < this.currentTimestep) {
                ctx.fillStyle = '#e3f2fd';
                ctx.strokeStyle = '#1976d2';
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = '#f5f5f5';
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
            }

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Draw value
            ctx.fillStyle = '#333';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), x + w/2, y + h/2);

            // Draw timestep label
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText(`t=${index}`, x + w/2, y + h + 15);
        });

        // Draw arrow for current timestep
        if (this.currentTimestep < sequence.length) {
            const arrowX = this.currentTimestep * cellWidth + cellWidth/2;
            const arrowY = startY - 20;

            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 8, arrowY - 15);
            ctx.lineTo(arrowX + 8, arrowY - 15);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawRNNCell() {
        const ctx = this.rnnCtx;
        const canvas = this.rnnCanvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const centerX = width / 2;
        const centerY = height / 2;

        // RNN cell (rectangle)
        const cellWidth = 120;
        const cellHeight = 80;
        const cellX = centerX - cellWidth/2;
        const cellY = centerY - cellHeight/2;

        ctx.fillStyle = '#f3e5f5';
        ctx.strokeStyle = '#7b1fa2';
        ctx.lineWidth = 3;
        ctx.fillRect(cellX, cellY, cellWidth, cellHeight);
        ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);

        // RNN label and parameters
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RNN', centerX, centerY - 15);

        // Draw bias and activation function inside the cell
        ctx.font = '14px Arial';
        ctx.fillText(`bias = ${this.biasSlider.value}`, centerX, centerY + 5);
        ctx.fillText(`f = ${this.activationSelect.value}`, centerX, centerY + 20);

        // Hidden state node (previous) - moved to left
        const hiddenPrevX = centerX - 150;
        const hiddenPrevY = centerY;
        const nodeRadius = 25;

        ctx.fillStyle = '#fff3e0';
        ctx.strokeStyle = '#f57c00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hiddenPrevX, hiddenPrevY, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('h', hiddenPrevX - 8, hiddenPrevY);
        ctx.font = '10px Arial';
        ctx.fillText('t-1', hiddenPrevX + 8, hiddenPrevY + 8);

        // Previous hidden state value
        const prevHidden = this.hiddenStates.length > 1 ? this.hiddenStates[this.hiddenStates.length - 2] : 0;
        ctx.font = '13px Arial';
        ctx.fillStyle = '#f57c00';
        ctx.fillText(prevHidden.toFixed(2), hiddenPrevX, hiddenPrevY + 35);

        // Input node - moved to bottom
        const inputX = centerX;
        const inputY = centerY + 100;

        ctx.fillStyle = '#e3f2fd';
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(inputX, inputY, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('x', inputX - 6, inputY);
        ctx.font = '11px Arial';
        ctx.fillText('t', inputX + 6, inputY + 6);

        // Current input value
        if (this.currentTimestep > 0 && this.currentTimestep <= this.currentSequence.length) {
            const currentInput = this.currentSequence[this.currentTimestep - 1];
            ctx.font = '13px Arial';
            ctx.fillStyle = '#1976d2';
            ctx.fillText(currentInput.toString(), inputX, inputY + 35);
        }

        // Output node
        const outputX = centerX + 150;
        const outputY = centerY;

        ctx.fillStyle = '#e8f5e8';
        ctx.strokeStyle = '#388e3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(outputX, outputY, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('h', outputX - 6, outputY);
        ctx.font = '11px Arial';
        ctx.fillText('t', outputX + 6, outputY + 6);

        // Current hidden state value
        ctx.font = '13px Arial';
        ctx.fillStyle = '#388e3c';
        ctx.fillText(this.hiddenState.toFixed(2), outputX, outputY + 35);

        // Draw connections with weights
        this.drawConnection(ctx, hiddenPrevX + nodeRadius, hiddenPrevY, cellX, centerY,
                          `W_{h}=${this.hiddenWeightSlider.value}`, '#f57c00',
                          { x: (hiddenPrevX + nodeRadius + cellX) / 2, y: centerY - 15 });

        // Input connection with label positioned to the right
        const inputLabelX = centerX + 25; // Offset to the right of the vertical arrow
        const inputLabelY = (inputY - nodeRadius + cellY + cellHeight) / 2; // Midpoint of the connection
        this.drawConnection(ctx, inputX, inputY - nodeRadius, centerX, cellY + cellHeight,
                          `W_{i}=${this.inputWeightSlider.value}`, '#1976d2',
                          { x: inputLabelX, y: inputLabelY });

        this.drawConnection(ctx, cellX + cellWidth, centerY, outputX - nodeRadius, outputY,
                          '', '#388e3c');
    }

    drawConnection(ctx, x1, y1, x2, y2, label, color, labelOffset = null) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI/6), y2 - arrowSize * Math.sin(angle - Math.PI/6));
        ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI/6), y2 - arrowSize * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Label with mathematical notation
        if (label) {
            let labelX, labelY;

            if (labelOffset) {
                labelX = labelOffset.x;
                labelY = labelOffset.y;
            } else {
                labelX = (x1 + x2) / 2;
                labelY = (y1 + y2) / 2 - 5;
            }

            ctx.fillStyle = color;
            this.drawMathLabel(ctx, label, labelX, labelY);
        }
    }

    drawMathLabel(ctx, label, x, y) {
        // Parse and render mathematical notation
        if (label.includes('W_{h}=')) {
            const value = label.split('=')[1];
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('W', x - 15, y);
            ctx.font = '9px Arial';
            ctx.fillText('h', x - 7, y + 5);
            ctx.font = '12px Arial';
            ctx.fillText('=', x + 2, y);
            ctx.fillText(value, x + 12, y);
        } else if (label.includes('W_{i}=')) {
            const value = label.split('=')[1];
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('W', x - 15, y);
            ctx.font = '9px Arial';
            ctx.fillText('i', x - 7, y + 5);
            ctx.font = '12px Arial';
            ctx.fillText('=', x + 2, y);
            ctx.fillText(value, x + 12, y);
        } else {
            // Fallback for other labels
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y);
        }
    }

    drawOutput() {
        const ctx = this.outputCtx;
        const canvas = this.outputCanvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (this.outputs.length === 0) return;

        const sequence = this.outputs;
        const cellWidth = width / this.currentSequence.length;
        const cellHeight = 60;
        const startY = (height - cellHeight) / 2;

        // Draw output values in boxes similar to input sequence
        this.outputs.forEach((output, index) => {
            const x = index * cellWidth + cellWidth * 0.1;
            const y = startY;
            const w = cellWidth * 0.8;
            const h = cellHeight;

            // Style the output boxes
            ctx.fillStyle = '#e8f5e8';
            ctx.strokeStyle = '#388e3c';
            ctx.lineWidth = 2;

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Draw output value
            ctx.fillStyle = '#333';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(output.toFixed(2), x + w/2, y + h/2);

            // Draw timestep label
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText(`t=${index}`, x + w/2, y + h + 15);
        });

        // Draw remaining empty boxes for future timesteps
        for (let index = this.outputs.length; index < this.currentSequence.length; index++) {
            const x = index * cellWidth + cellWidth * 0.1;
            const y = startY;
            const w = cellWidth * 0.8;
            const h = cellHeight;

            ctx.fillStyle = '#f5f5f5';
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Draw timestep label
            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText(`t=${index}`, x + w/2, y + h + 15);
        }
    }
}