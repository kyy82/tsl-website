class PolynomialRegularizationDemo {
    constructor() {
        this.canvas = document.getElementById('plot');
        this.ctx = this.canvas.getContext('2d');
        this.equation = document.getElementById('equation');
        this.mseDisplay = document.getElementById('mse');
        this.maeDisplay = document.getElementById('mae');
        this.generateDataBtn = document.getElementById('generate-data-btn');
        this.clearDataBtn = document.getElementById('clear-data-btn');
        
        // Get degree slider and display elements
        this.degreeSlider = document.getElementById('degree');
        this.degreeValue = document.getElementById('degree-value');
        
        // Get regularization sliders and display elements
        this.l1RegSlider = document.getElementById('l1-reg');
        this.l1Value = document.getElementById('l1-value');
        this.l2RegSlider = document.getElementById('l2-reg');
        this.l2Value = document.getElementById('l2-value');
        
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
        
        // Store true polynomial coefficients for data generation
        this.generateTruePolynomial();
        
        // Generate sample data points
        this.generateDataPoints();
        
        // Current polynomial coefficients (fitted)
        this.coefficients = [];
        
        // Initialize
        this.setupEventListeners();
        
        // Wait for MathJax to be ready before initial render
        this.initializeDisplay();
    }
    
    generateTruePolynomial() {
        // Generate random coefficients for a 3rd degree polynomial
        // Keep coefficients smaller to ensure data stays within plot bounds
        this.trueCoefficients = [
            (Math.random() - 0.5) * 60,   // constant term: -30 to 30
            (Math.random() - 0.5) * 8,    // linear term: -4 to 4
            (Math.random() - 0.5) * 2,    // quadratic term: -1 to 1
            (Math.random() - 0.5) * 0.4   // cubic term: -0.2 to 0.2
        ];
    }
    
    generateDataPoints() {
        this.dataPoints = [];
        const noise = 8;
        const maxAttempts = 50; // Prevent infinite loops
        
        // Generate points with some noise around the true polynomial
        for (let i = 0; i < 5; i++) {
            let attempts = 0;
            let x, y;
            
            // Keep trying until we get a point within bounds
            do {
                x = (Math.random() - 0.5) * 18; // Random x between -9 and 9 (slightly inside bounds)
                
                // Calculate true y value using the 3rd degree polynomial
                const yTrue = this.trueCoefficients[0] + 
                             this.trueCoefficients[1] * x + 
                             this.trueCoefficients[2] * x * x + 
                             this.trueCoefficients[3] * x * x * x;
                
                const yNoise = (Math.random() - 0.5) * noise * 2;
                y = yTrue + yNoise;
                
                attempts++;
            } while ((y < this.yMin || y > this.yMax) && attempts < maxAttempts);
            
            // If we couldn't find a valid point after many attempts, clamp it
            if (attempts >= maxAttempts) {
                y = Math.max(this.yMin + 10, Math.min(this.yMax - 10, y));
            }
            
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
        // Update degree and regularization displays first
        this.updateDegreeDisplay();
        this.updateRegularizationDisplay();
        
        // Always draw the plot first, regardless of MathJax status
        this.fitPolynomial();
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
    
    getSelectedPowers() {
        // Get polynomial powers based on degree slider (0 to degree)
        const degree = parseInt(this.degreeSlider.value);
        const selectedPowers = [];
        for (let i = 0; i <= degree; i++) {
            selectedPowers.push(i);
        }
        return selectedPowers;
    }
    
    updateDegreeDisplay() {
        const degree = parseInt(this.degreeSlider.value);
        this.degreeValue.textContent = degree.toString();
    }
    
    updateRegularizationDisplay() {
        const l1 = parseFloat(this.l1RegSlider.value);
        const l2 = parseFloat(this.l2RegSlider.value);
        this.l1Value.textContent = l1.toFixed(1);
        this.l2Value.textContent = l2.toFixed(1);
    }
    
    createDesignMatrix(dataPoints, powers) {
        // Create the design matrix X for polynomial regression
        const n = dataPoints.length;
        const p = powers.length;
        const X = [];
        
        for (let i = 0; i < n; i++) {
            const row = [];
            const x = dataPoints[i].x;
            
            for (let j = 0; j < p; j++) {
                const power = powers[j];
                row.push(Math.pow(x, power));
            }
            X.push(row);
        }
        
        return X;
    }
    
    fitPolynomial() {
        if (this.dataPoints.length === 0) {
            this.coefficients = [];
            return;
        }
        
        const selectedPowers = this.getSelectedPowers();
        if (selectedPowers.length === 0) {
            this.coefficients = [];
            return;
        }
        
        // Create design matrix and response vector
        const X = this.createDesignMatrix(this.dataPoints, selectedPowers);
        const y = this.dataPoints.map(point => point.y);
        
        // Get regularization parameters
        const l1Lambda = parseFloat(this.l1RegSlider.value);
        const l2Lambda = parseFloat(this.l2RegSlider.value);
        
        // Solve regularized normal equations
        try {
            this.coefficients = this.solveRegularizedNormalEquations(X, y, l1Lambda, l2Lambda);
            this.selectedPowers = selectedPowers;
        } catch (error) {
            console.warn('Matrix inversion failed, using zero coefficients');
            this.coefficients = new Array(selectedPowers.length).fill(0);
            this.selectedPowers = selectedPowers;
        }
    }
    
    solveNormalEquations(X, y) {
        // Compute X^T
        const n = X.length;
        const p = X[0].length;
        const XT = [];
        
        for (let i = 0; i < p; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                row.push(X[j][i]);
            }
            XT.push(row);
        }
        
        // Compute X^T X
        const XTX = [];
        for (let i = 0; i < p; i++) {
            const row = [];
            for (let j = 0; j < p; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += XT[i][k] * X[k][j];
                }
                row.push(sum);
            }
            XTX.push(row);
        }
        
        // Compute X^T y
        const XTy = [];
        for (let i = 0; i < p; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += XT[i][j] * y[j];
            }
            XTy.push(sum);
        }
        
        // Solve XTX * coefficients = XTy using Gaussian elimination
        return this.gaussianElimination(XTX, XTy);
    }
    
    gaussianElimination(A, b) {
        const n = A.length;
        
        // Create augmented matrix
        const augmented = [];
        for (let i = 0; i < n; i++) {
            augmented.push([...A[i], b[i]]);
        }
        
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }
            
            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            // Make all rows below this one 0 in current column
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[i][i]) < 1e-10) continue;
                const c = augmented[k][i] / augmented[i][i];
                for (let j = i; j <= n; j++) {
                    augmented[k][j] -= c * augmented[i][j];
                }
            }
        }
        
        // Back substitution
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= augmented[i][j] * x[j];
            }
            if (Math.abs(augmented[i][i]) > 1e-10) {
                x[i] /= augmented[i][i];
            }
        }
        
        return x;
    }
    
    solveRegularizedNormalEquations(X, y, l1Lambda, l2Lambda) {
        // For L2 regularization, we modify the normal equations: (X^T X + λ₂I) θ = X^T y
        // L1 regularization requires iterative methods, but for simplicity we'll use coordinate descent
        
        if (l1Lambda === 0) {
            // Pure L2 regularization (Ridge regression)
            return this.solveRidgeRegression(X, y, l2Lambda);
        } else {
            // Elastic net (L1 + L2) using coordinate descent
            return this.solveElasticNet(X, y, l1Lambda, l2Lambda);
        }
    }
    
    solveRidgeRegression(X, y, l2Lambda) {
        // Ridge regression: (X^T X + λI) θ = X^T y
        const n = X.length;
        const p = X[0].length;
        
        // Compute X^T
        const XT = [];
        for (let i = 0; i < p; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                row.push(X[j][i]);
            }
            XT.push(row);
        }
        
        // Compute X^T X + λI
        const XTX = [];
        for (let i = 0; i < p; i++) {
            const row = [];
            for (let j = 0; j < p; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += XT[i][k] * X[k][j];
                }
                // Add L2 regularization term
                if (i === j) {
                    sum += l2Lambda;
                }
                row.push(sum);
            }
            XTX.push(row);
        }
        
        // Compute X^T y
        const XTy = [];
        for (let i = 0; i < p; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += XT[i][j] * y[j];
            }
            XTy.push(sum);
        }
        
        // Solve (X^T X + λI) θ = X^T y
        return this.gaussianElimination(XTX, XTy);
    }
    
    solveElasticNet(X, y, l1Lambda, l2Lambda) {
        // Simplified coordinate descent for elastic net
        const n = X.length;
        const p = X[0].length;
        let coefficients = new Array(p).fill(0);
        const maxIter = 100;
        const tolerance = 1e-6;
        
        for (let iter = 0; iter < maxIter; iter++) {
            let maxChange = 0;
            
            for (let j = 0; j < p; j++) {
                const oldCoeff = coefficients[j];
                
                // Compute partial residual
                let partialResidual = 0;
                for (let i = 0; i < n; i++) {
                    let prediction = 0;
                    for (let k = 0; k < p; k++) {
                        if (k !== j) {
                            prediction += coefficients[k] * X[i][k];
                        }
                    }
                    partialResidual += X[i][j] * (y[i] - prediction);
                }
                
                // Compute sum of squares for feature j
                let sumSquares = 0;
                for (let i = 0; i < n; i++) {
                    sumSquares += X[i][j] * X[i][j];
                }
                
                // Soft thresholding for L1 regularization
                if (partialResidual > l1Lambda) {
                    coefficients[j] = (partialResidual - l1Lambda) / (sumSquares + l2Lambda);
                } else if (partialResidual < -l1Lambda) {
                    coefficients[j] = (partialResidual + l1Lambda) / (sumSquares + l2Lambda);
                } else {
                    coefficients[j] = 0;
                }
                
                maxChange = Math.max(maxChange, Math.abs(coefficients[j] - oldCoeff));
            }
            
            if (maxChange < tolerance) break;
        }
        
        return coefficients;
    }
    
    evaluatePolynomial(x) {
        if (!this.coefficients || this.coefficients.length === 0) {
            return 0;
        }
        
        let result = 0;
        for (let i = 0; i < this.coefficients.length; i++) {
            const power = this.selectedPowers[i];
            result += this.coefficients[i] * Math.pow(x, power);
        }
        return result;
    }
    
    setupEventListeners() {
        // Add event listener for degree slider
        this.degreeSlider.addEventListener('input', () => {
            this.updateDegreeDisplay();
            this.fitPolynomial();
            this.updateDisplay();
            this.draw();
        });
        
        // Add event listeners for regularization sliders
        this.l1RegSlider.addEventListener('input', () => {
            this.updateRegularizationDisplay();
            this.fitPolynomial();
            this.updateDisplay();
            this.draw();
        });
        
        this.l2RegSlider.addEventListener('input', () => {
            this.updateRegularizationDisplay();
            this.fitPolynomial();
            this.updateDisplay();
            this.draw();
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
        // Update equation display using LaTeX
        let equationText = 'y = ';
        
        if (!this.coefficients || this.coefficients.length === 0) {
            equationText = 'y = 0';
        } else {
            const terms = [];
            let hasNonZeroTerms = false;
            
            // Always show all terms up to the selected polynomial degree
            for (let i = 0; i < this.coefficients.length; i++) {
                const coeff = this.coefficients[i];
                const power = this.selectedPowers[i];
                
                // Check if coefficient is effectively zero (due to regularization)
                const isZero = Math.abs(coeff) < 1e-6;
                if (!isZero) hasNonZeroTerms = true;
                
                let term = '';
                const absCoeff = Math.abs(coeff);
                const sign = coeff >= 0 ? '+' : '-';
                
                if (i === 0) {
                    // First term
                    if (power === 0) {
                        term = isZero ? '0.00' : coeff.toFixed(2);
                    } else if (power === 1) {
                        term = isZero ? '0.00x' : `${coeff.toFixed(2)}x`;
                    } else {
                        term = isZero ? `0.00x^{${power}}` : `${coeff.toFixed(2)}x^{${power}}`;
                    }
                } else {
                    // Subsequent terms
                    if (power === 0) {
                        term = isZero ? '+ 0.00' : `${sign} ${absCoeff.toFixed(2)}`;
                    } else if (power === 1) {
                        term = isZero ? '+ 0.00x' : `${sign} ${absCoeff.toFixed(2)}x`;
                    } else {
                        term = isZero ? `+ 0.00x^{${power}}` : `${sign} ${absCoeff.toFixed(2)}x^{${power}}`;
                    }
                }
                
                terms.push(term);
            }
            
            if (!hasNonZeroTerms) {
                equationText = 'y = 0';
            } else {
                equationText += terms.join(' ');
            }
        }
        
        this.equation.innerHTML = `$$${equationText}$$`;
        
        // Re-render MathJax for the equation
        if (window.MathJax) {
            MathJax.typesetPromise([this.equation]).catch((err) => console.log(err));
        }
        
        // Calculate and display MSE and MAE
        const mse = this.calculateMSE();
        const mae = this.calculateMAE();
        this.mseDisplay.innerHTML = `$$\\text{MSE} = ${mse.toFixed(2)}$$`;
        this.maeDisplay.innerHTML = `$$\\text{MAE} = ${mae.toFixed(2)}$$`;
        
        // Re-render MathJax for MSE and MAE
        if (window.MathJax) {
            MathJax.typesetPromise([this.mseDisplay, this.maeDisplay]).catch((err) => console.log(err));
        }
    }
    
    updateDisplayPlainText() {
        // Fallback display without MathJax
        let equationText = 'y = ';
        
        if (!this.coefficients || this.coefficients.length === 0) {
            equationText = 'y = 0';
        } else {
            const terms = [];
            let hasNonZeroTerms = false;
            
            // Always show all terms up to the selected polynomial degree
            for (let i = 0; i < this.coefficients.length; i++) {
                const coeff = this.coefficients[i];
                const power = this.selectedPowers[i];
                
                // Check if coefficient is effectively zero (due to regularization)
                const isZero = Math.abs(coeff) < 1e-6;
                if (!isZero) hasNonZeroTerms = true;
                
                let term = '';
                const absCoeff = Math.abs(coeff);
                const sign = coeff >= 0 ? '+' : '-';
                
                if (i === 0) {
                    // First term
                    if (power === 0) {
                        term = isZero ? '0.00' : coeff.toFixed(2);
                    } else if (power === 1) {
                        term = isZero ? '0.00x' : `${coeff.toFixed(2)}x`;
                    } else {
                        term = isZero ? `0.00x^${power}` : `${coeff.toFixed(2)}x^${power}`;
                    }
                } else {
                    // Subsequent terms
                    if (power === 0) {
                        term = isZero ? '+ 0.00' : `${sign} ${absCoeff.toFixed(2)}`;
                    } else if (power === 1) {
                        term = isZero ? '+ 0.00x' : `${sign} ${absCoeff.toFixed(2)}x`;
                    } else {
                        term = isZero ? `+ 0.00x^${power}` : `${sign} ${absCoeff.toFixed(2)}x^${power}`;
                    }
                }
                
                terms.push(term);
            }
            
            if (!hasNonZeroTerms) {
                equationText = 'y = 0';
            } else {
                equationText += terms.join(' ');
            }
        }
        
        this.equation.textContent = equationText;
        
        const mse = this.calculateMSE();
        const mae = this.calculateMAE();
        this.mseDisplay.textContent = `MSE = ${mse.toFixed(2)}`;
        this.maeDisplay.textContent = `MAE = ${mae.toFixed(2)}`;
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
    
    drawPolynomialCurve() {
        if (!this.coefficients || this.coefficients.length === 0) {
            return;
        }
        
        // Save the current canvas state
        this.ctx.save();
        
        // Set up clipping region to plot bounds
        this.ctx.beginPath();
        this.ctx.rect(this.plotX, this.plotY, this.plotWidth, this.plotHeight);
        this.ctx.clip();
        
        // Draw the full curve (it will be clipped to the plot bounds)
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        let firstPoint = true;
        const step = (this.xMax - this.xMin) / 200;
        
        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = this.evaluatePolynomial(x);
            const canvasPos = this.dataToCanvas(x, y);
            
            if (firstPoint) {
                this.ctx.moveTo(canvasPos.x, canvasPos.y);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasPos.x, canvasPos.y);
            }
        }
        
        this.ctx.stroke();
        
        // Restore the canvas state (removes clipping)
        this.ctx.restore();
    }
    
    calculateMSE() {
        if (this.dataPoints.length === 0) return 0;
        
        let sumSquaredErrors = 0;
        
        this.dataPoints.forEach(point => {
            const predicted = this.evaluatePolynomial(point.x);
            const error = point.y - predicted;
            sumSquaredErrors += error * error;
        });
        
        return sumSquaredErrors / this.dataPoints.length;
    }
    
    calculateMAE() {
        if (this.dataPoints.length === 0) return 0;
        
        let sumAbsoluteErrors = 0;
        
        this.dataPoints.forEach(point => {
            const predicted = this.evaluatePolynomial(point.x);
            const error = Math.abs(point.y - predicted);
            sumAbsoluteErrors += error;
        });
        
        return sumAbsoluteErrors / this.dataPoints.length;
    }
    
    generateNewData() {
        // Generate new true polynomial and data points
        this.generateTruePolynomial();
        this.clearAllData();
        this.generateDataPoints();
        this.fitPolynomial();
        this.updateDisplay();
        this.draw();
    }
    
    clearAllData() {
        // Clear all data points
        this.dataPoints = [];
        this.fitPolynomial();
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
            this.fitPolynomial();
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
        this.ctx.strokeStyle = '#777777';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        
        this.dataPoints.forEach(point => {
            const predicted = this.evaluatePolynomial(point.x);
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
        this.drawPolynomialCurve();
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PolynomialRegularizationDemo();
});