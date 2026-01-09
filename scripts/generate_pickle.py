#!/usr/bin/env python3
"""Generate demo Pickle (.pickle) file"""

import pickle
import os

# Create demo data (2x4x3 array)
data = [
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
]

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

# Save as pickle file
with open('data/demo.pickle', 'wb') as f:
    pickle.dump(data, f)

print(f'Created data/demo.pickle')
print(f'Array shape: 2x4x3')
print(f'Data: {data}')
