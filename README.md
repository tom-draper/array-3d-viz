# 3D-Data-Viz
A tool to visualise arrays in 3-dimensional space.

Visualies 1D, 2D and 3D arrays from saved files.

Compatibility:    
![X] JSON    
![X] Numpy .npy    
![] pickle      

## Usage 
```
node main <filename>
```
to start the server.

Then open localhost:8080 in a browser to access visualisation.

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
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
    [100, 110, 120]
  ]
]
```
![Example5](https://user-images.githubusercontent.com/41476809/171645395-7c71391c-0efe-47a0-bfc2-39f4d50c115e.png)

