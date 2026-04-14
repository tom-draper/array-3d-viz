#!/usr/bin/env python3
import scipy.io as sio
import json
import sys
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle NumPy types"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

if len(sys.argv) < 2:
    print(json.dumps({"error": "No file path provided"}))
    sys.exit(1)

file_path = sys.argv[1]

try:
    # Load MATLAB file
    mat_contents = sio.loadmat(file_path)

    # Extract variables (skip MATLAB metadata keys starting with '__')
    variables = {key: mat_contents[key] for key in mat_contents.keys() if not key.startswith('__')}

    # If there's only one variable, use it directly, otherwise use the dict
    if len(variables) == 1:
        data = list(variables.values())[0]
    else:
        data = variables

    # Output as JSON
    print(json.dumps(data, cls=NumpyEncoder))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
