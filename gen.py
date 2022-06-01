import numpy as np

x = np.array([[10, 20, 30], [40, 50, 60], [70, 80, 90], [110, 120, 130]])
with open('data.npy', 'wb') as f:
    np.save(f, x);