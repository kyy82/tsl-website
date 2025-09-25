class AttentionDemo {
    constructor() {
        // DOM elements
        this.sequenceSelect = document.getElementById('sequence-select');
        this.randomizeWeightsBtn = document.getElementById('randomize-weights-btn');

        // Canvas elements
        this.qCanvas = document.getElementById('q-canvas');
        this.kCanvas = document.getElementById('k-canvas');
        this.vCanvas = document.getElementById('v-canvas');
        this.attentionCanvas = document.getElementById('attention-canvas');
        this.vAttentionCanvas = document.getElementById('v-attention-canvas');

        // Containers
        this.inputSequenceContainer = document.getElementById('input-sequence');
        this.outputSequenceContainer = document.getElementById('output-sequence');

        // Predefined sequences
        this.sequences = {
            'simple': ['The', 'cat', 'sat'],
            'greeting': ['Hello', 'world', 'today'],
            'question': ['What', 'is', 'attention'],
            'longer': ['The', 'quick', 'brown', 'fox', 'jumps']
        };

        // Demo state
        this.currentSequence = [];
        this.hoveredToken = null;
        this.hoveredOutputEmbedding = null;

        // Model parameters (fixed for clearer visualization)
        this.dModel = 4;
        this.dK = 4;
        this.seqLength = 0;

        // Matrices and computations
        this.inputEmbeddings = [];
        this.WQ = [];
        this.WK = [];
        this.WV = [];
        this.Q = [];
        this.K = [];
        this.V = [];
        this.scores = [];
        this.attentionWeights = [];
        this.output = [];

        this.setupEventListeners();
        this.initializeDemo();
    }

    setupEventListeners() {
        // Sequence selection
        this.sequenceSelect.addEventListener('change', (e) => {
            this.loadSequence(e.target.value);
        });


        // Control buttons
        this.randomizeWeightsBtn.addEventListener('click', () => this.randomizeWeights());

        // Token hovering only (no click selection)
        // Removed click selection functionality

        this.inputSequenceContainer.addEventListener('mouseover', (e) => {
            const token = e.target.closest('.token');
            if (token) {
                this.hoveredToken = parseInt(token.dataset.index);
                this.renderQKVMatrices();
            }
        });

        this.inputSequenceContainer.addEventListener('mouseleave', () => {
            this.hoveredToken = null;
            this.renderQKVMatrices();
        });
    }

    initializeDemo() {
        this.loadSequence('simple');
    }

    loadSequence(sequenceKey) {
        this.currentSequence = [...this.sequences[sequenceKey]];
        this.seqLength = this.currentSequence.length;
        this.initializeEmbeddings();
        this.initializeWeights();
        this.computeAllStages();
    }

    initializeEmbeddings() {
        // Create random embeddings for each token
        this.inputEmbeddings = [];
        for (let i = 0; i < this.seqLength; i++) {
            const embedding = [];
            for (let j = 0; j < this.dModel; j++) {
                embedding.push((Math.random() - 0.5) * 2); // Random values between -1 and 1
            }
            this.inputEmbeddings.push(embedding);
        }
    }

    initializeWeights() {
        // Initialize Q, K, V weight matrices
        this.WQ = this.createRandomMatrix(this.dModel, this.dK);
        this.WK = this.createRandomMatrix(this.dModel, this.dK);
        this.WV = this.createRandomMatrix(this.dModel, this.dModel);
    }

    createRandomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push((Math.random() - 0.5) * 2 / Math.sqrt(rows)); // Xavier initialization
            }
            matrix.push(row);
        }
        return matrix;
    }

    randomizeWeights() {
        this.initializeWeights();
        this.computeAllStages();
    }

    // Matrix multiplication
    matrixMultiply(A, B) {
        const rows = A.length;
        const cols = B[0].length;
        const shared = B.length;
        const result = [];

        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                let sum = 0;
                for (let k = 0; k < shared; k++) {
                    sum += A[i][k] * B[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        return result;
    }

    // Matrix transpose
    transpose(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = [];

        for (let j = 0; j < cols; j++) {
            const row = [];
            for (let i = 0; i < rows; i++) {
                row.push(matrix[i][j]);
            }
            result.push(row);
        }
        return result;
    }

    // Softmax function
    softmax(matrix) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
            const row = [...matrix[i]];
            const max = Math.max(...row);

            // Subtract max for numerical stability
            const shifted = row.map(x => x - max);
            const exponentials = shifted.map(x => Math.exp(x));
            const sum = exponentials.reduce((a, b) => a + b, 0);

            result.push(exponentials.map(x => x / sum));
        }
        return result;
    }

    computeQKV() {
        // Q = X * WQ, K = X * WK, V = X * WV
        this.Q = this.matrixMultiply(this.inputEmbeddings, this.WQ);
        this.K = this.matrixMultiply(this.inputEmbeddings, this.WK);
        this.V = this.matrixMultiply(this.inputEmbeddings, this.WV);
    }

    computeScores() {
        // Scores = Q * K^T / sqrt(d_k)
        const KT = this.transpose(this.K);
        const rawScores = this.matrixMultiply(this.Q, KT);
        const scale = 1 / Math.sqrt(this.dK);

        // Apply causal masking (lower triangular + diagonal)
        this.scores = rawScores.map((row, i) =>
            row.map((val, j) => {
                if (j <= i) {
                    return val * scale; // Keep lower triangle and diagonal
                } else {
                    return -Infinity; // Mask upper triangle for causal attention
                }
            })
        );
    }

    computeAttentionWeights() {
        // Apply softmax to scores
        this.attentionWeights = this.softmax(this.scores);
    }

    computeOutput() {
        // Output = AttentionWeights * V
        this.output = this.matrixMultiply(this.attentionWeights, this.V);
    }

    computeAllStages() {
        this.computeQKV();
        this.computeScores();
        this.computeAttentionWeights();
        this.computeOutput();
        this.renderAll();
    }

    renderAll() {
        this.renderInputSequence();
        this.renderQKVMatrices();
        this.renderAttentionWeights();
        this.renderOutput();
    }

    renderInputSequence() {
        this.inputSequenceContainer.innerHTML = '';

        this.currentSequence.forEach((token, index) => {
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token';
            tokenElement.dataset.index = index;

            const tokenText = document.createElement('div');
            tokenText.className = 'token-text';
            tokenText.textContent = token;

            const tokenEmbedding = document.createElement('div');
            tokenEmbedding.className = 'token-embedding';
            if (this.inputEmbeddings[index]) {
                const embStr = this.inputEmbeddings[index]
                    .map(val => val.toFixed(2))
                    .join(', ');
                tokenEmbedding.textContent = `[${embStr}]`;
            }

            tokenElement.appendChild(tokenText);
            tokenElement.appendChild(tokenEmbedding);
            this.inputSequenceContainer.appendChild(tokenElement);
        });
    }

    renderQKVMatrices() {
        this.renderMatrix(this.qCanvas, this.Q, 'Query');
        this.renderMatrix(this.kCanvas, this.K, 'Key');
        this.renderMatrix(this.vCanvas, this.V, 'Value');
    }

    renderMatrix(canvas, matrix, title) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (!matrix || matrix.length === 0) return;

        const rows = matrix.length;
        const cols = matrix[0].length;
        const cellWidth = width / cols;

        // Calculate cell height based on sequence length for better alignment
        // Token height is approximately 46px (40px min-height + 6px gap)
        const tokenHeight = 46;
        const cellHeight = Math.min(tokenHeight, (height - 40) / rows);
        const totalMatrixHeight = cellHeight * rows;
        const topPadding = (height - totalMatrixHeight) / 2;

        // Find min/max for color scaling
        const allValues = matrix.flat();
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = matrix[i][j];
                const intensity = range === 0 ? 0.5 : (value - minVal) / range;

                // Color based on matrix type
                let color;
                let alpha = 0.3 + intensity * 0.7;

                // Highlight row if this token is hovered
                if (this.hoveredToken === i) {
                    alpha = Math.min(1.0, alpha + 0.3);
                }

                // Highlight column if output embedding is hovered (for Values matrix, respecting causal attention)
                if (this.hoveredOutputEmbedding && title === 'Value' &&
                    j === this.hoveredOutputEmbedding.embeddingIndex &&
                    i <= this.hoveredOutputEmbedding.tokenIndex) {
                    alpha = Math.min(1.0, alpha + 0.3);
                }

                if (title === 'Query') {
                    color = `rgba(74, 144, 226, ${alpha})`;
                } else if (title === 'Key') {
                    color = `rgba(124, 179, 66, ${alpha})`;
                } else {
                    color = `rgba(244, 67, 54, ${alpha})`;
                }

                ctx.fillStyle = color;
                ctx.fillRect(j * cellWidth, topPadding + i * cellHeight, cellWidth, cellHeight);

                // Draw border - highlight if row is hovered or if column is hovered for Values (respecting causal attention)
                if (this.hoveredToken === i ||
                    (this.hoveredOutputEmbedding && title === 'Value' &&
                     j === this.hoveredOutputEmbedding.embeddingIndex &&
                     i <= this.hoveredOutputEmbedding.tokenIndex)) {
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 1;
                }
                ctx.strokeRect(j * cellWidth, topPadding + i * cellHeight, cellWidth, cellHeight);

                // Draw value if cell is large enough
                if (cellWidth > 25 && cellHeight > 15) {
                    ctx.fillStyle = intensity > 0.5 ? 'white' : 'black';
                    ctx.font = '14px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        value.toFixed(2),
                        j * cellWidth + cellWidth/2,
                        topPadding + i * cellHeight + cellHeight/2
                    );
                }
            }
        }
    }

    renderAttentionWeights() {
        this.renderHeatmap(this.attentionCanvas, this.attentionWeights, 'Attention Weights');
        this.renderMatrix(this.vAttentionCanvas, this.V, 'Value');
    }

    renderHeatmap(canvas, matrix, title) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (!matrix || matrix.length === 0) return;

        const size = matrix.length;

        // Reserve space for labels: 40px on top, 50px on left
        const topMargin = 40;
        const leftMargin = 50;
        const availableWidth = width - leftMargin;
        const availableHeight = height - topMargin;

        const cellSize = Math.min(availableWidth, availableHeight) / size;
        const startX = leftMargin + (availableWidth - cellSize * size) / 2;
        const startY = topMargin + (availableHeight - cellSize * size) / 2;

        // Find min/max for color scaling
        const allValues = matrix.flat();
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const value = matrix[i][j];

                // Check if this is a masked position (causal mask: j > i)
                if (value === 0 && j > i) {
                    // Masked area - show as grey
                    ctx.fillStyle = '#e0e0e0';
                } else {
                    // Valid attention weight - use heatmap colors
                    let intensity = range === 0 ? 0.5 : (value - minVal) / range;
                    let alpha = 0.3 + intensity * 0.7;

                    // Highlight row if output embedding is hovered (only for valid attention positions)
                    if (this.hoveredOutputEmbedding && i === this.hoveredOutputEmbedding.tokenIndex && j <= i) {
                        alpha = Math.min(1.0, alpha + 0.3);
                    }

                    ctx.fillStyle = `rgba(255, ${255 - intensity * 200}, ${255 - intensity * 255}, ${alpha})`;
                }

                ctx.fillRect(
                    startX + j * cellSize,
                    startY + i * cellSize,
                    cellSize,
                    cellSize
                );

                // No click highlighting - removed this functionality

                // Draw border - highlight if attention row is hovered for output embedding (only valid positions)
                if (this.hoveredOutputEmbedding && i === this.hoveredOutputEmbedding.tokenIndex && !(value === 0 && j > i)) {
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                }
                ctx.strokeRect(
                    startX + j * cellSize,
                    startY + i * cellSize,
                    cellSize,
                    cellSize
                );

                // Draw value
                if (cellSize > 30) {
                    if (value === 0 && j > i) {
                        // Masked cell - show X or leave empty
                        ctx.fillStyle = '#999';
                        ctx.font = '14px monospace';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            '×',
                            startX + j * cellSize + cellSize/2,
                            startY + i * cellSize + cellSize/2
                        );
                    } else {
                        // Valid attention weight
                        const intensity = range === 0 ? 0.5 : (value - minVal) / range;
                        ctx.fillStyle = intensity > 0.6 ? 'white' : 'black';
                        ctx.font = '14px monospace';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            value.toFixed(3),
                            startX + j * cellSize + cellSize/2,
                            startY + i * cellSize + cellSize/2
                        );
                    }
                }
            }
        }

        // Draw token labels
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';

        // Column labels (top) - what each token attends TO
        for (let j = 0; j < size; j++) {
            ctx.fillText(
                this.currentSequence[j],
                startX + j * cellSize + cellSize/2,
                startY - 5
            );
        }

        // Row labels (left) - which token is attending FROM
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < size; i++) {
            ctx.fillText(
                this.currentSequence[i],
                startX - 5,
                startY + i * cellSize + cellSize/2
            );
        }

    }

    renderOutput() {
        this.outputSequenceContainer.innerHTML = '';

        this.currentSequence.forEach((token, index) => {
            const tokenElement = document.createElement('div');
            tokenElement.className = 'token';

            const tokenText = document.createElement('div');
            tokenText.className = 'token-text';
            tokenText.textContent = token;

            const embeddingGrid = document.createElement('div');
            embeddingGrid.style.display = 'flex';
            embeddingGrid.style.marginTop = '5px';
            embeddingGrid.style.justifyContent = 'space-between';
            embeddingGrid.style.width = '100%';

            if (this.output[index]) {
                this.output[index].forEach((val, embIndex) => {
                    const embSquare = document.createElement('div');
                    embSquare.style.width = '60px';
                    embSquare.style.height = '30px';
                    embSquare.style.display = 'flex';
                    embSquare.style.alignItems = 'center';
                    embSquare.style.justifyContent = 'center';
                    embSquare.style.fontSize = '14px';
                    embSquare.style.fontFamily = 'monospace';
                    embSquare.style.border = '1px solid #ccc';
                    embSquare.style.borderRadius = '3px';
                    embSquare.style.cursor = 'pointer';
                    embSquare.style.transition = 'all 0.2s ease';

                    // Color based on value intensity using same scale as matrix visualization
                    const allValues = this.output[index];
                    const minVal = Math.min(...allValues);
                    const maxVal = Math.max(...allValues);
                    const range = maxVal - minVal;
                    const intensity = range === 0 ? 0.5 : (val - minVal) / range;
                    const alpha = 0.3 + intensity * 0.7;

                    embSquare.style.backgroundColor = `rgba(77, 190, 238, ${alpha})`;

                    embSquare.textContent = val.toFixed(2);

                    // Hover effects
                    embSquare.addEventListener('mouseenter', () => {
                        embSquare.style.transform = 'scale(1.1)';
                        embSquare.style.zIndex = '10';
                        embSquare.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

                        // Set hovered embedding for matrix highlighting
                        this.hoveredOutputEmbedding = { tokenIndex: index, embeddingIndex: embIndex };
                        this.renderAttentionWeights();
                    });

                    embSquare.addEventListener('mouseleave', () => {
                        embSquare.style.transform = 'scale(1)';
                        embSquare.style.zIndex = '1';
                        embSquare.style.boxShadow = 'none';

                        // Clear hovered embedding
                        this.hoveredOutputEmbedding = null;
                        this.renderAttentionWeights();
                    });

                    embeddingGrid.appendChild(embSquare);
                });
            }

            tokenElement.appendChild(tokenText);
            tokenElement.appendChild(embeddingGrid);
            this.outputSequenceContainer.appendChild(tokenElement);
        });
    }

    // Removed selectToken method - no longer needed
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AttentionDemo();
});