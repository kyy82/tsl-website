/**
 * JavaScript CNN Inference Engine
 * Implements forward pass operations for the MNIST CNN model
 */

class CNNInference {
    constructor() {
        this.weights = null;
        this.architecture = null;
    }

    /**
     * Load model weights and architecture from the pretrained data
     */
    loadModel(weights, architecture) {
        this.weights = weights;
        this.architecture = architecture;
    }

    /**
     * 2D Convolution operation
     * @param {Array} input - 3D array [channels, height, width]
     * @param {Array} kernels - 4D array [out_channels, in_channels, kernel_h, kernel_w]
     * @param {Array} biases - 1D array [out_channels]
     * @param {number} stride - Convolution stride
     * @param {number} padding - Padding size
     * @returns {Array} - 3D array [out_channels, out_height, out_width]
     */
    conv2d(input, kernels, biases, stride = 1, padding = 0) {
        const [in_channels, in_height, in_width] = [input.length, input[0].length, input[0][0].length];
        const [out_channels, _, kernel_h, kernel_w] = [kernels.length, kernels[0].length, kernels[0][0].length, kernels[0][0][0].length];

        // Calculate output dimensions
        const out_height = Math.floor((in_height + 2 * padding - kernel_h) / stride) + 1;
        const out_width = Math.floor((in_width + 2 * padding - kernel_w) / stride) + 1;

        // Initialize output
        const output = new Array(out_channels);
        for (let oc = 0; oc < out_channels; oc++) {
            output[oc] = new Array(out_height);
            for (let oh = 0; oh < out_height; oh++) {
                output[oc][oh] = new Array(out_width).fill(0);
            }
        }

        // Apply padding if needed
        const padded_input = this.applyPadding(input, padding);

        // Perform convolution
        for (let oc = 0; oc < out_channels; oc++) {
            for (let oh = 0; oh < out_height; oh++) {
                for (let ow = 0; ow < out_width; ow++) {
                    let sum = biases[oc]; // Start with bias

                    // Apply kernel
                    for (let ic = 0; ic < in_channels; ic++) {
                        for (let kh = 0; kh < kernel_h; kh++) {
                            for (let kw = 0; kw < kernel_w; kw++) {
                                const ih = oh * stride + kh;
                                const iw = ow * stride + kw;
                                sum += padded_input[ic][ih][iw] * kernels[oc][ic][kh][kw];
                            }
                        }
                    }

                    output[oc][oh][ow] = sum;
                }
            }
        }

        return output;
    }

    /**
     * Apply padding to input tensor
     */
    applyPadding(input, padding) {
        if (padding === 0) return input;

        const [channels, height, width] = [input.length, input[0].length, input[0][0].length];
        const padded_height = height + 2 * padding;
        const padded_width = width + 2 * padding;

        const padded = new Array(channels);
        for (let c = 0; c < channels; c++) {
            padded[c] = new Array(padded_height);
            for (let h = 0; h < padded_height; h++) {
                padded[c][h] = new Array(padded_width).fill(0);
            }

            // Copy original values
            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    padded[c][h + padding][w + padding] = input[c][h][w];
                }
            }
        }

        return padded;
    }

    /**
     * ReLU activation function
     * @param {Array} input - N-dimensional array
     * @returns {Array} - N-dimensional array with ReLU applied
     */
    relu(input) {
        if (Array.isArray(input[0])) {
            // Multi-dimensional
            return input.map(row => this.relu(row));
        } else {
            // 1D array
            return input.map(x => Math.max(0, x));
        }
    }

    /**
     * 2D Max pooling operation
     * @param {Array} input - 3D array [channels, height, width]
     * @param {number} kernel_size - Size of pooling window
     * @param {number} stride - Stride for pooling
     * @returns {Array} - 3D array [channels, out_height, out_width]
     */
    maxPool2d(input, kernel_size = 2, stride = 2) {
        const [channels, height, width] = [input.length, input[0].length, input[0][0].length];
        const out_height = Math.floor((height - kernel_size) / stride) + 1;
        const out_width = Math.floor((width - kernel_size) / stride) + 1;

        const output = new Array(channels);
        for (let c = 0; c < channels; c++) {
            output[c] = new Array(out_height);
            for (let oh = 0; oh < out_height; oh++) {
                output[c][oh] = new Array(out_width);
                for (let ow = 0; ow < out_width; ow++) {
                    let max_val = -Infinity;

                    // Find maximum in pooling window
                    for (let kh = 0; kh < kernel_size; kh++) {
                        for (let kw = 0; kw < kernel_size; kw++) {
                            const ih = oh * stride + kh;
                            const iw = ow * stride + kw;
                            max_val = Math.max(max_val, input[c][ih][iw]);
                        }
                    }

                    output[c][oh][ow] = max_val;
                }
            }
        }

        return output;
    }

    /**
     * Flatten a 3D tensor to 1D
     * @param {Array} input - 3D array [channels, height, width]
     * @returns {Array} - 1D array
     */
    flatten(input) {
        const result = [];
        for (let c = 0; c < input.length; c++) {
            for (let h = 0; h < input[c].length; h++) {
                for (let w = 0; w < input[c][h].length; w++) {
                    result.push(input[c][h][w]);
                }
            }
        }
        return result;
    }

    /**
     * Fully connected (linear) layer
     * @param {Array} input - 1D array
     * @param {Array} weights - 2D array [out_features, in_features]
     * @param {Array} biases - 1D array [out_features]
     * @returns {Array} - 1D array [out_features]
     */
    linear(input, weights, biases) {
        const out_features = weights.length;
        const output = new Array(out_features);

        for (let o = 0; o < out_features; o++) {
            let sum = biases[o];
            for (let i = 0; i < input.length; i++) {
                sum += input[i] * weights[o][i];
            }
            output[o] = sum;
        }

        return output;
    }

    /**
     * Softmax activation function
     * @param {Array} input - 1D array
     * @returns {Array} - 1D array with softmax applied
     */
    softmax(input) {
        const max_val = Math.max(...input);
        const exp_values = input.map(x => Math.exp(x - max_val));
        const sum_exp = exp_values.reduce((a, b) => a + b, 0);
        return exp_values.map(x => x / sum_exp);
    }

    /**
     * Convert image data to tensor format
     * @param {Array} imageData - 2D array representing 28x28 image
     * @returns {Array} - 3D tensor [1, 28, 28] normalized
     */
    preprocessImage(imageData) {
        // Convert to 3D tensor and normalize to match PyTorch preprocessing
        const tensor = [imageData.map(row => row.map(pixel => {
            // Convert 0-255 to 0-1 then apply MNIST normalization
            const normalized = pixel / 255.0;
            return (normalized - 0.1307) / 0.3081;
        }))];

        return tensor;
    }

    /**
     * Perform forward pass through the CNN
     * @param {Array} imageData - 2D array representing 28x28 image
     * @param {Object} weights - Model weights for specific epoch
     * @returns {Object} - {predictions: Array, activations: Object}
     */
    forward(imageData, weights) {
        // Store intermediate activations for visualization
        const activations = {};

        // Preprocess input
        let x = this.preprocessImage(imageData);
        activations['input'] = x;

        // Conv1 + ReLU + Pool1
        x = this.conv2d(x, weights.conv1.weight, weights.conv1.bias, 1, 0);
        activations['conv1'] = this.deepCopy(x);
        x = this.relu(x);
        x = this.maxPool2d(x, 2, 2);
        activations['pool1'] = this.deepCopy(x);

        // Conv2 + ReLU + Pool2
        x = this.conv2d(x, weights.conv2.weight, weights.conv2.bias, 1, 0);
        activations['conv2'] = this.deepCopy(x);
        x = this.relu(x);
        x = this.maxPool2d(x, 2, 2);
        activations['pool2'] = this.deepCopy(x);

        // Flatten
        x = this.flatten(x);
        activations['flatten'] = [...x];

        // FC1 + ReLU
        x = this.linear(x, weights.fc1.weight, weights.fc1.bias);
        x = this.relu(x);
        activations['fc1'] = [...x];

        // FC2 (output layer)
        x = this.linear(x, weights.fc2.weight, weights.fc2.bias);
        activations['output'] = [...x];

        // Apply softmax for probabilities
        const probabilities = this.softmax(x);

        return {
            logits: x,
            probabilities: probabilities,
            prediction: probabilities.indexOf(Math.max(...probabilities)),
            activations: activations
        };
    }

    /**
     * Deep copy utility for arrays
     */
    deepCopy(arr) {
        if (!Array.isArray(arr)) return arr;
        return arr.map(item => Array.isArray(item) ? this.deepCopy(item) : item);
    }

    /**
     * Get prediction for an image using current epoch weights
     * @param {Array} imageData - 2D array representing 28x28 image
     * @param {number} epochIndex - Index of epoch weights to use
     * @param {Object} pretrainedData - Full pretrained data object
     * @returns {Object} - Prediction results
     */
    predict(imageData, epochIndex, pretrainedData) {
        if (!pretrainedData || !pretrainedData.training_epochs[epochIndex]) {
            throw new Error(`No weights available for epoch ${epochIndex}`);
        }

        const epochWeights = pretrainedData.training_epochs[epochIndex].weights;
        return this.forward(imageData, epochWeights);
    }
}