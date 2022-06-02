# 3D-Data-Viz
A tool to visualise 1D, 2D and 3D arrays in 3D space from saved files.

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
![Example5](https://user-images.githubusercontent.com/41476809/171648209-0aefce87-c66a-4483-b655-0e05259b60e0.png)
![Example6](https://user-images.githubusercontent.com/41476809/171648124-06b23bc9-fce3-4dd8-a57f-9ebc71eef517.png)


