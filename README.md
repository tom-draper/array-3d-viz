# Interactive 3D Visualizer for Arrays

A tool for visualizing arrays and matrices in 3D space using Three.js.

Hosted at: https://array-3d-viz.vercel.app

### Features
- Works with 1D, 2D or 3D arrays
- Paste array data from clipboard or read from file
- Cell color scaled by relative value
- Full camera movement: rotation (mouse), zoom (scroll wheel), translation (arrow keys)
- Array dimension display (bottom left)
- Query input for highlighting values or value ranges (bottom right)
- Array value histogram (bottom right)

<br>

![Data](https://user-images.githubusercontent.com/41476809/179063555-7dbf08d4-ded9-4131-b4bf-b6b619e8e715.png)

![Data2](https://user-images.githubusercontent.com/41476809/179064728-ac07c0d0-3b9e-42d1-a979-85ba35b49aac.png)

![Data3](https://user-images.githubusercontent.com/41476809/179065260-ac1415f9-d0b8-4d4c-b03b-1be5e6d54b50.png)

## Getting Started

### Installation

#### Install packages

```bash
npm install
```

### Usage 

####  Option 1: Array file (.json, .npy, etc.)

Start the node server providing the path to your array file.

```bash
node server.js path/to/filename.ext
```

Then open <code>localhost:8080</code> in a browser to view the visualization.

##### Compatibility 
- [x] JSON (.json) 
- [X] CSV (.csv)
- [x] NumPy (.npy, .npz)
- [X] HDF (.hdf, .h5, .hdf5)
- [ ] Pickle (.pickle)

#### Option 2: Paste JSON array from clipboard

```bash
node server.js
```

Then open <code>localhost:8080</code> in a browser and paste your JSON array into the input box. Ensure the JSON is valid and there are no trailing commas after any final elements in a list.

### Example JSON (2 x 4 x 3)

```json
[
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

```

![Data4](https://user-images.githubusercontent.com/41476809/179065871-d10666a7-6091-49f8-a26f-01cfd9bca5a2.png)
