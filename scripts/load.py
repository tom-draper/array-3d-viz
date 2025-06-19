import numpy as np
import sys
import json

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python scripts/load.py <path_to_npy_file>")
        sys.exit(1)

    data = np.load(sys.argv[1]).tolist()
    with open("data/temp/temp.json", 'w') as f:
        json.dump(data, f)
