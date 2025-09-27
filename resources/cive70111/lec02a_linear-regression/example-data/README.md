# Linear Regression Teaching Datasets for Civil Engineering

This folder contains four small, preprocessed datasets prepared for teaching **linear regression** in a civil engineering context.  
Each dataset is drawn from a different sector of civil engineering and includes **two variables** that show a reasonably linear relationship.  
All datasets have been randomly sampled to include **50 rows** for simplicity.

---

## 1. Structures: Concrete Strength
- **File:** `structures_concrete.csv`  
- **Variables:**  
  - `Cement_kg_per_m3`: Cement content in kilograms per cubic metre.  
  - `Compressive_Strength_MPa`: Resulting compressive strength of the concrete in megapascals.  
- **Source:** [Concrete Compressive Strength Dataset (Kaggle)](https://www.kaggle.com/datasets/sinamhd9/concrete-comprehensive-strength)  
- **Teaching Idea:** Show how increasing cement content tends to increase concrete strength.

---

## 2. Environment: Wastewater Treatment
- **File:** `environment_wastewater.csv`  
- **Variables:**  
  - `Inflow_m3_s`: Average daily inflow to the treatment plant (m³/s).  
  - `Energy_Consumption_kWh`: Daily energy consumption of the plant (kWh).  
- **Source:** [Full Scale Wastewater Treatment Plant Data (Kaggle)](https://www.kaggle.com/datasets/d4rklucif3r/full-scale-waste-water-treatment-plant-data)  
- **Teaching Idea:** Explore how higher inflow rates are associated with greater energy use.

---

## 3. Transport: Urban Traffic Flow
- **File:** `transport_traffic.csv`  
- **Variables:**  
  - `Vehicle_Count`: Number of vehicles detected in a time interval.  
  - `Vehicle_Speed_kmh`: Average vehicle speed (km/h).  
- **Source:** [Urban Traffic Flow Dataset (Kaggle)](https://www.kaggle.com/datasets/ziya07/urban-traffic-flow-dataset)  
- **Teaching Idea:** Show the negative relationship between vehicle count and speed (congestion).

---

## 4. Geotechnics: Soil Properties
- **File:** `geotechnics_soil.csv`  
- **Variables:**  
  - `Sand_Percent`: Percentage of sand in the soil sample.  
  - `Uniformity_Coefficient`: A measure of soil gradation (ratio of particle sizes).  
- **Source:** [Austrian Geotechnical Laboratory Test Dataset (Kaggle)](https://www.kaggle.com/datasets/hozaifakhalid/austrian-geotechnical-laboratory-test-dataset)  
- **Teaching Idea:** Show how soil composition relates to gradation properties.

---

## Usage
These datasets are designed for small exercises in linear regression.  
For each dataset, try to:
1. Plot the data to visualise the relationship.  
2. Fit a simple linear regression model.  
3. Interpret the slope and intercept in the civil engineering context.  

---
