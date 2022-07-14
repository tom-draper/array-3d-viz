# array-3d-viz
A tool to visualise 1D, 2D and 3D arrays in 3D space.

Available at: https://array-3d-viz.vercel.app/

![Data](https://user-images.githubusercontent.com/41476809/179063555-7dbf08d4-ded9-4131-b4bf-b6b619e8e715.png)

![Data4](https://user-images.githubusercontent.com/41476809/179064728-ac07c0d0-3b9e-42d1-a979-85ba35b49aac.png)

![Data5](https://user-images.githubusercontent.com/41476809/179065260-ac1415f9-d0b8-4d4c-b03b-1be5e6d54b50.png)

# Usage 

Two modes of use:

###  Mode 1: Run with a specified array file

Place the array file (.json, .npy) in the <code>/data</code> directory.

To start the server run:
```
node main <filename>
```

Then open <code>localhost:8080</code> in a browser to access visualisation.

#### Compatibility 
- [x] JSON (.json) 
- [x] Numpy (.npy)    
- [ ] pickle (.pickle)    

### Mode 2: Paste array data (JSON format) into web app from clipboard

To start the server run:
```
node main
```

Then open <code>localhost:8080</code> in a browser to access visualisation.

## Example JSON (2 x 4 x 3)

```json
[
  [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12]
  ],
  [
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
    [100, 110, 120]
  ]
]
```
![Example5](https://user-images.githubusercontent.com/41476809/171648209-0aefce87-c66a-4483-b655-0e05259b60e0.png)

#### Values of given values and within ranges can be highlighted to help reveal patterns:

![Example6](https://user-images.githubusercontent.com/41476809/171648124-06b23bc9-fce3-4dd8-a57f-9ebc71eef517.png)


