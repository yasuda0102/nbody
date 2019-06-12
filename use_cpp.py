#!/usr/bin/python3

import calc
import numpy as np
import time

def main():
    bodies = 100
    steps = 100

    z = calc.vec3(0.0, 0.0, 0.0)
    points = calc.Points()
    rand_list = np.random.rand(bodies * 2) * 100.0
    for i in range(bodies):
        p = calc.Point(1.0e+10, z, z, calc.vec3(rand_list[2 * i + 0], rand_list[2 * i + 1], 0.0))
        points.push(p)

    points.print()
    start = time.time()
    for i in range(steps):
        calc.step(points)
    end = time.time()
    points.print()

    print(f"bodies: {bodies}, steps: {steps}")
    print(f"time: {(end - start) * 1000.0} [msec]")

if __name__ == "__main__":
    main()