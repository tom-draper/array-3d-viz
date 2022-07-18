# Interactive 3D Visualiser for Arrays
A tool to visualise 1D, 2D and 3D arrays in 3D space using three.js.

Hosted at: https://array-3d-viz.vercel.app/

### Features
- Array data from text OR read from file
- Cell colour scaled by relative value
- Camera movement: rotation (mouse), zoom (scroll wheel), translation (arrow keys)
- Array dimensions (bottom left)
- Query input to highlight values and value ranges (bottom right)
- Value distribution graph (bottom right)      

<br>

![Data](https://user-images.githubusercontent.com/41476809/179063555-7dbf08d4-ded9-4131-b4bf-b6b619e8e715.png)

![Data4](https://user-images.githubusercontent.com/41476809/179064728-ac07c0d0-3b9e-42d1-a979-85ba35b49aac.png)

![Data5](https://user-images.githubusercontent.com/41476809/179065260-ac1415f9-d0b8-4d4c-b03b-1be5e6d54b50.png)

## Usage 

###  Mode 1: Run with a specified array file

Place the array file (.json, .npy) in the <code>/data</code> directory.

#### 1. Install packages:
```
npm install
```
#### 2. Run server
```
node main <filename>
```
Then open <code>localhost:8080</code> in a browser to run the visualisation.

#### Compatibility 
- [x] JSON (.json) 
- [x] Numpy (.npy)
- [ ] Compressed Numpy (.npz)    
- [ ] Pickle (.pickle)
- [ ] CSV (.csv)
- [ ] Binaries 

### Mode 2: Paste JSON format array data into web app from clipboard

#### 1. Install packages
```
npm install
```
#### 2. Run server
```
node main
```

Then open <code>localhost:8080</code> in a browser run the visualisation.

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
