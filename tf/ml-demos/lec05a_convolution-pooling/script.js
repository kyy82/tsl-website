class ConvolutionPoolingDemo {
    constructor() {
        // Canvas elements
        this.inputCanvas = document.getElementById('input-canvas');
        this.convCanvas = document.getElementById('conv-canvas');
        this.poolCanvas = document.getElementById('pool-canvas');
        this.filterCanvas = document.getElementById('filter-canvas');

        // Contexts
        this.inputCtx = this.inputCanvas.getContext('2d');
        this.convCtx = this.convCanvas.getContext('2d');
        this.poolCtx = this.poolCanvas.getContext('2d');
        this.filterCtx = this.filterCanvas.getContext('2d');

        // Controls
        this.inputSelect = document.getElementById('input-select');
        this.filterSelect = document.getElementById('filter-select');
        this.poolingSelect = document.getElementById('pooling-select');
        this.poolingSizeSlider = document.getElementById('pooling-size');
        this.poolingSizeDisplay = document.getElementById('pooling-size-display');

        // Filter editor
        this.filterEditor = document.getElementById('filter-editor');
        this.filterInputs = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.filterInputs.push(document.getElementById(`f${i}${j}`));
            }
        }

        // Data
        this.inputImage = [];
        this.currentFilter = [];
        this.convOutput = [];
        this.poolOutput = [];
        this.imageSize = 8;
        this.filterSize = 3;

        // Highlighting state
        this.highlightedCells = {
            input: [],
            conv: [],
            pool: []
        };


        // Predefined filters
        this.filters = {
            'edge-vertical': [
                [-1, 0, 1],
                [-2, 0, 2],
                [-1, 0, 1]
            ],
            'edge-horizontal': [
                [-1, -2, -1],
                [0, 0, 0],
                [1, 2, 1]
            ],
            'blur': [
                [1/9, 1/9, 1/9],
                [1/9, 1/9, 1/9],
                [1/9, 1/9, 1/9]
            ],
            'sharpen': [
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ]
        };

        // Predefined input patterns
        this.inputPatterns = {
            'simple': this.createSimplePattern(),
            'vertical-edges': this.createVerticalEdgePattern(),
            'horizontal-edges': this.createHorizontalEdgePattern(),
            'checkerboard': this.createCheckerboard(),
            'gradient': this.createGradient()
        };

        this.setupEventListeners();
        this.setupCanvasInteractivity();
        this.initializeDemo();
    }

    setupEventListeners() {
        this.inputSelect.addEventListener('change', () => this.updateInput());
        this.filterSelect.addEventListener('change', () => this.updateFilter());
        this.poolingSelect.addEventListener('change', () => this.updatePooling());
        this.poolingSizeSlider.addEventListener('input', () => this.updatePoolingSize());

        // Filter editor inputs
        this.filterInputs.forEach(input => {
            input.addEventListener('input', () => this.updateCustomFilter());
        });
    }

    setupCanvasInteractivity() {
        // Add hover events for convolution output
        this.convCanvas.addEventListener('mousemove', (e) => {
            const rect = this.convCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleConvolutionHover(x, y);
        });

        this.convCanvas.addEventListener('mouseleave', () => {
            this.clearHighlighting();
        });

        // Add hover events for pooling output
        this.poolCanvas.addEventListener('mousemove', (e) => {
            const rect = this.poolCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePoolingHover(x, y);
        });

        this.poolCanvas.addEventListener('mouseleave', () => {
            this.clearHighlighting();
        });
    }

    handleConvolutionHover(x, y) {
        if (!this.convOutput || this.convOutput.length === 0) return;

        const convSize = this.convOutput.length;
        const cellWidth = this.convCanvas.width / convSize;
        const cellHeight = this.convCanvas.height / convSize;

        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);

        if (row >= 0 && row < convSize && col >= 0 && col < convSize) {
            // Clear previous highlighting
            this.clearHighlighting();

            // Highlight the convolution cell
            this.highlightedCells.conv = [{row, col}];

            // Highlight the corresponding 3x3 region in input
            this.highlightedCells.input = [];
            for (let i = 0; i < this.filterSize; i++) {
                for (let j = 0; j < this.filterSize; j++) {
                    this.highlightedCells.input.push({
                        row: row + i,
                        col: col + j
                    });
                }
            }

            this.updateVisualization();
        }
    }

    handlePoolingHover(x, y) {
        if (!this.poolOutput || this.poolOutput.length === 0) return;

        const poolSize = this.poolOutput.length;
        const cellWidth = this.poolCanvas.width / poolSize;
        const cellHeight = this.poolCanvas.height / poolSize;

        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);

        if (row >= 0 && row < poolSize && col >= 0 && col < poolSize) {
            // Clear previous highlighting
            this.clearHighlighting();

            // Highlight the pooling cell
            this.highlightedCells.pool = [{row, col}];

            // Highlight the corresponding region in convolution output
            const poolingSize = parseInt(this.poolingSizeSlider.value);
            this.highlightedCells.conv = [];
            for (let i = 0; i < poolingSize; i++) {
                for (let j = 0; j < poolingSize; j++) {
                    const convRow = row * poolingSize + i;
                    const convCol = col * poolingSize + j;
                    if (convRow < this.convOutput.length && convCol < this.convOutput[0].length) {
                        this.highlightedCells.conv.push({
                            row: convRow,
                            col: convCol
                        });
                    }
                }
            }

            this.updateVisualization();
        }
    }

    clearHighlighting() {
        this.highlightedCells.input = [];
        this.highlightedCells.conv = [];
        this.highlightedCells.pool = [];
        this.updateVisualization();
    }

    initializeDemo() {
        // Initialize with default filter first
        this.currentFilter = this.filters['edge-vertical'];

        this.updateInput();
        this.updateFilter();
        this.updatePoolingSize();
        this.performConvolution();
        this.performPooling();
        this.updateVisualization();
    }

    createSimplePattern() {
        const pattern = [];
        for (let i = 0; i < this.imageSize; i++) {
            pattern[i] = [];
            for (let j = 0; j < this.imageSize; j++) {
                // Create a simple cross pattern
                if (i === Math.floor(this.imageSize/2) || j === Math.floor(this.imageSize/2)) {
                    pattern[i][j] = 1;
                } else {
                    pattern[i][j] = 0;
                }
            }
        }
        return pattern;
    }

    createVerticalEdgePattern() {
        const pattern = [];
        for (let i = 0; i < this.imageSize; i++) {
            pattern[i] = [];
            for (let j = 0; j < this.imageSize; j++) {
                // Create vertical edges
                if (j < this.imageSize/2) {
                    pattern[i][j] = 0;
                } else {
                    pattern[i][j] = 1;
                }
            }
        }
        return pattern;
    }

    createHorizontalEdgePattern() {
        const pattern = [];
        for (let i = 0; i < this.imageSize; i++) {
            pattern[i] = [];
            for (let j = 0; j < this.imageSize; j++) {
                // Create horizontal edges
                if (i < this.imageSize/2) {
                    pattern[i][j] = 0;
                } else {
                    pattern[i][j] = 1;
                }
            }
        }
        return pattern;
    }

    createCheckerboard() {
        const pattern = [];
        for (let i = 0; i < this.imageSize; i++) {
            pattern[i] = [];
            for (let j = 0; j < this.imageSize; j++) {
                pattern[i][j] = (i + j) % 2;
            }
        }
        return pattern;
    }

    createGradient() {
        const pattern = [];
        for (let i = 0; i < this.imageSize; i++) {
            pattern[i] = [];
            for (let j = 0; j < this.imageSize; j++) {
                pattern[i][j] = j / (this.imageSize - 1);
            }
        }
        return pattern;
    }

    updateInput() {
        const selectedPattern = this.inputSelect.value;
        this.inputImage = this.inputPatterns[selectedPattern];
        this.performConvolution();
        this.performPooling();
        this.updateVisualization();
    }

    updateFilter() {
        const selectedFilter = this.filterSelect.value;

        if (selectedFilter === 'custom') {
            this.filterEditor.style.display = 'block';
            this.updateCustomFilter();
        } else {
            this.filterEditor.style.display = 'none';
            this.currentFilter = this.filters[selectedFilter];
        }

        this.performConvolution();
        this.performPooling();
        this.updateVisualization();
    }

    updateCustomFilter() {
        this.currentFilter = [];
        for (let i = 0; i < 3; i++) {
            this.currentFilter[i] = [];
            for (let j = 0; j < 3; j++) {
                const input = this.filterInputs[i * 3 + j];
                this.currentFilter[i][j] = parseFloat(input.value) || 0;
            }
        }

        if (this.filterSelect.value === 'custom') {
            this.performConvolution();
            this.performPooling();
            this.updateVisualization();
        }
    }

    updatePooling() {
        this.performPooling();
        this.updateVisualization();
    }

    updatePoolingSize() {
        const size = parseInt(this.poolingSizeSlider.value);
        this.poolingSizeDisplay.textContent = `${size}×${size}`;
        this.performPooling();
        this.updateVisualization();
    }

    performConvolution() {
        if (!this.currentFilter || !this.inputImage) return;

        const inputSize = this.imageSize;
        const filterSize = this.filterSize;
        const outputSize = inputSize - filterSize + 1;

        this.convOutput = [];

        for (let i = 0; i < outputSize; i++) {
            this.convOutput[i] = [];
            for (let j = 0; j < outputSize; j++) {
                let sum = 0;

                // Perform convolution operation
                for (let fi = 0; fi < filterSize; fi++) {
                    for (let fj = 0; fj < filterSize; fj++) {
                        const inputRow = i + fi;
                        const inputCol = j + fj;
                        sum += this.inputImage[inputRow][inputCol] * this.currentFilter[fi][fj];
                    }
                }

                this.convOutput[i][j] = sum;
            }
        }
    }

    performPooling() {
        if (!this.convOutput || this.convOutput.length === 0) return;

        const poolSize = parseInt(this.poolingSizeSlider.value);
        const poolType = this.poolingSelect.value;
        const inputSize = this.convOutput.length;
        const outputSize = Math.floor(inputSize / poolSize);

        this.poolOutput = [];

        for (let i = 0; i < outputSize; i++) {
            this.poolOutput[i] = [];
            for (let j = 0; j < outputSize; j++) {
                const values = [];

                // Collect values from pooling window
                for (let pi = 0; pi < poolSize; pi++) {
                    for (let pj = 0; pj < poolSize; pj++) {
                        const row = i * poolSize + pi;
                        const col = j * poolSize + pj;
                        if (row < inputSize && col < inputSize) {
                            values.push(this.convOutput[row][col]);
                        }
                    }
                }

                // Apply pooling operation
                if (poolType === 'max') {
                    this.poolOutput[i][j] = Math.max(...values);
                } else { // average
                    const sum = values.reduce((a, b) => a + b, 0);
                    this.poolOutput[i][j] = sum / values.length;
                }
            }
        }
    }

    updateVisualization() {
        // Use fixed range from -5 to 5 for consistent color mapping
        const fixedMin = -5;
        const fixedMax = 5;

        this.drawMatrix(this.inputCtx, this.inputImage, this.inputCanvas.width, this.inputCanvas.height, this.highlightedCells.input, fixedMin, fixedMax);
        this.drawMatrix(this.convCtx, this.convOutput, this.convCanvas.width, this.convCanvas.height, this.highlightedCells.conv, fixedMin, fixedMax);
        this.drawMatrix(this.poolCtx, this.poolOutput, this.poolCanvas.width, this.poolCanvas.height, this.highlightedCells.pool, fixedMin, fixedMax);
        this.drawFilter(this.filterCtx, this.currentFilter, this.filterCanvas.width, this.filterCanvas.height, fixedMin, fixedMax);
    }

    valueToColor(value, minVal = -5, maxVal = 5) {
        // Clamp value to the range
        const clampedValue = Math.max(minVal, Math.min(maxVal, value));

        if (clampedValue === 0) {
            return 'rgb(255, 255, 255)'; // White for 0
        } else if (clampedValue < 0) {
            // Negative values: interpolate from white to custom orange-red with logarithmic scaling
            const x = Math.abs(clampedValue); // 0 to 5
            // Use c * log(1 + x) with c = 1/log(4)
            const c = 1 / Math.log(4);
            const intensity = c * Math.log(1 + x);
            // Target color: [0.8500, 0.3250, 0.0980] in 0-1 scale
            const targetRed = 0.8500 * 255;
            const targetGreen = 0.3250 * 255;
            const targetBlue = 0.0980 * 255;
            const red = Math.floor(255 * (1 - intensity) + targetRed * intensity);
            const green = Math.floor(255 * (1 - intensity) + targetGreen * intensity);
            const blue = Math.floor(255 * (1 - intensity) + targetBlue * intensity);
            return `rgb(${red}, ${green}, ${blue})`;
        } else {
            // Positive values: interpolate from white to custom blue with logarithmic scaling
            const x = clampedValue; // 0 to 5
            // Use c * log(1 + x) with c = 1/log(4)
            const c = 1 / Math.log(4);
            const intensity = c * Math.log(1 + x);
            // Target color: [0, 0.4470, 0.7410] in 0-1 scale
            const targetRed = 0 * 255;
            const targetGreen = 0.4470 * 255;
            const targetBlue = 0.7410 * 255;
            const red = Math.floor(255 * (1 - intensity) + targetRed * intensity);
            const green = Math.floor(255 * (1 - intensity) + targetGreen * intensity);
            const blue = Math.floor(255 * (1 - intensity) + targetBlue * intensity);
            return `rgb(${red}, ${green}, ${blue})`;
        }
    }

    getTextColor(value, minVal = -5, maxVal = 5) {
        const clampedValue = Math.max(minVal, Math.min(maxVal, value));
        const absValue = Math.abs(clampedValue);
        const maxRange = Math.max(Math.abs(minVal), Math.abs(maxVal));

        // Use black text for light colors (near 0), white text for dark colors (near extremes)
        if (absValue / maxRange < 0.5) {
            return '#000'; // Black text for light colors
        } else {
            return '#fff'; // White text for dark colors
        }
    }

    drawMatrix(ctx, matrix, width, height, highlightedCells = [], globalMin = null, globalMax = null) {
        if (!matrix || matrix.length === 0) return;

        ctx.clearRect(0, 0, width, height);

        const rows = matrix.length;
        const cols = matrix[0].length;
        const cellWidth = width / cols;
        const cellHeight = height / rows;

        // Use global range if provided, otherwise calculate local range
        let minVal, maxVal;
        if (globalMin !== null && globalMax !== null) {
            minVal = globalMin;
            maxVal = globalMax;
        } else {
            minVal = Infinity;
            maxVal = -Infinity;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    minVal = Math.min(minVal, matrix[i][j]);
                    maxVal = Math.max(maxVal, matrix[i][j]);
                }
            }
        }

        const range = maxVal - minVal;

        // Create a set of highlighted cells for quick lookup
        const highlightSet = new Set();
        highlightedCells.forEach(cell => {
            highlightSet.add(`${cell.row},${cell.col}`);
        });

        // Draw all cells first
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = matrix[i][j];

                // Use color mapping instead of grayscale
                ctx.fillStyle = this.valueToColor(value, minVal, maxVal);

                ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

                // Draw normal cell borders
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

                // Draw value text (use black for light colors, white for dark colors)
                const textColor = this.getTextColor(value, minVal, maxVal);
                ctx.fillStyle = textColor;
                ctx.font = `${Math.min(cellWidth, cellHeight) * 0.3}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    value.toFixed(1),
                    j * cellWidth + cellWidth / 2,
                    i * cellHeight + cellHeight / 2
                );
            }
        }

        // Draw red outline around highlighted region
        if (highlightedCells.length > 0) {
            this.drawHighlightOutline(ctx, highlightedCells, cellWidth, cellHeight);
        }
    }

    drawHighlightOutline(ctx, highlightedCells, cellWidth, cellHeight) {
        // Create a set for quick lookup
        const highlightSet = new Set();
        highlightedCells.forEach(cell => {
            highlightSet.add(`${cell.row},${cell.col}`);
        });

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;

        // For each highlighted cell, draw only the outer borders
        highlightedCells.forEach(cell => {
            const { row, col } = cell;
            const x = col * cellWidth;
            const y = row * cellHeight;

            // Check each edge and draw if it's an outer edge
            // Top edge
            if (!highlightSet.has(`${row - 1},${col}`)) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cellWidth, y);
                ctx.stroke();
            }

            // Right edge
            if (!highlightSet.has(`${row},${col + 1}`)) {
                ctx.beginPath();
                ctx.moveTo(x + cellWidth, y);
                ctx.lineTo(x + cellWidth, y + cellHeight);
                ctx.stroke();
            }

            // Bottom edge
            if (!highlightSet.has(`${row + 1},${col}`)) {
                ctx.beginPath();
                ctx.moveTo(x, y + cellHeight);
                ctx.lineTo(x + cellWidth, y + cellHeight);
                ctx.stroke();
            }

            // Left edge
            if (!highlightSet.has(`${row},${col - 1}`)) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cellHeight);
                ctx.stroke();
            }
        });
    }

    drawFilter(ctx, filter, width, height, minVal = -5, maxVal = 5) {
        if (!filter) return;

        ctx.clearRect(0, 0, width, height);

        const cellWidth = width / 3;
        const cellHeight = height / 3;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const value = filter[i][j];

                // Use the same color scheme as the matrices
                ctx.fillStyle = this.valueToColor(value, minVal, maxVal);

                ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

                // Draw borders
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);

                // Draw value text with appropriate color
                ctx.fillStyle = this.getTextColor(value, minVal, maxVal);
                ctx.font = `${Math.min(cellWidth, cellHeight) * 0.25}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    value.toFixed(2),
                    j * cellWidth + cellWidth / 2,
                    i * cellHeight + cellHeight / 2
                );
            }
        }
    }


}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ConvolutionPoolingDemo();
});