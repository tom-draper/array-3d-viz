#!/usr/bin/env python3
"""Generate demo Parquet (.parquet) file"""

import pandas as pd
import numpy as np
import os

# Create demo data (2x4x3 array)
data = np.array([
    [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12]
    ],
    [
        [13, 14, 15],
        [16, 17, 18],
        [19, 20, 21],
        [22, 23, 24]
    ]
])

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

# Flatten the 3D array into a table format for Parquet
# Create a DataFrame with coordinates and values
rows = []
for i in range(data.shape[0]):
    for j in range(data.shape[1]):
        for k in range(data.shape[2]):
            rows.append({
                'x': i,
                'y': j,
                'z': k,
                'value': int(data[i, j, k])
            })

df = pd.DataFrame(rows)

# Save as Parquet file
df.to_parquet('data/demo.parquet', index=False)

print(f'Created data/demo.parquet')
print(f'DataFrame shape: {df.shape}')
print(f'Data:\n{df.head(10)}')
