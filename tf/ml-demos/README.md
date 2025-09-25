# ML Demos

A collection of interactive machine learning demonstrations that allow you to experiment with different algorithms and parameters to build intuition about how they work.

## Features

- **Interactive Demos**: Hands-on demonstrations of ML algorithms
- **Modern UI**: Clean, responsive design that works on desktop and tablet
- **Navigation System**: Easy browsing between different demos
- **Real-time Visualization**: See algorithm behavior update in real-time
- **PyTorch Backend**: Real neural network implementation for CNN demo

## Available Demos

- **Linear Regression**: Explore how linear regression finds the best line through data points
- **Regularisation**: Explore how higher model capacity can cause overfitting in polynomial regression and the effects of L1 and L2 regularisation to mitigate this
- **1D Classification**: Interactive logistic regression with adjustable decision boundaries
- **2D Classification**: Multi-class classification with various boundary types (linear, polynomial, radial basis)
- **Neural Networks**: Build and train neural networks with adjustable architecture and parameters
- **Backpropagation**: Step-by-step visualization of the backpropagation algorithm
- **Convolution & Pooling**: Interactive exploration of CNN operations with real-time filter visualization
- **CNN Architecture**: Complete MNIST digit classification with real PyTorch backend and epoch-by-epoch training visualization
- **Recurrent Neural Networks**: Discover how RNNs process sequential data step-by-step with hidden state evolution
- **Attention Mechanism**: Explore how attention mechanisms work through Q, K, V computations and dot-product attention
- **K-Means Clustering**: Interactive clustering demonstration with step-by-step k-means algorithm visualization
- **Multi-Armed Bandit**: Explore the exploration vs exploitation tradeoff with interactive epsilon-greedy algorithm

## Local Development

All demos run entirely in the browser with no backend dependencies.

### Quick Start

Simply serve the files through a local web server:

```bash
# Navigate to the project directory
cd ml-demos

# Python 3
python3 -m http.server 8000
```

Then open your browser and go to: `http://localhost:8000/demo.html`

### Alternative Options

#### Option 2: Node.js

If you have Node.js installed:

```bash
# Navigate to the project directory
cd ml-demos

# Using npx (comes with Node.js)
npx serve .

# Or install a global server
npm install -g http-server
http-server
```

Then open your browser and go to the URL shown in the terminal (typically `http://localhost:3000` or `http://localhost:8080`).

### Option 3: VS Code Live Server

If you're using VS Code:

1. Install the "Live Server" extension
2. Right-click on `demo.html`
3. Select "Open with Live Server"

## Project Structure

```
ml-demos/
├── demo.html                      # Main entry point with navigation and iframe
├── home-content.html              # Homepage content loaded in iframe
├── styles.css                     # Shared styles for all demos
├── imperial-tsl-logo.svg          # Logo
├── lec02_linear-regression/       # Linear regression demo
│   ├── content.html               # Demo content for iframe
│   └── script.js                  # Demo JavaScript
├── lec03a_regularization/         # Regularization demo
│   ├── content.html
│   └── script.js
├── lec03b_classification/         # 1D classification demo
│   ├── content.html
│   └── script.js
├── lec03c_2d-classification/      # 2D classification demo
│   ├── content.html
│   └── script.js
├── lec04a_neural-networks/        # Neural networks demo
│   ├── content.html
│   └── script.js
├── lec04b_backpropagation/        # Backpropagation demo
│   ├── content.html
│   └── script.js
├── lec05a_convolution-pooling/    # Convolution & pooling demo
│   ├── content.html
│   └── script.js
├── lec05b_cnn-architecture/       # CNN architecture demo
│   ├── content.html
│   ├── script.js
│   ├── cnn-inference.js           # JavaScript CNN implementation
│   └── data/                      # Pre-trained model weights and MNIST data
├── lec06a_rnn/                    # RNN demo
│   ├── content.html
│   └── script.js
├── lec06b_attention/              # Attention mechanism demo
│   ├── content.html
│   └── script.js
├── lec07_k-means-clustering/      # K-means clustering demo
│   ├── content.html
│   └── script.js
├── lec08_multi-armed-bandit/      # Multi-armed bandit demo (with backend)
│   ├── content.html
│   ├── script.js
│   └── backend/                   # Python backend
│       ├── run.py
│       └── requirements.txt
└── README.md                     # This file
```

## Adding New Demos

To add a new demo:

1. Create a new directory following the naming convention: `lec##_demo-name/`
2. Add your demo files:
   - `content.html` (demo content for iframe loading)
   - `script.js` (demo JavaScript logic)
3. Update the navigation in:
   - `demo.html` sidebar navigation
   - `home-content.html` demo grid (add a new card)
   - `demo.html` JavaScript hashMap for URL routing
4. Use the shared `../styles.css` for consistent styling
5. Use `iframe-content` CSS class for proper layout within the iframe

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python, Flask (Multi-Armed Bandit demo only)
- **Math Rendering**: MathJax
- **Visualization**: HTML5 Canvas with high-DPI support
- **Design**: CSS Grid, Flexbox, responsive design
- **Machine Learning**: JavaScript CNN implementation with real PyTorch weights
- **Data**: MNIST dataset and pretrained model weights for CNN demonstration