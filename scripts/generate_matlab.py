#!/usr/bin/env python3
"""Generate demo MATLAB (.mat) file"""

import scipy.io as sio
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

# Save as MATLAB file
sio.savemat('data/demo.mat', {'data': data})

print(f'Created data/demo.mat')
print(f'Array shape: {data.shape}')
print(f'Data:\n{data}')
