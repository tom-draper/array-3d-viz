# Interactive 3D Visualizer for Arrays

A tool to visualize arrays and matrices in 3D space using three.js.

Hosted at: https://array-3d-viz.vercel.app/

### Features
- Works with 1D, 2D or 3D arrays
- Paste array data from clipboard or read from file
- Cell colour scaled by relative value
- Full camera movement: rotation (mouse), zoom (scroll wheel), translation (arrow keys)
- Array dimension display (bottom left)
- Query input for highlighting values or value ranges (bottom right)
- Array value histogram (bottom right)

<br>

![Data](https://user-images.githubusercontent.com/41476809/179063555-7dbf08d4-ded9-4131-b4bf-b6b619e8e715.png)

![Data4](https://user-images.githubusercontent.com/41476809/179064728-ac07c0d0-3b9e-42d1-a979-85ba35b49aac.png)

![Data5](https://user-images.githubusercontent.com/41476809/179065260-ac1415f9-d0b8-4d4c-b03b-1be5e6d54b50.png)

## Usage 

###  Mode 1: Visualize array file (.json, .npy, etc.)

Place the array file in the <code>/data</code> directory.

#### 1. Install packages:
```
npm install
```
#### 2. Run server
```
node main <filename>
```
Then open <code>localhost:8080</code> in a browser to run the visualization.

#### Compatibility 
- [x] JSON (.json) 
- [x] NumPy (.npy, .npz)
- [ ] Pickle (.pickle)
- [ ] CSV (.csv)
- [ ] Binaries

To load .npy or .npz files, Python must be installed with the NumPy library.

### Mode 2: Visualize pasted array data (JSON format) from clipboard

#### 1. Install packages
```
npm install
```
#### 2. Run server
```
node main
```

Then open <code>localhost:8080</code> in a browser and paste your JSON array into the input box. Ensure there are no trailing commas after any final elements in a list.

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

![Data6](https://user-images.githubusercontent.com/41476809/179065871-d10666a7-6091-49f8-a26f-01cfd9bca5a2.png)
