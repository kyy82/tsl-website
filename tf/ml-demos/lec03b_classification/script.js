class ClassificationDemo {
    constructor() {
        this.canvas = document.getElementById('plot');
        this.ctx = this.canvas.getContext('2d');
        this.alphaSlider = document.getElementById('alpha');
        this.betaSlider = document.getElementById('beta');
        this.alphaValue = document.getElementById('alpha-value');
        this.betaValue = document.getElementById('beta-value');
        this.equation = document.getElementById('equation');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.lossDisplay = document.getElementById('loss');
        this.sigmoidToggle = document.getElementById('sigmoid-toggle');
        this.solutionBtn = document.getElementById('solution-btn');
        this.generateDataBtn = document.getElementById('generate-data-btn');
        this.clearDataBtn = document.getElementById('clear-data-btn');
        
        // Setup high-DPI canvas
        this.setupHighDPICanvas();
        
        // Plot dimensions and scaling (use display dimensions, not canvas dimensions)
        this.plotWidth = this.displayWidth - 80;
        this.plotHeight = this.displayHeight - 80;
        this.plotX = 40;
        this.plotY = 40;
        
        // Data range
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -0.5;
        this.yMax = 1.5;
        
        // No longer need to track next class since it's based on click position
        
        // Generate sample data points
        this.generateDataPoints();
        
        // Initialize
        this.setupEventListeners();
        
        // Wait for MathJax to be ready before initial render
        this.initializeDisplay();
    }
    
    generateDataPoints() {
        this.dataPoints = [];
        const separationPoint = (Math.random() - 0.5) * 8; // Random separation between -4 and 4
        const noise = 1.5;
        
        // Generate points for class 0 (left side)
        for (let i = 0; i < 8; i++) {
            const x = separationPoint + (Math.random() - 0.8) * 4 + (Math.random() - 0.5) * noise;
            this.dataPoints.push({ x, y: 0 });
        }
        
        // Generate points for class 1 (right side)  
        for (let i = 0; i < 8; i++) {
            const x = separationPoint + (Math.random() + 0.2) * 4 + (Math.random() - 0.5) * noise;
            this.dataPoints.push({ x, y: 1 });
        }
    }
    
    setupHighDPICanvas() {
        // Get device pixel ratio for high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        
        // Get the display size (CSS size)
        const displayWidth = this.canvas.clientWidth || 600;
        const displayHeight = this.canvas.clientHeight || 400;
        
        // Set the actual size in memory (scaled up for high-DPI)
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        
        // Scale the canvas back down using CSS
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Scale the drawing context so everything draws at the correct size
        this.ctx.scale(dpr, dpr);
        
        // Enable better rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Store the scaling factor for later use
        this.dpr = dpr;
        this.displayWidth = displayWidth;
        this.displayHeight = displayHeight;
    }
    
    initializeDisplay() {
        // Always draw the plot first, regardless of MathJax status
        this.draw();
        
        // Initialize display values immediately with plain text
        this.updateDisplayPlainText();
        
        // Then enhance with MathJax when ready (non-blocking)
        if (window.MathJax) {
            if (MathJax.startup && MathJax.startup.promise) {
                MathJax.startup.promise.then(() => {
                    this.updateDisplay();
                }).catch(() => {
                    // MathJax failed, but we already have plain text fallback
                    console.warn('MathJax failed to load, using plain text equations');
                });
            } else {
                // MathJax is available but not fully initialized yet
                setTimeout(() => {
                    this.updateDisplay();
                }, 100);
            }
        }
    }
    
    updateDisplayPlainText() {
        const alpha = parseFloat(this.alphaSlider.value);
        const beta = parseFloat(this.betaSlider.value);
        const useSigmoid = this.sigmoidToggle.checked;
        
        this.alphaValue.textContent = alpha.toFixed(1);
        this.betaValue.textContent = beta.toFixed(1);
        
        // Fallback to plain text if MathJax is not available
        const betaSign = beta >= 0 ? '+' : '-';
        const functionName = useSigmoid ? 'σ(x)' : 'f(x)';
        this.equation.textContent = `${functionName} = ${useSigmoid ? 'σ(' : ''}${alpha.toFixed(1)}x ${betaSign} ${Math.abs(beta).toFixed(1)}${useSigmoid ? ')' : ''}`;
        
        const accuracy = this.calculateAccuracy(alpha, beta, useSigmoid);
        const loss = this.calculateLoss(alpha, beta, useSigmoid);
        this.accuracyDisplay.textContent = `Accuracy = ${(accuracy * 100).toFixed(1)}%`;
        this.lossDisplay.textContent = `Loss = ${loss.toFixed(3)}`;
    }
    
    setupEventListeners() {
        this.alphaSlider.addEventListener('input', () => {
            this.updateDisplay();
            this.draw();
        });
        
        this.betaSlider.addEventListener('input', () => {
            this.updateDisplay();
            this.draw();
        });
        
        this.sigmoidToggle.addEventListener('change', () => {
            this.updateDisplay();
            this.draw();
        });
        
        this.solutionBtn.addEventListener('click', () => {
            this.setOptimalValues();
        });
        
        this.generateDataBtn.addEventListener('click', () => {
            this.generateNewData();
        });
        
        this.clearDataBtn.addEventListener('click', () => {
            this.clearAllData();
        });
        
        this.canvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });
    }
    
    updateDisplay() {
        const alpha = parseFloat(this.alphaSlider.value);
        const beta = parseFloat(this.betaSlider.value);
        const useSigmoid = this.sigmoidToggle.checked;
        
        this.alphaValue.textContent = alpha.toFixed(1);
        this.betaValue.textContent = beta.toFixed(1);
        
        // Update equation display using LaTeX
        const betaSign = beta >= 0 ? '+' : '-';
        const betaValue = Math.abs(beta).toFixed(1);
        const linearPart = `${alpha.toFixed(1)}x ${betaSign} ${betaValue}`;
        
        if (useSigmoid) {
            this.equation.innerHTML = `$$f(x) = \\sigma(${linearPart})$$`;
        } else {
            this.equation.innerHTML = `$$f(x) = ${linearPart}$$`;
        }
        
        // Re-render MathJax for the equation
        if (window.MathJax) {
            MathJax.typesetPromise([this.equation]).catch((err) => console.log(err));
        }
        
        // Calculate and display accuracy and loss
        const accuracy = this.calculateAccuracy(alpha, beta, useSigmoid);
        const loss = this.calculateLoss(alpha, beta, useSigmoid);
        this.accuracyDisplay.innerHTML = `$$\\text{Accuracy} = ${(accuracy * 100).toFixed(1)}\\%$$`;
        this.lossDisplay.innerHTML = `$$\\text{Loss} = ${loss.toFixed(3)}$$`;
        
        // Re-render MathJax for accuracy and loss
        if (window.MathJax) {
            MathJax.typesetPromise([this.accuracyDisplay, this.lossDisplay]).catch((err) => console.log(err));
        }
    }
    
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    predict(x, alpha, beta, useSigmoid) {
        const linear = alpha * x + beta;
        return useSigmoid ? this.sigmoid(linear) : linear;
    }
    
    classify(x, alpha, beta, useSigmoid) {
        const prediction = this.predict(x, alpha, beta, useSigmoid);
        return useSigmoid ? (prediction > 0.5 ? 1 : 0) : (prediction > 0 ? 1 : 0);
    }
    
    // Convert data coordinates to canvas coordinates
    dataToCanvas(x, y) {
        const canvasX = this.plotX + ((x - this.xMin) / (this.xMax - this.xMin)) * this.plotWidth;
        const canvasY = this.plotY + this.plotHeight - ((y - this.yMin) / (this.yMax - this.yMin)) * this.plotHeight;
        return { x: canvasX, y: canvasY };
    }
    
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotX, this.plotY + this.plotHeight);
        this.ctx.lineTo(this.plotX + this.plotWidth, this.plotY + this.plotHeight);
        this.ctx.stroke();
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotX, this.plotY);
        this.ctx.lineTo(this.plotX, this.plotY + this.plotHeight);
        this.ctx.stroke();
        
        // Draw grid and labels
        this.drawGrid();
        this.drawLabels();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = this.xMin; x <= this.xMax; x += 2) {
            const canvasPos = this.dataToCanvas(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasPos.x, this.plotY);
            this.ctx.lineTo(canvasPos.x, this.plotY + this.plotHeight);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines (at 0, 0.5, 1)
        for (let y = 0; y <= 1; y += 0.5) {
            const canvasPos = this.dataToCanvas(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.plotX, canvasPos.y);
            this.ctx.lineTo(this.plotX + this.plotWidth, canvasPos.y);
            this.ctx.stroke();
        }
    }
    
    drawLabels() {
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        // X-axis labels
        for (let x = this.xMin; x <= this.xMax; x += 2) {
            const canvasPos = this.dataToCanvas(x, 0);
            this.ctx.fillText(x.toString(), canvasPos.x, this.plotY + this.plotHeight + 20);
        }
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        for (let y = 0; y <= 1; y += 0.5) {
            const canvasPos = this.dataToCanvas(0, y);
            this.ctx.fillText(y.toString(), this.plotX - 10, canvasPos.y + 4);
        }
        
        // Axis titles
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('X', this.plotX + this.plotWidth / 2, this.displayHeight - 10);
        
        this.ctx.save();
        this.ctx.translate(15, this.plotY + this.plotHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Class', 0, 0);
        this.ctx.restore();
    }
    
    drawDataPoints() {
        this.dataPoints.forEach(point => {
            const canvasPos = this.dataToCanvas(point.x, point.y);
            
            if (point.y === 0) {
                // Class 0 - red circles
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.strokeStyle = '#d63447';
            } else {
                // Class 1 - blue squares
                this.ctx.fillStyle = '#4ecdc4';
                this.ctx.strokeStyle = '#26a69a';
            }
            
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            if (point.y === 0) {
                // Draw circle for class 0
                this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, 2 * Math.PI);
            } else {
                // Draw square for class 1
                this.ctx.rect(canvasPos.x - 5, canvasPos.y - 5, 10, 10);
            }
            
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
    
    drawDecisionBoundary() {
        const alpha = parseFloat(this.alphaSlider.value);
        const beta = parseFloat(this.betaSlider.value);
        const useSigmoid = this.sigmoidToggle.checked;
        
        if (useSigmoid) {
            // Draw sigmoid curve
            this.ctx.strokeStyle = '#4ecdc4';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            let first = true;
            for (let x = this.xMin; x <= this.xMax; x += 0.1) {
                const y = this.predict(x, alpha, beta, true);
                const canvasPos = this.dataToCanvas(x, y);
                
                if (first) {
                    this.ctx.moveTo(canvasPos.x, canvasPos.y);
                    first = false;
                } else {
                    this.ctx.lineTo(canvasPos.x, canvasPos.y);
                }
            }
            this.ctx.stroke();
            
            // Draw decision threshold line at y = 0.5
            this.ctx.strokeStyle = '#ff9800';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            const thresholdStart = this.dataToCanvas(this.xMin, 0.5);
            const thresholdEnd = this.dataToCanvas(this.xMax, 0.5);
            this.ctx.beginPath();
            this.ctx.moveTo(thresholdStart.x, thresholdStart.y);
            this.ctx.lineTo(thresholdEnd.x, thresholdEnd.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        } else {
            // Draw linear regression line
            this.ctx.strokeStyle = '#4ecdc4';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            // Calculate line endpoints
            const x1 = this.xMin;
            const y1 = alpha * x1 + beta;
            const x2 = this.xMax;
            const y2 = alpha * x2 + beta;
            
            const start = this.dataToCanvas(x1, y1);
            const end = this.dataToCanvas(x2, y2);
            
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            // Draw decision threshold line at y = 0
            this.ctx.strokeStyle = '#ff9800';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            const thresholdStart = this.dataToCanvas(this.xMin, 0);
            const thresholdEnd = this.dataToCanvas(this.xMax, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(thresholdStart.x, thresholdStart.y);
            this.ctx.lineTo(thresholdEnd.x, thresholdEnd.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    calculateAccuracy(alpha, beta, useSigmoid) {
        if (this.dataPoints.length === 0) return 0;
        
        let correct = 0;
        this.dataPoints.forEach(point => {
            const predicted = this.classify(point.x, alpha, beta, useSigmoid);
            if (predicted === point.y) correct++;
        });
        
        return correct / this.dataPoints.length;
    }
    
    calculateLoss(alpha, beta, useSigmoid) {
        if (this.dataPoints.length === 0) return 0;
        
        let totalLoss = 0;
        this.dataPoints.forEach(point => {
            const prediction = this.predict(point.x, alpha, beta, useSigmoid);
            if (useSigmoid) {
                // Cross-entropy loss
                const epsilon = 1e-15; // Prevent log(0)
                const clippedPred = Math.max(epsilon, Math.min(1 - epsilon, prediction));
                totalLoss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));
            } else {
                // Squared error loss
                totalLoss += Math.pow(point.y - prediction, 2);
            }
        });
        
        return totalLoss / this.dataPoints.length;
    }
    
    setOptimalValues() {
        if (this.dataPoints.length === 0) return;
        
        const useSigmoid = this.sigmoidToggle.checked;
        
        if (useSigmoid) {
            // For sigmoid activation, use gradient descent to minimize cross-entropy loss
            this.optimizeForClassification();
        } else {
            // For linear activation, use least squares to minimize MSE
            this.optimizeForRegression();
        }
        
        // Update display and redraw
        this.updateDisplay();
        this.draw();
    }
    
    optimizeForRegression() {
        // Calculate optimal alpha and beta using least squares method (same as linear regression)
        // α = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)
        // β = (∑y - α∑x) / n
        
        const n = this.dataPoints.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        this.dataPoints.forEach(point => {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumXX += point.x * point.x;
        });
        
        const denominator = n * sumXX - sumX * sumX;
        const optimalAlpha = (n * sumXY - sumX * sumY) / denominator;
        const optimalBeta = (sumY - optimalAlpha * sumX) / n;
        
        // Clamp values to slider ranges
        const clampedAlpha = Math.max(-5, Math.min(5, optimalAlpha));
        const clampedBeta = Math.max(-10, Math.min(10, optimalBeta));
        
        // Set slider values
        this.alphaSlider.value = clampedAlpha.toFixed(1);
        this.betaSlider.value = clampedBeta.toFixed(1);
    }
    
    optimizeForClassification() {
        // Use simple gradient descent to minimize cross-entropy loss
        let alpha = parseFloat(this.alphaSlider.value);
        let beta = parseFloat(this.betaSlider.value);
        
        const learningRate = 0.1;
        const maxIterations = 1000;
        
        for (let iter = 0; iter < maxIterations; iter++) {
            let alphaGrad = 0;
            let betaGrad = 0;
            
            // Calculate gradients
            this.dataPoints.forEach(point => {
                const z = alpha * point.x + beta;
                const prediction = this.sigmoid(z);
                const error = prediction - point.y;
                
                alphaGrad += error * point.x;
                betaGrad += error;
            });
            
            // Average gradients
            alphaGrad /= this.dataPoints.length;
            betaGrad /= this.dataPoints.length;
            
            // Update parameters
            alpha -= learningRate * alphaGrad;
            beta -= learningRate * betaGrad;
            
            // Early stopping if gradients are small
            if (Math.abs(alphaGrad) < 0.001 && Math.abs(betaGrad) < 0.001) {
                break;
            }
        }
        
        // Clamp values to slider ranges
        const clampedAlpha = Math.max(-5, Math.min(5, alpha));
        const clampedBeta = Math.max(-10, Math.min(10, beta));
        
        // Set slider values
        this.alphaSlider.value = clampedAlpha.toFixed(1);
        this.betaSlider.value = clampedBeta.toFixed(1);
    }
    
    generateNewData() {
        // Clear existing data and generate new data points
        this.clearAllData();
        this.generateDataPoints();
        this.updateDisplay();
        this.draw();
    }
    
    clearAllData() {
        // Clear all data points
        this.dataPoints = [];
        this.updateDisplay();
        this.draw();
    }
    
    handleCanvasClick(event) {
        // Get the canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // Convert canvas coordinates to data coordinates
        const dataCoords = this.canvasToData(canvasX, canvasY);
        
        // Check if click is within the plot area
        if (this.isWithinPlotArea(canvasX, canvasY)) {
            // Determine class based on y-position: above 0.5 = class 1, below 0.5 = class 0
            const classLabel = dataCoords.y > 0.5 ? 1 : 0;
            
            // Add new data point with determined class
            this.dataPoints.push({ x: dataCoords.x, y: classLabel });
            this.updateDisplay();
            this.draw();
        }
    }
    
    canvasToData(canvasX, canvasY) {
        // Convert canvas coordinates to data coordinates
        const x = this.xMin + ((canvasX - this.plotX) / this.plotWidth) * (this.xMax - this.xMin);
        const y = this.yMax - ((canvasY - this.plotY) / this.plotHeight) * (this.yMax - this.yMin);
        return { x, y };
    }
    
    isWithinPlotArea(canvasX, canvasY) {
        // Check if coordinates are within the plot area
        return canvasX >= this.plotX && 
               canvasX <= this.plotX + this.plotWidth && 
               canvasY >= this.plotY && 
               canvasY <= this.plotY + this.plotHeight;
    }
    
    draw() {
        // Clear canvas using display dimensions
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Enable anti-aliasing for smoother rendering
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw components
        this.drawAxes();
        this.drawDecisionBoundary();
        this.drawDataPoints();
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ClassificationDemo();
});