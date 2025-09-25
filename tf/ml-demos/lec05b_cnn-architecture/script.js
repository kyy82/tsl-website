class CNNMnistDemo {
    constructor() {
        // Canvas elements
        this.inputCanvas = document.getElementById('input-canvas');
        this.architectureCanvas = document.getElementById('architecture-canvas');
        this.conv1Canvas = document.getElementById('conv1-canvas');
        this.pool1Canvas = document.getElementById('pool1-canvas');
        this.conv2Canvas = document.getElementById('conv2-canvas');
        this.pool2Canvas = document.getElementById('pool2-canvas');
        this.fc1Canvas = document.getElementById('fc1-canvas');

        // Contexts
        this.inputCtx = this.inputCanvas.getContext('2d');
        this.archCtx = this.architectureCanvas.getContext('2d');
        this.conv1Ctx = this.conv1Canvas.getContext('2d');
        this.pool1Ctx = this.pool1Canvas.getContext('2d');
        this.conv2Ctx = this.conv2Canvas.getContext('2d');
        this.pool2Ctx = this.pool2Canvas.getContext('2d');
        this.fc1Ctx = this.fc1Canvas.getContext('2d');

        // Controls
        this.digitButtons = document.querySelectorAll('.digit-btn');
        this.drawBtn = document.getElementById('draw-btn');
        this.trainBtn = document.getElementById('train-btn');
        this.resetTrainingBtn = document.getElementById('reset-training-btn');

        // Display elements
        this.predictedDigit = document.getElementById('predicted-digit');
        this.currentEpoch = document.getElementById('current-epoch');
        this.currentLoss = document.getElementById('current-loss');
        this.currentAccuracy = document.getElementById('current-accuracy');

        // Data
        this.currentImage = null;
        this.currentPrediction = null;
        this.selectedDigit = null;
        this.isDrawing = false;
        this.isTraining = false;
        this.pretrainedData = null;
        this.currentEpochIndex = 0;

        // Feature maps from current epoch
        this.currentFeatureMaps = {};

        // Training animation
        this.trainingInterval = null;

        // CNN Inference engine
        this.cnnInference = new CNNInference();

        this.setupCanvas();
        this.setupEventListeners();
        this.loadPretrainedData();
    }

    async loadPretrainedData() {
        try {
            console.log('Loading pre-trained data...');
            const response = await fetch('./data/pretrained_cnn_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.pretrainedData = await response.json();
            console.log('Pre-trained data loaded successfully');
            console.log(`Available epochs: ${this.pretrainedData.training_epochs.length}`);
            console.log(`Sample images: ${this.pretrainedData.samples.length}`);

            // Initialize with epoch 0 (random weights)
            this.currentEpochIndex = 0;
            this.maxEpochIndex = this.pretrainedData.training_epochs.length - 1;
            this.updateDisplayFromEpoch();
            this.populateDigitSelector();
            this.drawArchitecture();
            this.drawInitialImage();

        } catch (error) {
            console.error('Failed to load pre-trained data:', error);
            // Show error message to user
            document.body.innerHTML += `
                <div style="position: fixed; top: 10px; left: 10px; background: #ff6b6b; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
                    Error: Could not load pre-trained model data. Please ensure the data file exists.
                </div>
            `;
        }
    }

    updateDisplayFromEpoch() {
        if (!this.pretrainedData || !this.pretrainedData.training_epochs[this.currentEpochIndex]) {
            return;
        }

        const epochData = this.pretrainedData.training_epochs[this.currentEpochIndex];
        this.currentFeatureMaps = epochData.feature_maps || {};

        // Update displays
        this.currentEpoch.textContent = epochData.epoch;
        this.currentLoss.textContent = epochData.epoch === 0 ? 'N/A' : epochData.loss.toFixed(4);
        this.currentAccuracy.textContent = `${epochData.test_accuracy.toFixed(1)}%`;

        this.drawFeatureMaps();
        this.updateTrainButtonText();
    }

    populateDigitSelector() {
        // Group samples by digit for easier access (used by numpad)
        if (!this.pretrainedData) return;

        this.samplesByDigit = {};
        this.pretrainedData.samples.forEach((sample, index) => {
            if (!this.samplesByDigit[sample.label]) {
                this.samplesByDigit[sample.label] = [];
            }
            this.samplesByDigit[sample.label].push({...sample, index});
        });
    }

    setupCanvas() {
        // Set up high-DPI canvas
        const canvases = [
            this.inputCanvas, this.architectureCanvas, this.conv1Canvas,
            this.pool1Canvas, this.conv2Canvas, this.pool2Canvas, this.fc1Canvas
        ];

        canvases.forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });

        // Drawing setup for input canvas
        this.inputCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.inputCanvas.addEventListener('mousemove', this.draw.bind(this));
        this.inputCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.inputCanvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events for mobile
        this.inputCanvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.inputCanvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.inputCanvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    setupEventListeners() {
        // Add event listeners for numpad buttons
        this.digitButtons.forEach(button => {
            button.addEventListener('click', () => {
                const digit = parseInt(button.dataset.digit);
                this.selectDigit(digit);
            });
        });

        this.drawBtn.addEventListener('click', this.enableDrawing.bind(this));
        this.trainBtn.addEventListener('click', this.trainOneEpoch.bind(this));
        this.resetTrainingBtn.addEventListener('click', this.resetTraining.bind(this));
    }

    selectDigit(digit) {
        console.log(`Selected digit: ${digit}`);
        if (!this.pretrainedData) return;

        // Find a random sample of the selected digit
        const digitSamples = this.pretrainedData.samples.filter(sample => sample.label === digit);
        if (digitSamples.length === 0) return;

        const randomSample = digitSamples[Math.floor(Math.random() * digitSamples.length)];
        console.log(`Using sample with ${randomSample.image.length} pixels`);

        this.selectedDigit = digit;
        this.currentImage = randomSample.image;
        this.drawImageOnCanvas(randomSample.image);
        this.runAutomaticPrediction();

        // Update button styling
        this.updateDigitButtonStyling(digit);
    }

    updateDigitButtonStyling(selectedDigit) {
        this.digitButtons.forEach(button => {
            const digit = parseInt(button.dataset.digit);
            if (digit === selectedDigit) {
                button.style.background = '#1976d2';
                button.style.color = 'white';
                button.style.borderColor = '#1976d2';
            } else {
                button.style.background = 'white';
                button.style.color = 'black';
                button.style.borderColor = '#ddd';
            }
        });
    }


    drawImageOnCanvas(imageData) {
        const canvas = this.inputCanvas;
        const ctx = this.inputCtx;
        const rect = canvas.getBoundingClientRect();

        ctx.clearRect(0, 0, rect.width, rect.height);

        if (!imageData) return;

        // Handle both 1D and 2D array formats
        const getPixelValue = (row, col) => {
            if (Array.isArray(imageData[0])) {
                // 2D array format
                return imageData[row] && imageData[row][col] !== undefined ? imageData[row][col] : 0;
            } else {
                // 1D array format
                return imageData[row * 28 + col] !== undefined ? imageData[row * 28 + col] : 0;
            }
        };

        const cellWidth = rect.width / 28;
        const cellHeight = rect.height / 28;

        for (let row = 0; row < 28; row++) {
            for (let col = 0; col < 28; col++) {
                const value = getPixelValue(row, col);
                const gray = Math.round(255 - value); // Invert for display

                ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    enableDrawing() {
        // Clear canvas and enable drawing mode
        const rect = this.inputCanvas.getBoundingClientRect();
        this.inputCtx.clearRect(0, 0, rect.width, rect.height);
        this.inputCtx.fillStyle = 'white';
        this.inputCtx.fillRect(0, 0, rect.width, rect.height);

        // Create empty 28x28 array
        this.currentImage = Array(28).fill().map(() => Array(28).fill(0));

        // Clear prediction
        this.currentPrediction = null;
        this.predictedDigit.textContent = '-';
        this.clearFeatureMaps();
    }

    startDrawing(e) {
        if (!this.currentImage || !Array.isArray(this.currentImage)) return;
        this.isDrawing = true;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing || !this.currentImage) return;

        const rect = this.inputCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to 28x28 coordinates
        const col = Math.floor((x / rect.width) * 28);
        const row = Math.floor((y / rect.height) * 28);

        if (row >= 0 && row < 28 && col >= 0 && col < 28) {
            // Draw a small brush (3x3)
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < 28 && nc >= 0 && nc < 28) {
                        const distance = Math.sqrt(dr * dr + dc * dc);
                        const intensity = Math.max(0, 255 * (1 - distance / 2));
                        this.currentImage[nr][nc] = Math.min(255, this.currentImage[nr][nc] + intensity);
                    }
                }
            }

            this.drawImageOnCanvas(this.currentImage);
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        // Trigger prediction for drawn image
        if (this.currentImage && Array.isArray(this.currentImage)) {
            this.runAutomaticPrediction();
        }
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.inputCanvas.dispatchEvent(mouseEvent);
    }


    trainOneEpoch() {
        if (!this.pretrainedData) return;

        // Advance to next epoch if possible
        if (this.currentEpochIndex < this.maxEpochIndex) {
            this.currentEpochIndex++;
            this.updateDisplayFromEpoch();
            this.runAutomaticPrediction();
        }

        // Update button text based on current state
        this.updateTrainButtonText();
    }

    updateTrainButtonText() {
        if (this.currentEpochIndex >= this.maxEpochIndex) {
            this.trainBtn.textContent = 'Training Complete';
            this.trainBtn.disabled = true;
        } else {
            this.trainBtn.textContent = 'Train Epoch';
            this.trainBtn.disabled = false;
        }
    }

    resetTraining() {
        this.currentEpochIndex = 0;
        this.updateDisplayFromEpoch();
        this.updateTrainButtonText();
        this.runAutomaticPrediction();
    }

    async getFeatureMapsFromFrontend() {
        if (!this.currentImage) return;

        console.log(`Running frontend CNN inference: epoch=${this.currentEpochIndex}, image_size=${this.currentImage.length}`);

        try {
            // Use JavaScript CNN inference
            const result = this.cnnInference.predict(this.currentImage, this.currentEpochIndex, this.pretrainedData);

            // Convert activations to the format expected by visualization code
            this.currentFeatureMaps = {
                'conv1': result.activations.conv1,
                'pool1': result.activations.pool1,
                'conv2': result.activations.conv2,
                'pool2': result.activations.pool2,
                'fc1': result.activations.fc1
            };

            // Update prediction results
            this.currentPrediction = {
                predicted_class: result.prediction,
                confidence: Math.max(...result.probabilities),
                probabilities: result.probabilities
            };

            // Update display
            this.predictedDigit.textContent = result.prediction;

            console.log(`Prediction: ${result.prediction}, Confidence: ${(Math.max(...result.probabilities) * 100).toFixed(1)}%`);

        } catch (error) {
            console.error('Failed to run frontend CNN inference:', error);
            // Fallback to using pre-stored feature maps if inference fails
            const currentEpoch = this.pretrainedData.training_epochs[this.currentEpochIndex];
            this.currentFeatureMaps = currentEpoch.feature_maps || {};
        }
    }

    async runAutomaticPrediction() {
        if (!this.currentImage || !this.pretrainedData) return;

        // Get feature maps from frontend CNN inference (this also updates predictions)
        await this.getFeatureMapsFromFrontend();

        // Draw feature maps
        this.drawFeatureMaps();
    }


    drawArchitecture() {
        const canvas = this.architectureCanvas;
        const ctx = this.archCtx;
        const rect = canvas.getBoundingClientRect();

        ctx.clearRect(0, 0, rect.width, rect.height);

        // Dynamic spacing to fit canvas width
        const baseY = rect.height / 2;
        const numLayers = 8;
        const marginLeft = 30;
        const marginRight = 30;
        const availableWidth = rect.width - marginLeft - marginRight;
        const spacing = availableWidth / (numLayers - 1); // Distribute evenly across width

        // Layer definitions with visual representations
        const layers = [
            {
                name: 'Input',
                shape: [1, 28, 28],
                color: '#e3f2fd',
                operation: 'Image'
            },
            {
                name: 'Conv1',
                shape: [4, 26, 26],
                color: '#bbdefb',
                operation: '3×3 conv'
            },
            {
                name: 'Pool1',
                shape: [4, 13, 13],
                color: '#90caf9',
                operation: '2×2 pool'
            },
            {
                name: 'Conv2',
                shape: [8, 11, 11],
                color: '#64b5f6',
                operation: '3×3 conv'
            },
            {
                name: 'Pool2',
                shape: [8, 5, 5],
                color: '#42a5f5',
                operation: '2×2 pool'
            },
            {
                name: 'Flatten',
                shape: [200],
                color: '#2196f3',
                operation: '200'
            },
            {
                name: 'FC1',
                shape: [128],
                color: '#1e88e5',
                operation: '128'
            },
            {
                name: 'Output',
                shape: [10],
                color: '#1976d2',
                operation: '10'
            }
        ];

        layers.forEach((layer, i) => {
            const x = marginLeft + i * spacing;

            if (layer.shape.length === 3) {
                // 3D tensor - draw exact number of rectangles for channels
                const [channels, height, width] = layer.shape;

                // Make rectangles proportional to their actual size relative to input (28x28)
                const scale = 0.8; // Overall scaling factor
                const rectWidth = Math.max(12, (width / 28) * 28 * scale);
                const rectHeight = Math.max(12, (height / 28) * 28 * scale);

                // Show all channels for small numbers, sample for large numbers
                const channelsToShow = channels <= 8 ? channels : 8;
                const offset = Math.max(1, rectWidth * 0.08); // Offset proportional to rectangle size

                for (let j = 0; j < channelsToShow; j++) {
                    const rectOffset = j * offset;
                    ctx.fillStyle = layer.color;
                    ctx.fillRect(x - rectWidth/2 + rectOffset, baseY - rectHeight/2 + rectOffset, rectWidth, rectHeight);
                    ctx.strokeStyle = '#1976d2';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x - rectWidth/2 + rectOffset, baseY - rectHeight/2 + rectOffset, rectWidth, rectHeight);
                }

                // If we couldn't show all channels, add "..." indicator
                if (channels > 8) {
                    ctx.fillStyle = '#424242';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('...', x + channelsToShow * offset + 8, baseY);
                }

                // Labels
                ctx.fillStyle = '#1976d2';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(layer.name, x, baseY - 35);

                ctx.fillStyle = '#424242';
                ctx.font = '12px Arial';
                ctx.fillText(`${channels}×${height}×${width}`, x, baseY + 25);
                ctx.fillText(layer.operation, x, baseY + 35);

            } else {
                // 1D tensor - draw as vertical bar
                const features = layer.shape[0];
                const barWidth = 16;
                const barHeight = Math.min(50, features * 0.25);

                ctx.fillStyle = layer.color;
                ctx.fillRect(x - barWidth/2, baseY - barHeight/2, barWidth, barHeight);
                ctx.strokeStyle = '#1976d2';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - barWidth/2, baseY - barHeight/2, barWidth, barHeight);

                // Labels
                ctx.fillStyle = '#1976d2';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(layer.name, x, baseY - 35);

                ctx.fillStyle = '#424242';
                ctx.font = '12px Arial';
                ctx.fillText(layer.operation, x, baseY + 35);
            }

            // Dynamic arrows between layers
            if (i < layers.length - 1) {
                const nextX = marginLeft + (i + 1) * spacing;
                const arrowY = baseY;

                // Adjust arrow length based on spacing
                const arrowPadding = Math.max(8, Math.min(20, spacing * 0.15));
                const startX = x + arrowPadding;
                const endX = nextX - arrowPadding;
                const arrowheadSize = Math.max(2, spacing * 0.03);

                if (endX > startX + 5) { // Only draw if there's space
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(startX, arrowY);
                    ctx.lineTo(endX - arrowheadSize, arrowY);
                    ctx.stroke();

                    // Dynamic arrowhead
                    ctx.beginPath();
                    ctx.moveTo(endX - arrowheadSize, arrowY - arrowheadSize/2);
                    ctx.lineTo(endX, arrowY);
                    ctx.lineTo(endX - arrowheadSize, arrowY + arrowheadSize/2);
                    ctx.closePath();
                    ctx.fillStyle = '#666';
                    ctx.fill();
                }
            }
        });

        // Compact title
        ctx.fillStyle = '#1976d2';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CNN Architecture', rect.width/2, 18);
    }


    drawFeatureMaps() {
        if (!this.currentFeatureMaps) {
            this.clearFeatureMaps();
            return;
        }

        // Draw all feature maps in organized layout
        // Row 1: Conv1 (2x2 grid) + Pool1 (2x2 grid)
        // Row 2: Conv2 (3x3 grid) + Pool2 (3x3 grid)

        this.drawLayerFeatureMap('conv1', this.conv1Canvas, this.conv1Ctx, 2, 2); // 4 channels in 2x2
        this.drawLayerFeatureMap('pool1', this.pool1Canvas, this.pool1Ctx, 2, 2); // 4 channels in 2x2
        this.drawLayerFeatureMap('conv2', this.conv2Canvas, this.conv2Ctx, 3, 3); // 8 channels in 3x3 (1 empty)
        this.drawLayerFeatureMap('pool2', this.pool2Canvas, this.pool2Ctx, 3, 3); // 8 channels in 3x3 (1 empty)

        // Draw FC1 and output visualizations
        this.drawFC1Visualization();
        this.drawOutputProbabilities();
    }

    drawLayerFeatureMap(layerName, canvas, ctx, gridRows, gridCols) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        const featureMap = this.currentFeatureMaps[layerName];
        if (!featureMap || featureMap.length === 0) {
            // Draw empty grid structure
            this.drawEmptyGrid(ctx, rect, gridRows, gridCols, layerName);
            return;
        }

        const cellWidth = rect.width / gridCols;
        const cellHeight = rect.height / gridRows;
        const padding = 4;

        // Draw title
        ctx.fillStyle = '#1976d2';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(layerName.toUpperCase(), rect.width / 2, 15);

        // Draw each channel in grid
        featureMap.slice(0, gridRows * gridCols).forEach((channel, i) => {
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            const x = col * cellWidth + padding;
            const y = row * cellHeight + padding + 20; // Leave space for title
            const width = cellWidth - padding * 2;
            const height = cellHeight - padding * 2 - 20;

            this.drawSingleFeatureMap(ctx, channel, x, y, width, height);
        });
    }

    drawSingleFeatureMap(ctx, channel, x, y, width, height) {
        if (!channel || channel.length === 0) return;

        const mapSize = channel.length;
        const cellWidth = width / mapSize;
        const cellHeight = height / mapSize;

        // Find min/max for normalization
        const flatChannel = channel.flat();
        const minVal = Math.min(...flatChannel);
        const maxVal = Math.max(...flatChannel);
        const range = maxVal - minVal || 1;

        for (let i = 0; i < mapSize; i++) {
            for (let j = 0; j < mapSize; j++) {
                const value = channel[i][j];
                const normalized = (value - minVal) / range;
                const intensity = Math.round(normalized * 255);

                ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                ctx.fillRect(x + j * cellWidth, y + i * cellHeight, cellWidth, cellHeight);
            }
        }
    }


    drawEmptyGrid(ctx, rect, rows, cols, layerName) {
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Draw title
        ctx.fillStyle = '#1976d2';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(layerName.toUpperCase(), rect.width / 2, 15);

        // Draw empty grid structure
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        const cellWidth = rect.width / cols;
        const cellHeight = (rect.height - 20) / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellWidth + 4;
                const y = row * cellHeight + 24;
                const width = cellWidth - 8;
                const height = cellHeight - 8;

                ctx.strokeRect(x, y, width, height);
            }
        }
    }

    drawFC1Visualization() {
        const canvas = this.fc1Canvas;
        const ctx = this.fc1Ctx;
        const rect = canvas.getBoundingClientRect();

        ctx.clearRect(0, 0, rect.width, rect.height);

        const featureMap = this.currentFeatureMaps['fc1'];
        if (!featureMap || featureMap.length === 0) {
            // Draw empty state similar to other feature maps
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, rect.width, rect.height);

            // Draw title
            ctx.fillStyle = '#1976d2';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('FC1', rect.width / 2, 15);
            return;
        }

        // FC1 is a 1D array of 128 values
        const fc1Values = featureMap;

        // Find min/max for normalization
        const minVal = Math.min(...fc1Values);
        const maxVal = Math.max(...fc1Values);
        const range = maxVal - minVal || 1;

        // Draw title
        ctx.fillStyle = '#1976d2';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FC1', rect.width / 2, 15);

        // Calculate visualization area (leave space for title)
        const startY = 20;
        const availableHeight = rect.height - 25;
        const cellHeight = availableHeight / 128;

        // Draw each FC1 unit as a horizontal strip
        for (let i = 0; i < 128; i++) {
            const normalizedValue = (fc1Values[i] - minVal) / range;

            // Greyscale mapping: 0 (black) to 255 (white)
            const greyValue = Math.floor(normalizedValue * 255);

            ctx.fillStyle = `rgb(${greyValue}, ${greyValue}, ${greyValue})`;
            ctx.fillRect(2, startY + i * cellHeight, rect.width - 4, cellHeight);
        }
    }

    drawOutputProbabilities() {
        // Only use real probabilities from backend - no simulation
        if (!this.currentPrediction || !this.currentPrediction.probabilities) {
            // If no backend probabilities available, don't display anything
            return;
        }

        const probabilities = this.currentPrediction.probabilities;

        // Update probability displays
        for (let i = 0; i < 10; i++) {
            const probElement = document.getElementById(`prob-${i}`);
            if (probElement) {
                probElement.textContent = probabilities[i].toFixed(2);

                // Highlight the highest probability
                const maxProb = Math.max(...probabilities);
                if (probabilities[i] === maxProb) {
                    probElement.style.fontWeight = 'bold';
                    probElement.style.color = '#1976d2';
                } else {
                    probElement.style.fontWeight = 'normal';
                    probElement.style.color = '#000';
                }
            }
        }
    }

    clearFeatureMaps() {
        [this.conv1Ctx, this.pool1Ctx, this.conv2Ctx, this.pool2Ctx, this.fc1Ctx].forEach(ctx => {
            const canvas = ctx.canvas;
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
        });
    }

    drawInitialImage() {
        if (this.pretrainedData && this.pretrainedData.samples.length > 0) {
            // Show first sample by default
            const firstSample = this.pretrainedData.samples[0];
            this.currentImage = firstSample.image;
            this.drawImageOnCanvas(firstSample.image);
            this.selectedDigit = 0;
            this.runAutomaticPrediction();
        }
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CNNMnistDemo();
});