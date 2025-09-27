# Housing Prices Dataset (Processed)

This repository contains processed training and test datasets derived from the [Housing Prices Dataset](https://www.kaggle.com/datasets/yasserh/housing-prices-dataset) originally published on Kaggle by **Yasser H.**  

## Overview

The dataset contains housing attributes and their associated prices. For this processed version, we focus on the core numerical features most relevant for predictive modelling.  

### Source
- **Original dataset:** [Housing Prices Dataset on Kaggle](https://www.kaggle.com/datasets/yasserh/housing-prices-dataset)
- **License:** Refer to Kaggle dataset page for licensing terms.

## Processing Steps

1. **Selected Columns:**  
   From the original dataset, only the following columns were retained:  
   - `price`: Selling price of the house (target variable).  
   - `area`: Area of the house in square feet.  
   - `bedrooms`: Number of bedrooms.  
   - `bathrooms`: Number of bathrooms.  
   - `stories`: Number of stories (floors).  

2. **Outlier Handling:**  
   - Two versions are provided:  
     - **With outliers removed** using the IQR (Interquartile Range) method.  
     - **Without outlier removal** for those who prefer working with the raw distribution.  

3. **Train/Test Split:**  
   - A random sample of **20 rows** was set aside as the **test set**.  
   - The remaining rows form the **training set**.  
   - Random seed fixed (`random_state=42`) to ensure reproducibility.  

## Files

- `training.csv` – Training set with outliers removed.  
- `test.csv` – Test set with outliers removed.  
- `training_no_outlier_removal.csv` – Training set without outlier removal.  
- `test_no_outlier_removal.csv` – Test set without outlier removal.  

## Usage

These datasets are suitable for:
- Teaching and demonstration of regression techniques (e.g., linear regression, regularisation, tree-based models).  
- Exploratory data analysis of housing features and their effect on prices.  
- Practice in dataset cleaning, train/test splits, and model evaluation.  

## Citation

If you use this processed dataset, please also cite the original source:

> Yasser H. (2020). Housing Prices Dataset. Kaggle. [https://www.kaggle.com/datasets/yasserh/housing-prices-dataset](https://www.kaggle.com/datasets/yasserh/housing-prices-dataset)
