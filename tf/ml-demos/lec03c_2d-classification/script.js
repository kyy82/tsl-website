class TwoDClassificationDemo {
    constructor() {
        this.canvas = document.getElementById('plot');
        this.ctx = this.canvas.getContext('2d');
        this.w1Slider = document.getElementById('w1');
        this.w2Slider = document.getElementById('w2');
        this.biasSlider = document.getElementById('bias');
        this.w1Value = document.getElementById('w1-value');
        this.w2Value = document.getElementById('w2-value');
        this.biasValue = document.getElementById('bias-value');
        this.boundaryType = document.getElementById('boundary-type');
        this.w11Slider = document.getElementById('w11');
        this.w22Slider = document.getElementById('w22');
        this.w12Slider = document.getElementById('w12');
        this.radiusSlider = document.getElementById('radius');
        this.centerX1Slider = document.getElementById('center-x1');
        this.centerX2Slider = document.getElementById('center-x2');
        this.w11Value = document.getElementById('w11-value');
        this.w22Value = document.getElementById('w22-value');
        this.w12Value = document.getElementById('w12-value');
        this.radiusValue = document.getElementById('radius-value');
        this.centerX1Value = document.getElementById('center-x1-value');
        this.centerX2Value = document.getElementById('center-x2-value');
        this.equation = document.getElementById('equation');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.lossDisplay = document.getElementById('loss');
        this.solutionBtn = document.getElementById('solution-btn');
        this.classToggle = document.getElementById('class-toggle');
        this.generateDataBtn = document.getElementById('generate-data-btn');
        this.clearDataBtn = document.getElementById('clear-data-btn');
        
        // Setup high-DPI canvas
        this.setupHighDPICanvas();
        
        // Plot dimensions and scaling (use display dimensions, not canvas dimensions)
        this.plotWidth = this.displayWidth - 80;
        this.plotHeight = this.displayHeight - 80;
        this.plotX = 40;
        this.plotY = 40;
        
        // Data range for 2D plot
        this.x1Min = -5;
        this.x1Max = 5;
        this.x2Min = -5;
        this.x2Max = 5;
        
        
        // Generate sample data points
        this.generateDataPoints();
        
        // Initialize
        this.setupEventListeners();
        
        // Initialize control visibility
        this.updateControlsVisibility();
        
        // Wait for MathJax to be ready before initial render
        this.initializeDisplay();
    }
    
    generateDataPoints() {
        this.dataPoints = [];
        
        // Choose from different distribution patterns
        const patterns = [
            'diagonal_clusters',
            'horizontal_vertical',
            'circular_pattern',
            'random_mixed',
            'corner_clusters'
        ];
        
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        switch (pattern) {
            case 'diagonal_clusters':
                this.generateDiagonalClusters();
                break;
            case 'horizontal_vertical':
                this.generateHorizontalVertical();
                break;
            case 'circular_pattern':
                this.generateCircularPattern();
                break;
            case 'random_mixed':
                this.generateRandomMixed();
                break;
            case 'corner_clusters':
                this.generateCornerClusters();
                break;
        }
    }
    
    generateDiagonalClusters() {
        // Generate points along diagonal separation
        for (let i = 0; i < 12; i++) {
            const x1 = -3 + Math.random() * 2.5 + (Math.random() - 0.5) * 1.5;
            const x2 = -3 + Math.random() * 2.5 + (Math.random() - 0.5) * 1.5;
            this.dataPoints.push({ x1, x2, y: 0 });
        }
        
        for (let i = 0; i < 12; i++) {
            const x1 = 0.5 + Math.random() * 2.5 + (Math.random() - 0.5) * 1.5;
            const x2 = 0.5 + Math.random() * 2.5 + (Math.random() - 0.5) * 1.5;
            this.dataPoints.push({ x1, x2, y: 1 });
        }
    }
    
    generateHorizontalVertical() {
        // Generate points separated horizontally or vertically
        const isHorizontal = Math.random() > 0.5;
        
        for (let i = 0; i < 12; i++) {
            if (isHorizontal) {
                const x1 = (Math.random() - 0.5) * 8;
                const x2 = -3 + Math.random() * 2 + (Math.random() - 0.5) * 0.8;
                this.dataPoints.push({ x1, x2, y: 0 });
            } else {
                const x1 = -3 + Math.random() * 2 + (Math.random() - 0.5) * 0.8;
                const x2 = (Math.random() - 0.5) * 8;
                this.dataPoints.push({ x1, x2, y: 0 });
            }
        }
        
        for (let i = 0; i < 12; i++) {
            if (isHorizontal) {
                const x1 = (Math.random() - 0.5) * 8;
                const x2 = 1 + Math.random() * 2 + (Math.random() - 0.5) * 0.8;
                this.dataPoints.push({ x1, x2, y: 1 });
            } else {
                const x1 = 1 + Math.random() * 2 + (Math.random() - 0.5) * 0.8;
                const x2 = (Math.random() - 0.5) * 8;
                this.dataPoints.push({ x1, x2, y: 1 });
            }
        }
    }
    
    generateCircularPattern() {
        // Generate points in inner and outer regions
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.random() * 1.5 + 0.5;
            const x1 = radius * Math.cos(angle) + (Math.random() - 0.5) * 0.8;
            const x2 = radius * Math.sin(angle) + (Math.random() - 0.5) * 0.8;
            this.dataPoints.push({ x1, x2, y: 0 });
        }
        
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 2.5 + Math.random() * 1.5;
            const x1 = radius * Math.cos(angle) + (Math.random() - 0.5) * 0.8;
            const x2 = radius * Math.sin(angle) + (Math.random() - 0.5) * 0.8;
            // Keep points within bounds
            if (Math.abs(x1) <= 4.5 && Math.abs(x2) <= 4.5) {
                this.dataPoints.push({ x1, x2, y: 1 });
            } else {
                i--; // Try again
            }
        }
    }
    
    generateRandomMixed() {
        // Generate more randomly distributed points with some overlap
        for (let i = 0; i < 12; i++) {
            const x1 = -4 + Math.random() * 4 + (Math.random() - 0.5) * 2;
            const x2 = -4 + Math.random() * 4 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 0 });
        }
        
        for (let i = 0; i < 12; i++) {
            const x1 = 0 + Math.random() * 4 + (Math.random() - 0.5) * 2;
            const x2 = 0 + Math.random() * 4 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 1 });
        }
    }
    
    generateCornerClusters() {
        // Generate points in different corners
        const corners = [
            { x1: -3, x2: -3 }, { x1: 3, x2: 3 },   // Class 0
            { x1: -3, x2: 3 }, { x1: 3, x2: -3 }    // Class 1
        ];
        
        // Class 0 points
        for (let i = 0; i < 6; i++) {
            const corner = corners[0];
            const x1 = corner.x1 + (Math.random() - 0.5) * 2;
            const x2 = corner.x2 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 0 });
        }
        
        for (let i = 0; i < 6; i++) {
            const corner = corners[1];
            const x1 = corner.x1 + (Math.random() - 0.5) * 2;
            const x2 = corner.x2 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 0 });
        }
        
        // Class 1 points
        for (let i = 0; i < 6; i++) {
            const corner = corners[2];
            const x1 = corner.x1 + (Math.random() - 0.5) * 2;
            const x2 = corner.x2 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 1 });
        }
        
        for (let i = 0; i < 6; i++) {
            const corner = corners[3];
            const x1 = corner.x1 + (Math.random() - 0.5) * 2;
            const x2 = corner.x2 + (Math.random() - 0.5) * 2;
            this.dataPoints.push({ x1, x2, y: 1 });
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
        const params = this.getCurrentParameters();
        
        // Update all value displays
        this.w1Value.textContent = params.w1.toFixed(1);
        this.w2Value.textContent = params.w2.toFixed(1);
        this.biasValue.textContent = params.bias.toFixed(1);
        
        // Update nonlinear parameter displays
        if (this.w11Value) this.w11Value.textContent = (params.w11 || 0).toFixed(1);
        if (this.w22Value) this.w22Value.textContent = (params.w22 || 0).toFixed(1);
        if (this.w12Value) this.w12Value.textContent = (params.w12 || 0).toFixed(1);
        if (this.radiusValue) this.radiusValue.textContent = (params.radius || 2).toFixed(1);
        if (this.centerX1Value) this.centerX1Value.textContent = (params.centerX1 || 0).toFixed(1);
        if (this.centerX2Value) this.centerX2Value.textContent = (params.centerX2 || 0).toFixed(1);
        
        // Create equation text based on boundary type
        const equationText = this.getEquationText(params);
        this.equation.textContent = equationText;
        
        const accuracy = this.calculateAccuracy();
        const loss = this.calculateLoss();
        this.accuracyDisplay.textContent = `Accuracy = ${(accuracy * 100).toFixed(1)}%`;
        this.lossDisplay.textContent = `Loss = ${loss.toFixed(3)}`;
    }
    
    getEquationText(params) {
        switch (params.type) {
            case 'linear':
                return this.getLinearEquation(params);
            case 'quadratic':
                return this.getQuadraticEquation(params);
            case 'circular':
                return this.getCircularEquation(params);
            default:
                return this.getLinearEquation(params);
        }
    }
    
    getLinearEquation(params) {
        const biasSign = params.bias >= 0 ? '+' : '-';
        return `f(x) = σ(${params.w1.toFixed(1)}x₁ + ${params.w2.toFixed(1)}x₂ ${biasSign} ${Math.abs(params.bias).toFixed(1)})`;
    }
    
    getQuadraticEquation(params) {
        let terms = [];
        
        // Linear terms
        if (params.w1 !== 0) terms.push(`${params.w1.toFixed(1)}x₁`);
        if (params.w2 !== 0) terms.push(`${params.w2.toFixed(1)}x₂`);
        
        // Quadratic terms
        if (params.w11 && params.w11 !== 0) {
            terms.push(`${params.w11.toFixed(1)}x₁²`);
        }
        if (params.w22 && params.w22 !== 0) {
            terms.push(`${params.w22.toFixed(1)}x₂²`);
        }
        if (params.w12 && params.w12 !== 0) {
            terms.push(`${params.w12.toFixed(1)}x₁x₂`);
        }
        
        // Bias term
        if (params.bias !== 0) {
            terms.push(`${params.bias.toFixed(1)}`);
        }
        
        if (terms.length === 0) {
            return `f(x) = σ(0)`;
        }
        
        // Join terms with proper signs
        let equation = terms[0];
        for (let i = 1; i < terms.length; i++) {
            const term = terms[i];
            if (term.startsWith('-')) {
                equation += ` - ${term.substring(1)}`;
            } else {
                equation += ` + ${term}`;
            }
        }
        
        return `f(x) = σ(${equation})`;
    }
    
    getCircularEquation(params) {
        const centerX1 = params.centerX1.toFixed(1);
        const centerX2 = params.centerX2.toFixed(1);
        const radius = params.radius.toFixed(1);
        
        // Handle signs for center coordinates
        const x1Term = params.centerX1 >= 0 ? `x₁ - ${centerX1}` : `x₁ + ${Math.abs(params.centerX1).toFixed(1)}`;
        const x2Term = params.centerX2 >= 0 ? `x₂ - ${centerX2}` : `x₂ + ${Math.abs(params.centerX2).toFixed(1)}`;
        
        return `f(x) = σ(${radius} - √[(${x1Term})² + (${x2Term})²])`;
    }
    
    getLatexEquation(params) {
        switch (params.type) {
            case 'linear':
                return this.getLinearLatex(params);
            case 'quadratic':
                return this.getQuadraticLatex(params);
            case 'circular':
                return this.getCircularLatex(params);
            default:
                return this.getLinearLatex(params);
        }
    }
    
    getLinearLatex(params) {
        const biasSign = params.bias >= 0 ? '+' : '-';
        return `$$f(\\mathbf{x}) = \\sigma(${params.w1.toFixed(1)}x_1 + ${params.w2.toFixed(1)}x_2 ${biasSign} ${Math.abs(params.bias).toFixed(1)})$$`;
    }
    
    getQuadraticLatex(params) {
        let terms = [];
        
        // Linear terms
        if (params.w1 !== 0) terms.push(`${params.w1.toFixed(1)}x_1`);
        if (params.w2 !== 0) terms.push(`${params.w2.toFixed(1)}x_2`);
        
        // Quadratic terms
        if (params.w11 && params.w11 !== 0) {
            terms.push(`${params.w11.toFixed(1)}x_1^2`);
        }
        if (params.w22 && params.w22 !== 0) {
            terms.push(`${params.w22.toFixed(1)}x_2^2`);
        }
        if (params.w12 && params.w12 !== 0) {
            terms.push(`${params.w12.toFixed(1)}x_1 x_2`);
        }
        
        // Bias term
        if (params.bias !== 0) {
            terms.push(`${params.bias.toFixed(1)}`);
        }
        
        if (terms.length === 0) {
            return `$$f(\\mathbf{x}) = \\sigma(0)$$`;
        }
        
        // Join terms with proper signs
        let equation = terms[0];
        for (let i = 1; i < terms.length; i++) {
            const term = terms[i];
            if (term.startsWith('-')) {
                equation += ` - ${term.substring(1)}`;
            } else {
                equation += ` + ${term}`;
            }
        }
        
        return `$$f(\\mathbf{x}) = \\sigma(${equation})$$`;
    }
    
    getCircularLatex(params) {
        const centerX1 = params.centerX1.toFixed(1);
        const centerX2 = params.centerX2.toFixed(1);
        const radius = params.radius.toFixed(1);
        
        // Handle signs for center coordinates
        const x1Term = params.centerX1 >= 0 ? `x_1 - ${centerX1}` : `x_1 + ${Math.abs(params.centerX1).toFixed(1)}`;
        const x2Term = params.centerX2 >= 0 ? `x_2 - ${centerX2}` : `x_2 + ${Math.abs(params.centerX2).toFixed(1)}`;
        
        return `$$f(\\mathbf{x}) = \\sigma\\left(${radius} - \\sqrt{(${x1Term})^2 + (${x2Term})^2}\\right)$$`;
    }
    
    setupEventListeners() {
        this.w1Slider.addEventListener('input', () => {
            this.updateDisplay();
            this.draw();
        });
        
        this.w2Slider.addEventListener('input', () => {
            this.updateDisplay();
            this.draw();
        });
        
        this.biasSlider.addEventListener('input', () => {
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
        
        this.boundaryType.addEventListener('change', () => {
            this.updateControlsVisibility();
            this.updateDisplay();
            this.draw();
        });
        
        // Event listeners for nonlinear parameters
        [this.w11Slider, this.w22Slider, this.w12Slider, this.radiusSlider, this.centerX1Slider, this.centerX2Slider].forEach(slider => {
            if (slider) {
                slider.addEventListener('input', () => {
                    this.updateDisplay();
                    this.draw();
                });
            }
        });
    }
    
    updateControlsVisibility() {
        const boundaryType = this.boundaryType.value;
        
        // Hide all parameter controls first
        ['w1-group', 'w2-group', 'bias-group', 'w11-group', 'w22-group', 'w12-group', 'radius-group', 'center-x1-group', 'center-x2-group'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Show relevant controls based on boundary type
        switch (boundaryType) {
            case 'linear':
                // Linear: show w1, w2, bias
                document.getElementById('w1-group').style.display = 'block';
                document.getElementById('w2-group').style.display = 'block';
                document.getElementById('bias-group').style.display = 'block';
                break;
                
            case 'quadratic':
                // Quadratic: show w1, w2, bias + quadratic terms
                document.getElementById('w1-group').style.display = 'block';
                document.getElementById('w2-group').style.display = 'block';
                document.getElementById('bias-group').style.display = 'block';
                document.getElementById('w11-group').style.display = 'block';
                document.getElementById('w22-group').style.display = 'block';
                document.getElementById('w12-group').style.display = 'block';
                break;
                
                
            case 'circular':
                // Circular: show only radius and center parameters
                document.getElementById('radius-group').style.display = 'block';
                document.getElementById('center-x1-group').style.display = 'block';
                document.getElementById('center-x2-group').style.display = 'block';
                break;
        }
    }
    
    updateDisplay() {
        const params = this.getCurrentParameters();
        
        this.w1Value.textContent = params.w1.toFixed(1);
        this.w2Value.textContent = params.w2.toFixed(1);
        this.biasValue.textContent = params.bias.toFixed(1);
        
        // Update nonlinear parameter displays
        if (this.w11Value) this.w11Value.textContent = (params.w11 || 0).toFixed(1);
        if (this.w22Value) this.w22Value.textContent = (params.w22 || 0).toFixed(1);
        if (this.w12Value) this.w12Value.textContent = (params.w12 || 0).toFixed(1);
        if (this.radiusValue) this.radiusValue.textContent = (params.radius || 2).toFixed(1);
        if (this.centerX1Value) this.centerX1Value.textContent = (params.centerX1 || 0).toFixed(1);
        if (this.centerX2Value) this.centerX2Value.textContent = (params.centerX2 || 0).toFixed(1);
        
        // Update equation display using LaTeX  
        const latexEquation = this.getLatexEquation(params);
        this.equation.innerHTML = latexEquation;
        
        // Re-render MathJax for the equation
        if (window.MathJax) {
            MathJax.typesetPromise([this.equation]).catch((err) => console.log(err));
        }
        
        // Calculate and display accuracy and loss
        const accuracy = this.calculateAccuracy();
        const loss = this.calculateLoss();
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
    
    predict(x1, x2, parameters = null) {
        if (!parameters) {
            parameters = this.getCurrentParameters();
        }
        
        const linear = this.computeLinearCombination(x1, x2, parameters);
        return this.sigmoid(linear);
    }
    
    classify(x1, x2, parameters = null) {
        const prediction = this.predict(x1, x2, parameters);
        return prediction > 0.5 ? 1 : 0;
    }
    
    getCurrentParameters() {
        const boundaryType = this.boundaryType.value;
        const params = {
            type: boundaryType,
            w1: parseFloat(this.w1Slider.value),
            w2: parseFloat(this.w2Slider.value),
            bias: parseFloat(this.biasSlider.value)
        };
        
        switch (boundaryType) {
            case 'quadratic':
                params.w11 = this.w11Slider ? parseFloat(this.w11Slider.value) : 0;
                params.w22 = this.w22Slider ? parseFloat(this.w22Slider.value) : 0;
                params.w12 = this.w12Slider ? parseFloat(this.w12Slider.value) : 0;
                break;
            case 'circular':
                params.radius = this.radiusSlider ? parseFloat(this.radiusSlider.value) : 2;
                params.centerX1 = this.centerX1Slider ? parseFloat(this.centerX1Slider.value) : 0;
                params.centerX2 = this.centerX2Slider ? parseFloat(this.centerX2Slider.value) : 0;
                break;
        }
        
        return params;
    }
    
    computeLinearCombination(x1, x2, params) {
        let result = params.w1 * x1 + params.w2 * x2 + params.bias;
        
        switch (params.type) {
            case 'quadratic':
                result += params.w11 * x1 * x1 + params.w22 * x2 * x2 + params.w12 * x1 * x2;
                break;
            case 'circular':
                const dx = x1 - params.centerX1;
                const dy = x2 - params.centerX2;
                const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                result = params.radius - distanceFromCenter; // Inside circle = positive
                break;
        }
        
        return result;
    }
    
    // Convert data coordinates to canvas coordinates
    dataToCanvas(x1, x2) {
        const canvasX = this.plotX + ((x1 - this.x1Min) / (this.x1Max - this.x1Min)) * this.plotWidth;
        const canvasY = this.plotY + this.plotHeight - ((x2 - this.x2Min) / (this.x2Max - this.x2Min)) * this.plotHeight;
        return { x: canvasX, y: canvasY };
    }
    
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // X-axis (X1)
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotX, this.plotY + this.plotHeight);
        this.ctx.lineTo(this.plotX + this.plotWidth, this.plotY + this.plotHeight);
        this.ctx.stroke();
        
        // Y-axis (X2)
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
        
        // Vertical grid lines (X1)
        for (let x1 = this.x1Min; x1 <= this.x1Max; x1 += 1) {
            const canvasPos = this.dataToCanvas(x1, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasPos.x, this.plotY);
            this.ctx.lineTo(canvasPos.x, this.plotY + this.plotHeight);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines (X2)
        for (let x2 = this.x2Min; x2 <= this.x2Max; x2 += 1) {
            const canvasPos = this.dataToCanvas(0, x2);
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
        
        // X1-axis labels
        for (let x1 = this.x1Min; x1 <= this.x1Max; x1 += 1) {
            const canvasPos = this.dataToCanvas(x1, 0);
            this.ctx.fillText(x1.toString(), canvasPos.x, this.plotY + this.plotHeight + 20);
        }
        
        // X2-axis labels
        this.ctx.textAlign = 'right';
        for (let x2 = this.x2Min; x2 <= this.x2Max; x2 += 1) {
            const canvasPos = this.dataToCanvas(0, x2);
            this.ctx.fillText(x2.toString(), this.plotX - 10, canvasPos.y + 4);
        }
        
        // Axis titles
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('X₁', this.plotX + this.plotWidth / 2, this.displayHeight - 10);
        
        this.ctx.save();
        this.ctx.translate(15, this.plotY + this.plotHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('X₂', 0, 0);
        this.ctx.restore();
    }
    
    drawDataPoints() {
        this.dataPoints.forEach(point => {
            const canvasPos = this.dataToCanvas(point.x1, point.x2);
            
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
        const params = this.getCurrentParameters();
        
        // Use unified contour plotting for all boundary types
        this.drawNonlinearBoundary(params);
    }
    
    drawNonlinearBoundary(params) {
        // Draw nonlinear boundary using contour plotting
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 3;
        
        // Create a grid of points and find where the function crosses 0
        const resolution = 100;
        const contourLines = this.findContourLines(0.5, resolution, params); // 0.5 probability contour
        
        // Draw the main decision boundary
        this.drawContourLines(contourLines, '#4ecdc4', 3, []);
        
        // Draw additional probability contours
        const contour25 = this.findContourLines(0.25, resolution, params);
        const contour75 = this.findContourLines(0.75, resolution, params);
        
        this.drawContourLines(contour25, 'rgba(78, 205, 196, 0.6)', 2, [5, 5]);
        this.drawContourLines(contour75, 'rgba(78, 205, 196, 0.6)', 2, [5, 5]);
        
        // Reset line dash
        this.ctx.setLineDash([]);
    }
    
    findContourLines(targetProb, resolution, params) {
        const lines = [];
        const step = (this.x1Max - this.x1Min) / resolution;
        
        // Find contour lines using marching squares algorithm (simplified)
        for (let i = 0; i < resolution - 1; i++) {
            for (let j = 0; j < resolution - 1; j++) {
                const x1a = this.x1Min + i * step;
                const x1b = this.x1Min + (i + 1) * step;
                const x2a = this.x2Min + j * step;
                const x2b = this.x2Min + (j + 1) * step;
                
                // Get values at four corners of the cell
                const v00 = this.predict(x1a, x2a, params);
                const v10 = this.predict(x1b, x2a, params);
                const v01 = this.predict(x1a, x2b, params);
                const v11 = this.predict(x1b, x2b, params);
                
                // Check if contour passes through this cell
                const min = Math.min(v00, v10, v01, v11);
                const max = Math.max(v00, v10, v01, v11);
                
                if (min <= targetProb && max >= targetProb) {
                    // Find intersection points on edges
                    const intersections = [];
                    
                    // Bottom edge
                    if ((v00 - targetProb) * (v10 - targetProb) <= 0) {
                        const t = (targetProb - v00) / (v10 - v00);
                        intersections.push({ x1: x1a + t * step, x2: x2a });
                    }
                    
                    // Right edge
                    if ((v10 - targetProb) * (v11 - targetProb) <= 0) {
                        const t = (targetProb - v10) / (v11 - v10);
                        intersections.push({ x1: x1b, x2: x2a + t * step });
                    }
                    
                    // Top edge
                    if ((v11 - targetProb) * (v01 - targetProb) <= 0) {
                        const t = (targetProb - v01) / (v11 - v01);
                        intersections.push({ x1: x1a + t * step, x2: x2b });
                    }
                    
                    // Left edge
                    if ((v01 - targetProb) * (v00 - targetProb) <= 0) {
                        const t = (targetProb - v00) / (v01 - v00);
                        intersections.push({ x1: x1a, x2: x2a + t * step });
                    }
                    
                    // Connect intersection points (simplified)
                    if (intersections.length >= 2) {
                        lines.push({
                            start: intersections[0],
                            end: intersections[1]
                        });
                    }
                }
            }
        }
        
        return lines;
    }
    
    drawContourLines(lines, color, width, dashPattern) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dashPattern);
        
        lines.forEach(line => {
            const start = this.dataToCanvas(line.start.x1, line.start.x2);
            const end = this.dataToCanvas(line.end.x1, line.end.x2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        });
    }
    
    drawLinearBoundary(w1, w2, bias) {
        // Decision boundary: w1*x1 + w2*x2 + bias = 0
        // Solve for x2: x2 = -(w1*x1 + bias) / w2
        
        if (Math.abs(w2) < 0.001) {
            // Nearly vertical line: x1 = -bias / w1
            if (Math.abs(w1) > 0.001) {
                const x1 = -bias / w1;
                if (x1 >= this.x1Min && x1 <= this.x1Max) {
                    const start = this.dataToCanvas(x1, this.x2Min);
                    const end = this.dataToCanvas(x1, this.x2Max);
                    
                    this.ctx.strokeStyle = '#4ecdc4';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(end.x, end.y);
                    this.ctx.stroke();
                }
            }
        } else {
            // Calculate boundary points
            const x1Start = this.x1Min;
            const x2Start = -(w1 * x1Start + bias) / w2;
            const x1End = this.x1Max;
            const x2End = -(w1 * x1End + bias) / w2;
            
            // Only draw if line intersects the plot area
            if ((x2Start >= this.x2Min && x2Start <= this.x2Max) ||
                (x2End >= this.x2Min && x2End <= this.x2Max) ||
                (x2Start < this.x2Min && x2End > this.x2Max) ||
                (x2Start > this.x2Max && x2End < this.x2Min)) {
                
                const start = this.dataToCanvas(x1Start, x2Start);
                const end = this.dataToCanvas(x1End, x2End);
                
                this.ctx.strokeStyle = '#4ecdc4';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.stroke();
            }
        }
    }
    
    drawSigmoidContours(w1, w2, bias) {
        // Draw contour at probability = 0.5 (decision boundary)
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 3;
        
        // For sigmoid, the 0.5 probability contour is still the linear boundary
        this.drawLinearBoundary(w1, w2, bias);
        
        // Draw additional probability contours
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Draw 0.25 and 0.75 probability contours
        const contours = [0.25, 0.75];
        contours.forEach(prob => {
            // For sigmoid(w1*x1 + w2*x2 + bias) = prob
            // w1*x1 + w2*x2 + bias = logit(prob)
            const logitProb = Math.log(prob / (1 - prob));
            const contourBias = bias - logitProb;
            
            if (Math.abs(w2) > 0.001) {
                const x1Start = this.x1Min;
                const x2Start = -(w1 * x1Start + contourBias) / w2;
                const x1End = this.x1Max;
                const x2End = -(w1 * x1End + contourBias) / w2;
                
                if ((x2Start >= this.x2Min && x2Start <= this.x2Max) ||
                    (x2End >= this.x2Min && x2End <= this.x2Max) ||
                    (x2Start < this.x2Min && x2End > this.x2Max) ||
                    (x2Start > this.x2Max && x2End < this.x2Min)) {
                    
                    const start = this.dataToCanvas(x1Start, x2Start);
                    const end = this.dataToCanvas(x1End, x2End);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(end.x, end.y);
                    this.ctx.stroke();
                }
            }
        });
        
        // Reset line dash for other drawing operations
        this.ctx.setLineDash([]);
    }
    
    calculateAccuracy() {
        if (this.dataPoints.length === 0) return 0;
        
        let correct = 0;
        this.dataPoints.forEach(point => {
            const predicted = this.classify(point.x1, point.x2);
            if (predicted === point.y) correct++;
        });
        
        return correct / this.dataPoints.length;
    }
    
    calculateLoss() {
        if (this.dataPoints.length === 0) return 0;
        
        let totalLoss = 0;
        this.dataPoints.forEach(point => {
            const prediction = this.predict(point.x1, point.x2);
            // Cross-entropy loss
            const epsilon = 1e-15; // Prevent log(0)
            const clippedPred = Math.max(epsilon, Math.min(1 - epsilon, prediction));
            totalLoss += -(point.y * Math.log(clippedPred) + (1 - point.y) * Math.log(1 - clippedPred));
        });
        
        return totalLoss / this.dataPoints.length;
    }
    
    
    resetParametersToDefault() {
        this.w1Slider.value = "0.1";
        this.w2Slider.value = "0.1";
        this.biasSlider.value = "0.0";
        if (this.w11Slider) this.w11Slider.value = "0.0";
        if (this.w22Slider) this.w22Slider.value = "0.0";
        if (this.w12Slider) this.w12Slider.value = "0.0";
        if (this.radiusSlider) this.radiusSlider.value = "2.0";
        if (this.centerX1Slider) this.centerX1Slider.value = "0.0";
        if (this.centerX2Slider) this.centerX2Slider.value = "0.0";
    }
    
    setParametersFromObject(params) {
        this.w1Slider.value = params.w1.toFixed(1);
        this.w2Slider.value = params.w2.toFixed(1);
        this.biasSlider.value = params.bias.toFixed(1);
        
        if (params.w11 !== undefined && this.w11Slider) this.w11Slider.value = params.w11.toFixed(1);
        if (params.w22 !== undefined && this.w22Slider) this.w22Slider.value = params.w22.toFixed(1);
        if (params.w12 !== undefined && this.w12Slider) this.w12Slider.value = params.w12.toFixed(1);
        if (params.radius !== undefined && this.radiusSlider) this.radiusSlider.value = params.radius.toFixed(1);
        if (params.centerX1 !== undefined && this.centerX1Slider) this.centerX1Slider.value = params.centerX1.toFixed(1);
        if (params.centerX2 !== undefined && this.centerX2Slider) this.centerX2Slider.value = params.centerX2.toFixed(1);
    }
    
    calculateAccuracyWithParams(params) {
        if (this.dataPoints.length === 0) return 0;
        
        let correct = 0;
        this.dataPoints.forEach(point => {
            const predicted = this.predict(point.x1, point.x2, params) > 0.5 ? 1 : 0;
            if (predicted === point.y) correct++;
        });
        
        return correct / this.dataPoints.length;
    }
    
    setOptimalValues() {
        if (this.dataPoints.length === 0) return;
        
        const boundaryType = this.boundaryType.value;
        
        // Use appropriate optimization method based on boundary type
        this.optimizeForBoundaryType(boundaryType).then(params => {
            this.setParametersFromObject(params);
            this.updateDisplay();
            this.draw();
        });
    }
    
    async optimizeForBoundaryType(boundaryType) {
        switch (boundaryType) {
            case 'linear':
                return this.optimizeLinear();
            case 'quadratic':
                return this.optimizeQuadratic();
            case 'circular':
                return this.optimizeCircular();
            default:
                return this.optimizeLinear();
        }
    }
    
    optimizeLinear() {
        return new Promise((resolve) => {
            let w1 = parseFloat(this.w1Slider.value);
            let w2 = parseFloat(this.w2Slider.value);
            let bias = parseFloat(this.biasSlider.value);
            
            const learningRate = 0.1;
            const maxIterations = 1000;
            
            for (let iter = 0; iter < maxIterations; iter++) {
                let w1Grad = 0;
                let w2Grad = 0;
                let biasGrad = 0;
                
                this.dataPoints.forEach(point => {
                    const z = w1 * point.x1 + w2 * point.x2 + bias;
                    const prediction = this.sigmoid(z);
                    const error = prediction - point.y;
                    
                    w1Grad += error * point.x1;
                    w2Grad += error * point.x2;
                    biasGrad += error;
                });
                
                w1Grad /= this.dataPoints.length;
                w2Grad /= this.dataPoints.length;
                biasGrad /= this.dataPoints.length;
                
                w1 -= learningRate * w1Grad;
                w2 -= learningRate * w2Grad;
                bias -= learningRate * biasGrad;
                
                if (Math.abs(w1Grad) < 0.001 && Math.abs(w2Grad) < 0.001 && Math.abs(biasGrad) < 0.001) {
                    break;
                }
            }
            
            resolve({
                type: 'linear',
                w1: Math.max(-5, Math.min(5, w1)),
                w2: Math.max(-5, Math.min(5, w2)),
                bias: Math.max(-10, Math.min(10, bias))
            });
        });
    }
    
    optimizeQuadratic() {
        return new Promise((resolve) => {
            let w1 = parseFloat(this.w1Slider.value);
            let w2 = parseFloat(this.w2Slider.value);
            let bias = parseFloat(this.biasSlider.value);
            let w11 = 0.0;
            let w22 = 0.0;
            let w12 = 0.0;
            
            const learningRate = 0.05;
            const maxIterations = 1000;
            
            for (let iter = 0; iter < maxIterations; iter++) {
                let w1Grad = 0, w2Grad = 0, biasGrad = 0;
                let w11Grad = 0, w22Grad = 0, w12Grad = 0;
                
                this.dataPoints.forEach(point => {
                    const z = w1 * point.x1 + w2 * point.x2 + w11 * point.x1 * point.x1 + 
                             w22 * point.x2 * point.x2 + w12 * point.x1 * point.x2 + bias;
                    const prediction = this.sigmoid(z);
                    const error = prediction - point.y;
                    
                    w1Grad += error * point.x1;
                    w2Grad += error * point.x2;
                    w11Grad += error * point.x1 * point.x1;
                    w22Grad += error * point.x2 * point.x2;
                    w12Grad += error * point.x1 * point.x2;
                    biasGrad += error;
                });
                
                const n = this.dataPoints.length;
                w1Grad /= n; w2Grad /= n; biasGrad /= n;
                w11Grad /= n; w22Grad /= n; w12Grad /= n;
                
                w1 -= learningRate * w1Grad;
                w2 -= learningRate * w2Grad;
                w11 -= learningRate * w11Grad;
                w22 -= learningRate * w22Grad;
                w12 -= learningRate * w12Grad;
                bias -= learningRate * biasGrad;
                
                if (Math.abs(w1Grad) < 0.001 && Math.abs(w2Grad) < 0.001 && 
                    Math.abs(w11Grad) < 0.001 && Math.abs(w22Grad) < 0.001 && 
                    Math.abs(w12Grad) < 0.001 && Math.abs(biasGrad) < 0.001) {
                    break;
                }
            }
            
            resolve({
                type: 'quadratic',
                w1: Math.max(-5, Math.min(5, w1)),
                w2: Math.max(-5, Math.min(5, w2)),
                w11: Math.max(-2, Math.min(2, w11)),
                w22: Math.max(-2, Math.min(2, w22)),
                w12: Math.max(-2, Math.min(2, w12)),
                bias: Math.max(-10, Math.min(10, bias))
            });
        });
    }
    
    optimizeCircular() {
        return new Promise((resolve) => {
            // For circular boundaries, find the best center and radius
            let bestAccuracy = 0;
            let bestParams = {
                type: 'circular',
                w1: 0,
                w2: 0,
                bias: 0,
                radius: 2,
                centerX1: 0,
                centerX2: 0
            };
            
            // Try different centers
            for (let cx = -3; cx <= 3; cx += 0.5) {
                for (let cy = -3; cy <= 3; cy += 0.5) {
                    for (let r = 0.5; r <= 4; r += 0.3) {
                        const params = {
                            type: 'circular',
                            w1: 0, w2: 0, bias: 0,
                            radius: r,
                            centerX1: cx,
                            centerX2: cy
                        };
                        
                        const accuracy = this.calculateAccuracyWithParams(params);
                        if (accuracy > bestAccuracy) {
                            bestAccuracy = accuracy;
                            bestParams = params;
                        }
                    }
                }
            }
            
            resolve(bestParams);
        });
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
            // Add new data point using the selected class
            const selectedClass = parseInt(this.classToggle.value);
            this.dataPoints.push({ x1: dataCoords.x1, x2: dataCoords.x2, y: selectedClass });
            this.updateDisplay();
            this.draw();
        }
    }
    
    canvasToData(canvasX, canvasY) {
        // Convert canvas coordinates to data coordinates
        const x1 = this.x1Min + ((canvasX - this.plotX) / this.plotWidth) * (this.x1Max - this.x1Min);
        const x2 = this.x2Max - ((canvasY - this.plotY) / this.plotHeight) * (this.x2Max - this.x2Min);
        return { x1, x2 };
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
    new TwoDClassificationDemo();
});