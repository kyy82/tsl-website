import torch
import torch.nn as nn
import torch.nn.functional as F

class CNNModel(nn.Module):
    def __init__(self):
        super(CNNModel, self).__init__()

        # Conv1: 1 -> 4 channels, 3x3 kernel, no padding
        # Input: 1x28x28 -> Output: 4x26x26
        self.conv1 = nn.Conv2d(1, 4, kernel_size=3, stride=1, padding=0)

        # Pool1: 2x2 max pooling
        # Input: 4x26x26 -> Output: 4x13x13
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Conv2: 4 -> 8 channels, 3x3 kernel, no padding
        # Input: 4x13x13 -> Output: 8x11x11
        self.conv2 = nn.Conv2d(4, 8, kernel_size=3, stride=1, padding=0)

        # Pool2: 2x2 max pooling
        # Input: 8x11x11 -> Output: 8x5x5
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Flatten: 8x5x5 = 200
        # Fully connected layers
        self.fc1 = nn.Linear(8 * 5 * 5, 128)
        self.fc2 = nn.Linear(128, 10)  # 10 classes for digits 0-9

        # Dropout for regularization
        self.dropout = nn.Dropout(0.25)

    def forward(self, x):
        # Store intermediate activations for visualization
        activations = {}

        # Conv1 + ReLU + Pool1
        x = self.conv1(x)
        activations['conv1'] = x.clone()
        x = F.relu(x)
        x = self.pool1(x)
        activations['pool1'] = x.clone()

        # Conv2 + ReLU + Pool2
        x = self.conv2(x)
        activations['conv2'] = x.clone()
        x = F.relu(x)
        x = self.pool2(x)
        activations['pool2'] = x.clone()

        # Flatten
        x = x.view(-1, 8 * 5 * 5)  # 200 features
        activations['flatten'] = x.clone()

        # Fully connected layers
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        activations['fc1'] = x.clone()

        x = self.fc2(x)
        activations['output'] = x.clone()

        return x, activations

    def get_feature_maps(self, x):
        """Extract feature maps for visualization"""
        _, activations = self.forward(x)
        return activations