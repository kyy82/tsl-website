class LinearRegressionDemo {
    constructor() {
        this.canvas = document.getElementById('plot');
        this.ctx = this.canvas.getContext('2d');
        this.alphaSlider = document.getElementById('alpha');
        this.betaSlider = document.getElementById('beta');
        this.alphaValue = document.getElementById('alpha-value');
        this.betaValue = document.getElementById('beta-value');
        this.equation = document.getElementById('equation');
        this.mseDisplay = document.getElementById('mse');
        this.maeDisplay = document.getElementById('mae');
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
        this.yMin = -100;
        this.yMax = 100;
        
        // Generate sample data points
        this.generateDataPoints();
        
        // Initialize
        this.setupEventListeners();
        
        // Wait for MathJax to be ready before initial render
        this.initializeDisplay();
    }
    
    generateDataPoints() {
        this.dataPoints = [];
        const trueAlpha = (Math.random() - 0.5) * 14; // Random between -7 and 7
        const trueBeta = (Math.random() - 0.5) * 40;  // Random between -20 and 20
        const noise = 25;
        
        // Generate points with some noise around a true line
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 18; // Random x between -9 and 9
            const yTrue = trueAlpha * x + trueBeta;
            const yNoise = (Math.random() - 0.5) * noise * 2;
            const y = yTrue + yNoise;
            
            this.dataPoints.push({ x, y });
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
        
        this.alphaValue.textContent = alpha.toFixed(1);
        this.betaValue.textContent = beta.toString();
        
        // Fallback to plain text if MathJax is not available
        const betaSign = beta >= 0 ? '+' : '';
        this.equation.textContent = `y = ${alpha.toFixed(1)}x ${betaSign} ${beta}`;
        
        const mse = this.calculateMSE(alpha, beta);
        const mae = this.calculateMAE(alpha, beta);
        this.mseDisplay.textContent = `MSE = ${mse.toFixed(2)}`;
        this.maeDisplay.textContent = `MAE = ${mae.toFixed(2)}`;
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
        
        this.alphaValue.textContent = alpha.toFixed(1);
        this.betaValue.textContent = beta.toString();
        
        // Update equation display using LaTeX
        const betaSign = beta >= 0 ? '+' : '';
        const betaValue = beta >= 0 ? beta : Math.abs(beta);
        this.equation.innerHTML = `$$y = ${alpha.toFixed(1)}x ${betaSign} ${betaValue}$$`;
        
        // Re-render MathJax for the equation
        if (window.MathJax) {
            MathJax.typesetPromise([this.equation]).catch((err) => console.log(err));
        }
        
        // Calculate and display MSE and MAE
        const mse = this.calculateMSE(alpha, beta);
        const mae = this.calculateMAE(alpha, beta);
        this.mseDisplay.innerHTML = `$$\\text{MSE} = ${mse.toFixed(2)}$$`;
        this.maeDisplay.innerHTML = `$$\\text{MAE} = ${mae.toFixed(2)}$$`;
        
        // Re-render MathJax for MSE and MAE
        if (window.MathJax) {
            MathJax.typesetPromise([this.mseDisplay, this.maeDisplay]).catch((err) => console.log(err));
        }
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
        
        // Horizontal grid lines
        for (let y = this.yMin; y <= this.yMax; y += 20) {
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
        for (let y = this.yMin; y <= this.yMax; y += 20) {
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
        this.ctx.fillText('Y', 0, 0);
        this.ctx.restore();
    }
    
    drawDataPoints() {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.strokeStyle = '#d63447';
        this.ctx.lineWidth = 2;
        
        this.dataPoints.forEach(point => {
            const canvasPos = this.dataToCanvas(point.x, point.y);
            
            this.ctx.beginPath();
            this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
    
    drawRegressionLine() {
        const alpha = parseFloat(this.alphaSlider.value);
        const beta = parseFloat(this.betaSlider.value);
        
        // Calculate line endpoints
        const x1 = this.xMin;
        const y1 = alpha * x1 + beta;
        const x2 = this.xMax;
        const y2 = alpha * x2 + beta;
        
        const start = this.dataToCanvas(x1, y1);
        const end = this.dataToCanvas(x2, y2);
        
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }
    
    calculateMSE(alpha, beta) {
        let sumSquaredErrors = 0;
        
        this.dataPoints.forEach(point => {
            const predicted = alpha * point.x + beta;
            const error = point.y - predicted;
            sumSquaredErrors += error * error;
        });
        
        return sumSquaredErrors / this.dataPoints.length;
    }
    
    calculateMAE(alpha, beta) {
        let sumAbsoluteErrors = 0;
        
        this.dataPoints.forEach(point => {
            const predicted = alpha * point.x + beta;
            const error = Math.abs(point.y - predicted);
            sumAbsoluteErrors += error;
        });
        
        return sumAbsoluteErrors / this.dataPoints.length;
    }
    
    calculateOptimalValues() {
        // Calculate optimal alpha and beta using least squares method
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
        
        return { alpha: optimalAlpha, beta: optimalBeta };
    }
    
    setOptimalValues() {
        const optimal = this.calculateOptimalValues();
        
        // Clamp values to slider ranges
        const clampedAlpha = Math.max(-10, Math.min(10, optimal.alpha));
        const clampedBeta = Math.max(-100, Math.min(100, optimal.beta));
        
        // Set slider values
        this.alphaSlider.value = clampedAlpha.toFixed(1);
        this.betaSlider.value = Math.round(clampedBeta).toString();
        
        // Update display and redraw
        this.updateDisplay();
        this.draw();
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
            // Add new data point
            this.dataPoints.push({ x: dataCoords.x, y: dataCoords.y });
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
    
    drawErrorLines() {
        const alpha = parseFloat(this.alphaSlider.value);
        const beta = parseFloat(this.betaSlider.value);
        
        this.ctx.strokeStyle = '#777777';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        this.dataPoints.forEach(point => {
            const predicted = alpha * point.x + beta;
            const pointCanvas = this.dataToCanvas(point.x, point.y);
            const predictedCanvas = this.dataToCanvas(point.x, predicted);
            
            this.ctx.beginPath();
            this.ctx.moveTo(pointCanvas.x, pointCanvas.y);
            this.ctx.lineTo(predictedCanvas.x, predictedCanvas.y);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }
    
    draw() {
        // Clear canvas using display dimensions
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
        
        // Enable anti-aliasing for smoother rendering
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Draw components
        this.drawAxes();
        this.drawErrorLines();
        this.drawDataPoints();
        this.drawRegressionLine();
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LinearRegressionDemo();
});