#!/usr/bin/env python3
"""
Pre-training script for CNN Architecture Demo
Trains the model offline and saves all intermediate states as JSON data
"""

import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from PIL import Image
import os

from model import CNNModel

def pretrain_and_export():
    """Train model and export all states for frontend consumption"""

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print("Using device: {}".format(device))

    # Initialize model
    model = CNNModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Load MNIST dataset
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])

    train_dataset = torchvision.datasets.MNIST(
        root='./data', train=True, download=True, transform=transform
    )
    test_dataset = torchvision.datasets.MNIST(
        root='./data', train=False, download=True, transform=transform
    )

    train_loader = torch.utils.data.DataLoader(
        train_dataset, batch_size=64, shuffle=True
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset, batch_size=64, shuffle=False
    )

    # Collect sample images for each digit
    print("Collecting sample MNIST images...")
    sample_images = []
    for digit in range(10):
        digit_samples = []
        for i, (image, label) in enumerate(test_dataset):
            if label == digit and len(digit_samples) < 10:
                # Convert to numpy and denormalize to 0-255 range
                img_np = image.squeeze().numpy()
                img_np = ((img_np * 0.3081) + 0.1307) * 255
                img_np = np.clip(img_np, 0, 255).astype(np.uint8)

                digit_samples.append({
                    'image': img_np.tolist(),
                    'label': digit
                })
        sample_images.extend(digit_samples)

    # Training data to export
    export_data = {
        'samples': sample_images,
        'training_epochs': [],
        'architecture': {
            'input_shape': [1, 28, 28],
            'conv1': {'channels': 4, 'kernel_size': 3, 'output_shape': [4, 26, 26]},
            'pool1': {'kernel_size': 2, 'output_shape': [4, 13, 13]},
            'conv2': {'channels': 8, 'kernel_size': 3, 'output_shape': [8, 11, 11]},
            'pool2': {'kernel_size': 2, 'output_shape': [8, 5, 5]},
            'flatten': {'output_features': 200},
            'fc1': {'hidden_units': 128},
            'output': {'classes': 10}
        }
    }

    print("Starting training and data collection...")

    # Create directories for saving data and model weights
    output_dir = './data'
    os.makedirs(output_dir, exist_ok=True)
    weights_dir = os.path.join(output_dir, 'epoch_weights')
    os.makedirs(weights_dir, exist_ok=True)

    # First, save epoch 0 (random initialization) state
    print("Saving epoch 0 (random initialization)...")

    # Save epoch 0 weights (random initialization)
    epoch_0_weights_file = os.path.join(weights_dir, 'epoch_0_weights.pth')
    torch.save(model.state_dict(), epoch_0_weights_file)

    # Get feature maps for epoch 0 (random weights) using a sample image (digit 3)
    sample_tensor = None
    for image, label in test_dataset:
        if label == 3:
            sample_tensor = image.unsqueeze(0).to(device)
            break

    feature_maps_epoch_0 = {}
    if sample_tensor is not None:
        model.eval()
        with torch.no_grad():
            outputs, activations = model(sample_tensor)

            for layer_name, activation in activations.items():
                if len(activation.shape) == 4:  # Conv layers
                    activation_np = activation[0].cpu().numpy()
                    # Take all channels for visualization
                    feature_maps_epoch_0[layer_name] = activation_np.tolist()
                elif len(activation.shape) == 2:  # FC layers
                    feature_maps_epoch_0[layer_name] = activation[0].cpu().numpy().tolist()

    # Store epoch 0 data (random initialization)
    epoch_0_data = {
        'epoch': 0,
        'loss': 999.999,  # High loss for random initialization (JSON-safe)
        'train_accuracy': 0.0,  # Random performance
        'test_accuracy': 10.0,  # ~10% for 10-class random classification
        'feature_maps': feature_maps_epoch_0
    }
    export_data['training_epochs'].append(epoch_0_data)

    # Train for multiple epochs and save states
    num_epochs = 20
    max_batches_per_epoch = 100  # Limit for demo purposes

    for epoch in range(num_epochs):
        print("Training epoch {}/{}...".format(epoch + 1, num_epochs))

        model.train()
        total_loss = 0
        correct = 0
        total = 0

        # Training
        for batch_idx, (data, target) in enumerate(train_loader):
            if batch_idx >= max_batches_per_epoch:
                break

            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            outputs, _ = model(data)
            loss = criterion(outputs, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += target.size(0)
            correct += (predicted == target).sum().item()

        # Calculate epoch metrics
        avg_loss = total_loss / min(max_batches_per_epoch, len(train_loader))
        train_accuracy = 100 * correct / total

        # Test accuracy
        model.eval()
        test_correct = 0
        test_total = 0
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(device), target.to(device)
                outputs, _ = model(data)
                _, predicted = torch.max(outputs, 1)
                test_total += target.size(0)
                test_correct += (predicted == target).sum().item()

        test_accuracy = 100 * test_correct / test_total

        # Get feature maps for a sample image (digit 3)
        sample_tensor = None
        for image, label in test_dataset:
            if label == 3:
                sample_tensor = image.unsqueeze(0).to(device)
                break

        feature_maps = {}
        if sample_tensor is not None:
            model.eval()
            with torch.no_grad():
                outputs, activations = model(sample_tensor)

                for layer_name, activation in activations.items():
                    if len(activation.shape) == 4:  # Conv layers (including Pool2)
                        activation_np = activation[0].cpu().numpy()
                        # Take all channels for proper visualization
                        feature_maps[layer_name] = activation_np.tolist()
                    elif len(activation.shape) == 2:  # FC layers
                        feature_maps[layer_name] = activation[0].cpu().numpy().tolist()

        # Save model weights for this epoch
        epoch_weights_file = os.path.join(weights_dir, 'epoch_{}_weights.pth'.format(epoch + 1))
        torch.save(model.state_dict(), epoch_weights_file)

        # Store epoch data
        epoch_data = {
            'epoch': epoch + 1,
            'loss': avg_loss,
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'feature_maps': feature_maps
        }

        export_data['training_epochs'].append(epoch_data)

        print("  Loss: {:.4f}, Train Acc: {:.2f}%, Test Acc: {:.2f}% (weights saved)".format(avg_loss, train_accuracy, test_accuracy))

    # Also save the final trained model weights
    model_weights_file = os.path.join(output_dir, 'final_model_weights.pth')
    torch.save(model.state_dict(), model_weights_file)

    print("Extracting weights for all epochs to include in JSON...")

    # Extract weights for each epoch and add to the JSON data
    for i, epoch_data in enumerate(export_data['training_epochs']):
        epoch_num = epoch_data['epoch']
        weights_file = os.path.join(weights_dir, 'epoch_{}_weights.pth'.format(epoch_num))

        if os.path.exists(weights_file):
            # Load the model state dict
            state_dict = torch.load(weights_file, map_location='cpu')

            # Extract weights and convert to lists for JSON serialization
            weights = {
                'conv1': {
                    'weight': state_dict['conv1.weight'].numpy().tolist(),  # [4, 1, 3, 3]
                    'bias': state_dict['conv1.bias'].numpy().tolist()       # [4]
                },
                'conv2': {
                    'weight': state_dict['conv2.weight'].numpy().tolist(),  # [8, 4, 3, 3]
                    'bias': state_dict['conv2.bias'].numpy().tolist()       # [8]
                },
                'fc1': {
                    'weight': state_dict['fc1.weight'].numpy().tolist(),    # [128, 200]
                    'bias': state_dict['fc1.bias'].numpy().tolist()         # [128]
                },
                'fc2': {
                    'weight': state_dict['fc2.weight'].numpy().tolist(),    # [10, 128]
                    'bias': state_dict['fc2.bias'].numpy().tolist()         # [10]
                }
            }
            epoch_data['weights'] = weights
            print("  Added weights for epoch {}".format(epoch_num))

    # Also extract and add final model weights
    final_state_dict = torch.load(model_weights_file, map_location='cpu')
    export_data['final_weights'] = {
        'conv1': {
            'weight': final_state_dict['conv1.weight'].numpy().tolist(),
            'bias': final_state_dict['conv1.bias'].numpy().tolist()
        },
        'conv2': {
            'weight': final_state_dict['conv2.weight'].numpy().tolist(),
            'bias': final_state_dict['conv2.bias'].numpy().tolist()
        },
        'fc1': {
            'weight': final_state_dict['fc1.weight'].numpy().tolist(),
            'bias': final_state_dict['fc1.bias'].numpy().tolist()
        },
        'fc2': {
            'weight': final_state_dict['fc2.weight'].numpy().tolist(),
            'bias': final_state_dict['fc2.bias'].numpy().tolist()
        }
    }

    # Add model architecture information for JavaScript implementation
    export_data['model_architecture'] = {
        'conv1': {
            'in_channels': 1,
            'out_channels': 4,
            'kernel_size': 3,
            'stride': 1,
            'padding': 0
        },
        'pool1': {
            'kernel_size': 2,
            'stride': 2
        },
        'conv2': {
            'in_channels': 4,
            'out_channels': 8,
            'kernel_size': 3,
            'stride': 1,
            'padding': 0
        },
        'pool2': {
            'kernel_size': 2,
            'stride': 2
        },
        'fc1': {
            'in_features': 200,  # 8 * 5 * 5
            'out_features': 128
        },
        'fc2': {
            'in_features': 128,
            'out_features': 10
        }
    }

    # Save to JSON file with weights included
    output_file = os.path.join(output_dir, 'pretrained_cnn_data.json')

    with open(output_file, 'w') as f:
        json.dump(export_data, f, indent=2)

    print("\nPre-trained data exported to: {}".format(output_file))
    print("Final model weights saved to: {}".format(model_weights_file))
    print("Total epochs: {}".format(num_epochs))
    print("Final test accuracy: {:.2f}%".format(export_data['training_epochs'][-1]['test_accuracy']))
    print("JSON file includes weights for all {} epochs".format(len(export_data['training_epochs'])))

if __name__ == '__main__':
    pretrain_and_export()