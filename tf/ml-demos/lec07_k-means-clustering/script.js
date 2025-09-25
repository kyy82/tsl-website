class KMeansDemo {
    constructor() {
        // DOM elements
        this.canvas = document.getElementById('plot');
        this.ctx = this.canvas.getContext('2d');
        this.kSlider = document.getElementById('k-clusters');
        this.kValue = document.getElementById('k-value');
        this.stepBtn = document.getElementById('step-btn');
        this.finalBtn = document.getElementById('final-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.generateDataBtn = document.getElementById('generate-data-btn');
        this.showDistancesCheckbox = document.getElementById('show-distances');
        this.addDataModeCheckbox = document.getElementById('add-data-mode');
        this.iterationDisplay = document.getElementById('iteration-display');
        this.statusDisplay = document.getElementById('status-display');
        this.pointsCount = document.getElementById('points-count');

        // Setup high-DPI canvas
        this.setupHighDPICanvas();

        // Plot dimensions and scaling
        this.plotWidth = this.displayWidth - 80;
        this.plotHeight = this.displayHeight - 80;
        this.plotX = 40;
        this.plotY = 40;

        // Data range
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -5;
        this.yMax = 5;

        // Algorithm state
        this.k = 3;
        this.dataPoints = [];
        this.centroids = [];
        this.assignments = [];
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;

        // Centroid history for smart add/remove
        this.centroidHistory = []; // Stack of removed centroids (LIFO)
        this.addedCentroids = []; // Track order of added centroids

        // Hover and drag state
        this.hoveredCentroid = null;
        this.draggedCentroid = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStarted = false; // Track if actual dragging occurred
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Colors for clusters (up to 10 clusters)
        this.clusterColors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#34495e', '#e67e22', '#8e44ad', '#16a085'
        ];

        // Initialize
        this.setupEventListeners();
        this.generateInitialData();
        this.initializeCentroids();
        this.render();
    }

    setupHighDPICanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;

        this.displayWidth = rect.width;
        this.displayHeight = rect.height;

        this.canvas.width = this.displayWidth * devicePixelRatio;
        this.canvas.height = this.displayHeight * devicePixelRatio;

        this.ctx.scale(devicePixelRatio, devicePixelRatio);

        this.canvas.style.width = this.displayWidth + 'px';
        this.canvas.style.height = this.displayHeight + 'px';
    }

    setupEventListeners() {
        // K slider
        this.kSlider.addEventListener('input', (e) => {
            const newK = parseInt(e.target.value);
            this.updateK(newK);
            this.kValue.textContent = this.k;
        });

        // Control buttons
        this.stepBtn.addEventListener('click', () => this.stepForward());
        this.finalBtn.addEventListener('click', () => this.runToCompletion());
        this.resetBtn.addEventListener('click', () => this.resetTraining());
        this.generateDataBtn.addEventListener('click', () => this.generateNewData());

        // Distance visualization toggle
        this.showDistancesCheckbox.addEventListener('change', () => {
            this.render();
        });

        // Add data mode toggle
        this.addDataModeCheckbox.addEventListener('change', () => {
            // Update cursor based on new state
            if (!this.isRunning && !this.isDragging) {
                const centroidIndex = this.getCentroidAtPosition(
                    this.lastMouseX || 0,
                    this.lastMouseY || 0
                );
                if (centroidIndex !== null) {
                    this.canvas.style.cursor = 'grab';
                } else {
                    this.canvas.style.cursor = this.addDataModeCheckbox.checked ? 'crosshair' : 'default';
                }
            }
        });

        // Canvas mouse events for dragging and clicking
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning && !this.dragStarted && this.addDataModeCheckbox.checked) {
                this.addDataPoint(e);
            }
            // Reset dragStarted flag after handling click
            this.dragStarted = false;
        });


        // Mouse leave to clear hover state
        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoveredCentroid !== null) {
                this.hoveredCentroid = null;
                this.render();
            }
        });
    }

    generateInitialData() {
        this.dataPoints = [];
        // Generate 20 random points
        for (let i = 0; i < 20; i++) {
            this.dataPoints.push({
                x: Math.random() * (this.xMax - this.xMin) + this.xMin,
                y: Math.random() * (this.yMax - this.yMin) + this.yMin
            });
        }
        this.updatePointsCount();
    }

    initializeCentroids() {
        this.centroids = [];
        this.centroidHistory = [];
        this.addedCentroids = [];

        for (let i = 0; i < this.k; i++) {
            this.centroids.push({
                x: Math.random() * (this.xMax - this.xMin) + this.xMin,
                y: Math.random() * (this.yMax - this.yMin) + this.yMin
            });
        }
        this.assignments = new Array(this.dataPoints.length).fill(0);
    }

    updateK(newK) {
        const oldK = this.k;
        this.k = newK;

        if (newK > oldK) {
            // Add centroids (restore from history first, then create new ones)
            for (let i = oldK; i < newK; i++) {
                if (this.centroidHistory.length > 0) {
                    // Restore previously removed centroid
                    const restoredCentroid = this.centroidHistory.pop();
                    this.centroids.push(restoredCentroid);
                } else {
                    // Create new centroid and track it
                    const newCentroid = {
                        x: Math.random() * (this.xMax - this.xMin) + this.xMin,
                        y: Math.random() * (this.yMax - this.yMin) + this.yMin
                    };
                    this.centroids.push(newCentroid);
                    this.addedCentroids.push(newCentroid);
                }
            }
        } else if (newK < oldK) {
            // Remove centroids (last added first)
            for (let i = oldK; i > newK; i--) {
                let removedCentroid;

                // Try to remove from recently added centroids first
                if (this.addedCentroids.length > 0) {
                    const lastAdded = this.addedCentroids.pop();
                    const addedIndex = this.centroids.findIndex(c => c === lastAdded);
                    if (addedIndex !== -1) {
                        removedCentroid = this.centroids.splice(addedIndex, 1)[0];
                    }
                }

                // If no recently added centroids, remove the last centroid
                if (!removedCentroid) {
                    removedCentroid = this.centroids.pop();
                }

                // Store removed centroid in history for potential restoration
                this.centroidHistory.push(removedCentroid);
            }
        }

        // Reset training state but keep data
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;
        this.iterationDisplay.textContent = '0';
        this.statusDisplay.textContent = 'Ready';

        // Update assignments array - preserve valid assignments, reassign invalid ones
        for (let i = 0; i < this.assignments.length; i++) {
            // If assignment is invalid (>= newK), reassign to nearest centroid
            if (this.assignments[i] >= newK) {
                // Find nearest centroid for this point
                const point = this.dataPoints[i];
                let minDistance = Infinity;
                let nearestCentroid = 0;

                for (let j = 0; j < newK; j++) {
                    const distance = this.euclideanDistance(point, this.centroids[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCentroid = j;
                    }
                }
                this.assignments[i] = nearestCentroid;
            }
            // Valid assignments (< newK) remain unchanged
        }

        this.render();
    }

    handleMouseDown(event) {
        if (this.isRunning) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // Check if clicking on a centroid
        const centroidIndex = this.getCentroidAtPosition(canvasX, canvasY);
        if (centroidIndex !== null) {
            this.isDragging = true;
            this.draggedCentroid = centroidIndex;
            this.dragStarted = false; // Reset drag started flag

            // Calculate offset from centroid center to mouse position
            const centroid = this.centroids[centroidIndex];
            const centroidCanvasX = this.dataToCanvasX(centroid.x);
            const centroidCanvasY = this.dataToCanvasY(centroid.y);

            this.dragOffset.x = canvasX - centroidCanvasX;
            this.dragOffset.y = canvasY - centroidCanvasY;

            this.canvas.style.cursor = 'grabbing';
            event.preventDefault(); // Prevent text selection
        }
    }

    handleMouseMove(event) {
        if (this.isRunning) {
            this.canvas.style.cursor = 'default';
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // Track mouse position for cursor updates
        this.lastMouseX = canvasX;
        this.lastMouseY = canvasY;

        if (this.isDragging && this.draggedCentroid !== null) {
            // Handle dragging
            this.dragStarted = true; // Mark that actual dragging has occurred

            const dataX = this.canvasToDataX(canvasX - this.dragOffset.x);
            const dataY = this.canvasToDataY(canvasY - this.dragOffset.y);

            // Constrain to plot bounds
            const constrainedX = Math.max(this.xMin, Math.min(this.xMax, dataX));
            const constrainedY = Math.max(this.yMin, Math.min(this.yMax, dataY));

            // Update centroid position
            this.centroids[this.draggedCentroid].x = constrainedX;
            this.centroids[this.draggedCentroid].y = constrainedY;

            // If we've started clustering, reset convergence and reassign points
            if (this.iteration > 0) {
                this.converged = false;
                this.statusDisplay.textContent = 'Ready';
                this.assignPoints(); // Reassign all points to nearest centroids
            }

            this.render();
        } else {
            // Handle hovering
            const centroidIndex = this.getCentroidAtPosition(canvasX, canvasY);

            if (centroidIndex !== null) {
                this.canvas.style.cursor = 'grab';
                if (this.hoveredCentroid !== centroidIndex) {
                    this.hoveredCentroid = centroidIndex;
                    this.render();
                }
            } else {
                // Set cursor based on whether adding data is enabled
                this.canvas.style.cursor = this.addDataModeCheckbox.checked ? 'crosshair' : 'default';
                if (this.hoveredCentroid !== null) {
                    this.hoveredCentroid = null;
                    this.render();
                }
            }
        }
    }

    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedCentroid = null;
            this.canvas.style.cursor = this.addDataModeCheckbox.checked ? 'crosshair' : 'default';

            // Update hover state for current mouse position
            const rect = this.canvas.getBoundingClientRect();
            const canvasX = event.clientX - rect.left;
            const canvasY = event.clientY - rect.top;
            const centroidIndex = this.getCentroidAtPosition(canvasX, canvasY);

            if (centroidIndex !== null) {
                this.canvas.style.cursor = 'grab';
                this.hoveredCentroid = centroidIndex;
            } else {
                this.hoveredCentroid = null;
            }

            this.render();
        }
    }

    getCentroidAtPosition(canvasX, canvasY) {
        for (let i = 0; i < this.centroids.length; i++) {
            const centroid = this.centroids[i];
            const centroidCanvasX = this.dataToCanvasX(centroid.x);
            const centroidCanvasY = this.dataToCanvasY(centroid.y);

            // Check if mouse is within centroid radius (8px + some tolerance)
            const distance = Math.sqrt(
                Math.pow(canvasX - centroidCanvasX, 2) +
                Math.pow(canvasY - centroidCanvasY, 2)
            );

            if (distance <= 12) { // 8px centroid radius + 4px tolerance
                return i;
            }
        }
        return null;
    }

    addDataPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // Convert canvas coordinates to data coordinates
        const dataX = this.canvasToDataX(canvasX);
        const dataY = this.canvasToDataY(canvasY);

        // Check if click is within plot area
        if (dataX >= this.xMin && dataX <= this.xMax &&
            dataY >= this.yMin && dataY <= this.yMax) {

            this.dataPoints.push({ x: dataX, y: dataY });
            this.assignments.push(0);
            this.updatePointsCount();

            // If we've started clustering, assign the new point
            if (this.iteration > 0) {
                this.assignPoint(this.dataPoints.length - 1);
            }

            // If the algorithm was converged, reset convergence status to allow further training
            if (this.converged) {
                this.converged = false;
                this.statusDisplay.textContent = 'Ready';
            }

            this.render();
        }
    }

    stepForward() {
        if (this.converged) return;

        const oldCentroids = this.centroids.map(c => ({ ...c }));

        // Assignment step: assign each point to nearest centroid
        this.assignPoints();

        // Update step: move centroids to cluster centers
        this.updateCentroids();

        this.iteration++;
        this.iterationDisplay.textContent = this.iteration;

        // Check convergence
        this.checkConvergence(oldCentroids);

        this.render();
    }

    assignPoints() {
        for (let i = 0; i < this.dataPoints.length; i++) {
            this.assignPoint(i);
        }
    }

    assignPoint(pointIndex) {
        const point = this.dataPoints[pointIndex];
        let minDistance = Infinity;
        let nearestCentroid = 0;

        for (let j = 0; j < this.centroids.length; j++) {
            const distance = this.euclideanDistance(point, this.centroids[j]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCentroid = j;
            }
        }

        this.assignments[pointIndex] = nearestCentroid;
    }

    updateCentroids() {
        for (let i = 0; i < this.k; i++) {
            const clusterPoints = this.dataPoints.filter((_, idx) => this.assignments[idx] === i);

            if (clusterPoints.length > 0) {
                const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
                const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);

                this.centroids[i] = {
                    x: sumX / clusterPoints.length,
                    y: sumY / clusterPoints.length
                };
            }
        }
    }

    checkConvergence(oldCentroids) {
        const threshold = 0.01;
        let maxMovement = 0;

        for (let i = 0; i < this.k; i++) {
            const movement = this.euclideanDistance(this.centroids[i], oldCentroids[i]);
            maxMovement = Math.max(maxMovement, movement);
        }

        this.converged = maxMovement < threshold;
        this.statusDisplay.textContent = this.converged ? 'Converged' : 'Running';
    }

    runToCompletion() {
        // If already converged, do nothing
        if (this.converged) {
            return;
        }

        this.isRunning = true;
        this.statusDisplay.textContent = 'Running to completion...';

        const runStep = () => {
            if (!this.converged) {
                this.stepForward();
                if (!this.converged) {
                    setTimeout(runStep, 200); // 200ms delay between steps
                } else {
                    this.isRunning = false;
                }
            } else {
                this.isRunning = false;
            }
        };

        runStep();
    }

    resetTraining() {
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;
        this.iterationDisplay.textContent = '0';
        this.statusDisplay.textContent = 'Ready';

        this.initializeCentroids();
        this.render();
    }

    generateNewData() {
        this.generateInitialData();
        // Clear centroid history when generating new data
        this.centroidHistory = [];
        this.addedCentroids = [];
        this.initializeCentroids();
        this.resetTraining();
    }

    reset() {
        this.iteration = 0;
        this.converged = false;
        this.isRunning = false;
        this.iterationDisplay.textContent = '0';
        this.statusDisplay.textContent = 'Ready';

        this.generateInitialData();
        this.initializeCentroids();
        this.render();
    }

    euclideanDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    updatePointsCount() {
        this.pointsCount.textContent = this.dataPoints.length;
    }

    // Coordinate transformation functions
    dataToCanvasX(dataX) {
        return this.plotX + (dataX - this.xMin) * (this.plotWidth / (this.xMax - this.xMin));
    }

    dataToCanvasY(dataY) {
        return this.plotY + (this.yMax - dataY) * (this.plotHeight / (this.yMax - this.yMin));
    }

    canvasToDataX(canvasX) {
        return this.xMin + (canvasX - this.plotX) * (this.xMax - this.xMin) / this.plotWidth;
    }

    canvasToDataY(canvasY) {
        return this.yMax - (canvasY - this.plotY) * (this.yMax - this.yMin) / this.plotHeight;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

        // Draw grid
        this.drawGrid();

        // Draw axes
        this.drawAxes();

        // Draw data points
        this.drawDataPoints();

        // Draw dotted lines for hovered centroid
        this.drawClusterLines();

        // Draw centroids
        this.drawCentroids();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // Vertical grid lines
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            const canvasX = this.dataToCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, this.plotY);
            this.ctx.lineTo(canvasX, this.plotY + this.plotHeight);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            const canvasY = this.dataToCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.plotX, canvasY);
            this.ctx.lineTo(this.plotX + this.plotWidth, canvasY);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        // X-axis
        const y0 = this.dataToCanvasY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(this.plotX, y0);
        this.ctx.lineTo(this.plotX + this.plotWidth, y0);
        this.ctx.stroke();

        // Y-axis
        const x0 = this.dataToCanvasX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, this.plotY);
        this.ctx.lineTo(x0, this.plotY + this.plotHeight);
        this.ctx.stroke();

        // Axis labels
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('X', this.plotX + this.plotWidth - 10, y0 - 5);
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Y', x0 + 5, this.plotY + 15);
    }

    drawDataPoints() {
        this.dataPoints.forEach((point, index) => {
            const canvasX = this.dataToCanvasX(point.x);
            const canvasY = this.dataToCanvasY(point.y);
            const clusterIndex = this.assignments[index] || 0;
            const color = this.clusterColors[clusterIndex % this.clusterColors.length];

            // Draw hollow circle
            this.ctx.strokeStyle = color;
            this.ctx.fillStyle = 'white';
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    drawClusterLines() {
        // If checkbox is checked, show all distance lines
        // If checkbox is unchecked, only show lines when hovering over a centroid
        const showAllLines = this.showDistancesCheckbox.checked;
        const showHoverLines = !showAllLines && this.hoveredCentroid !== null;

        if (!showAllLines && !showHoverLines) return;

        // Set up dotted line style
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]); // 5px dashes, 5px gaps

        if (showAllLines) {
            // Show lines for all clusters
            for (let centroidIndex = 0; centroidIndex < this.centroids.length; centroidIndex++) {
                const centroid = this.centroids[centroidIndex];
                const color = this.clusterColors[centroidIndex % this.clusterColors.length];
                this.ctx.strokeStyle = color;

                const centroidCanvasX = this.dataToCanvasX(centroid.x);
                const centroidCanvasY = this.dataToCanvasY(centroid.y);

                // Draw lines to all points assigned to this cluster
                this.dataPoints.forEach((point, index) => {
                    if (this.assignments[index] === centroidIndex) {
                        const pointCanvasX = this.dataToCanvasX(point.x);
                        const pointCanvasY = this.dataToCanvasY(point.y);

                        this.ctx.beginPath();
                        this.ctx.moveTo(centroidCanvasX, centroidCanvasY);
                        this.ctx.lineTo(pointCanvasX, pointCanvasY);
                        this.ctx.stroke();
                    }
                });
            }
        } else if (showHoverLines) {
            // Show lines only for hovered centroid
            const hoveredCentroidIndex = this.hoveredCentroid;
            const centroid = this.centroids[hoveredCentroidIndex];
            const color = this.clusterColors[hoveredCentroidIndex % this.clusterColors.length];
            this.ctx.strokeStyle = color;

            const centroidCanvasX = this.dataToCanvasX(centroid.x);
            const centroidCanvasY = this.dataToCanvasY(centroid.y);

            // Draw lines to all points assigned to this cluster
            this.dataPoints.forEach((point, index) => {
                if (this.assignments[index] === hoveredCentroidIndex) {
                    const pointCanvasX = this.dataToCanvasX(point.x);
                    const pointCanvasY = this.dataToCanvasY(point.y);

                    this.ctx.beginPath();
                    this.ctx.moveTo(centroidCanvasX, centroidCanvasY);
                    this.ctx.lineTo(pointCanvasX, pointCanvasY);
                    this.ctx.stroke();
                }
            });
        }

        // Reset line dash for other drawings
        this.ctx.setLineDash([]);
    }

    drawCentroids() {
        this.centroids.forEach((centroid, index) => {
            const canvasX = this.dataToCanvasX(centroid.x);
            const canvasY = this.dataToCanvasY(centroid.y);
            const color = this.clusterColors[index % this.clusterColors.length];

            // Draw solid circle
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KMeansDemo();
});