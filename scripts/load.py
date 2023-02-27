"""Called by main.js to move numpy data into temp.json"""

import numpy as np
import sys
import json

data = np.load(sys.argv[1]).tolist()
with open("data/temp/temp.json", 'w') as f:
    json.dump(data, f)
