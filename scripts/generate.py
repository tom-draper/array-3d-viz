import numpy as np

if __name__ == '__main__':
    arr = np.random.rand(25, 25)
    np.save("data/data.npy", arr)
    print(arr)

