# CNN Training and Weight Generation

This document describes how to train the CNN model and generate the pretrained weights used in the CNN Architecture demo.

## Overview

The CNN Architecture demo uses real pretrained weights from a PyTorch model trained on MNIST. The training process generates:

1. Individual `.pth` weight files for each training epoch (0-20)
2. A final trained model weights file
3. A comprehensive JSON file containing all weights, feature maps, and training metrics

## Files

- `pretrain_model.py` - Main training script that generates all data
- `model.py` - PyTorch CNN model definition
- `data/` - Output directory for all generated files
  - `epoch_weights/` - Individual weight files for each epoch
  - `final_model_weights.pth` - Final trained model
  - `pretrained_cnn_data.json` - Complete dataset with weights for JavaScript

## Requirements

The training script requires PyTorch and related dependencies:
```bash
torch>=2.0.0
torchvision>=0.15.0
numpy>=1.24.0
PIL
```

## Running the Training Script

### Option 1: Using Conda Environment (Recommended)

```bash
# Navigate to the CNN demo directory
cd lec05b_cnn-architecture

# Run with the ml-demos conda environment
/home/kevin/anaconda3/envs/ml-demos/bin/python pretrain_model.py
```

### Option 2: Using System Python with PyTorch

```bash
# Navigate to the CNN demo directory
cd lec05b_cnn-architecture

# Install dependencies (if not already installed)
pip install torch torchvision numpy pillow

# Run the training script
python3 pretrain_model.py
```

## What the Script Does

1. **Initialize Model**: Creates a CNN with the architecture:
   - Conv1: 1→4 channels, 3×3 kernel
   - MaxPool1: 2×2 pooling
   - Conv2: 4→8 channels, 3×3 kernel
   - MaxPool2: 2×2 pooling
   - FC1: 200→128 neurons
   - FC2: 128→10 output classes

2. **Prepare Data**: Downloads and prepares MNIST dataset with proper normalization

3. **Save Initial State**: Saves epoch 0 with random weights (~10% accuracy)

4. **Train Model**: Trains for 20 epochs, saving after each epoch:
   - Model weights as `.pth` files
   - Feature maps from sample images
   - Training metrics (loss, accuracy)

5. **Extract Weights**: Converts all PyTorch weights to JSON format for JavaScript inference

6. **Generate Final JSON**: Creates `pretrained_cnn_data.json` with:
   - All epoch weights in JSON format
   - Sample MNIST images
   - Feature maps for visualization
   - Training metrics for each epoch
   - Model architecture details

## Output Files

After running the script, you should have:

```
data/
├── epoch_weights/
│   ├── epoch_0_weights.pth    # Random initialization
│   ├── epoch_1_weights.pth    # After 1 epoch of training
│   ├── ...
│   └── epoch_20_weights.pth   # After 20 epochs
├── final_model_weights.pth    # Final trained model
└── pretrained_cnn_data.json   # Complete dataset (26MB)
```

## Expected Results

- **Training Time**: ~5-10 minutes on CPU, faster with GPU
- **Final Accuracy**: ~95% on MNIST test set
- **JSON File Size**: ~26MB (includes all weights for 21 epochs)
- **Total Disk Space**: ~30MB for all generated files

## Reproducibility

The training process is deterministic given the same:
- PyTorch version
- Random seed (not currently fixed)
- Training parameters (learning rate, batch size, etc.)

To ensure exact reproducibility, you can add seed setting at the beginning of the script:
```python
torch.manual_seed(42)
np.random.seed(42)
```

## Verification

To verify the training succeeded:

1. Check that all 21 epoch weight files exist in `data/epoch_weights/`
2. Verify `pretrained_cnn_data.json` is ~26MB
3. Check that the JSON contains `weights` field for each epoch
4. Open the demo in a browser and verify inference works

## Notes

- The script limits training to 100 batches per epoch for demo purposes
- MNIST data will be downloaded automatically on first run
- The feature maps are extracted using a sample image of digit "3"
- All weights are converted to JavaScript-compatible JSON format