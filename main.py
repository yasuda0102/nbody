#!/usr/bin/python3

import numpy as np
import copy as cp
import time
import json
import calc

class Point:
    def __init__(self, mass, acceleration, velocity, position):
        self.__setMass(mass)
        self.setAcceleration(acceleration)
        self.setVelocity(velocity)
        self.setPosition(position)

    def __setMass(self, mass):
        # 引数チェック
        if type(mass) is not float:
            raise ValueError("質量は浮動小数点値でなければなりません。")

        if mass < 0.0:
            raise ValueError("質量は正の実数値でなければなりません。")

        # セット
        self.__mass = mass

    def getMass(self):
        return self.__mass

    def setAcceleration(self, acceleration):
        # 引数チェック
        if type(acceleration) is not np.ndarray:
            raise ValueError("加速度はndarrayでなければなりません。")

        if acceleration.size != 3:
            raise ValueError("加速度は3次元ベクトルでなければなりません。")

        # セット
        self.__acceleration = acceleration

    def getAcceleration(self):
        return self.__acceleration

    def setVelocity(self, velocity):
        # 引数チェック
        if type(velocity) is not np.ndarray:
            raise ValueError("速度はndarrayでなければなりません。")

        if velocity.size != 3:
            raise ValueError("速度は3次元ベクトルでなければなりません。")

        # セット
        self.__velocity = velocity

    def getVelocity(self):
        return self.__velocity

    def setPosition(self, position):
        # 引数チェック
        if type(position) is not np.ndarray:
            raise ValueError("位置はndarrayでなければなりません。")

        if position.size != 3:
            raise ValueError("位置は3次元ベクトルでなければなりません。")

        # セット
        self.__position = position

    def getPosition(self):
        return self.__position


class Field:
    __GRAVITATIONAL_CONSTANT = 6.67408e-11
    __TIME_STEP = 1.0e-3

    def __init__(self, points):
        self.__setStep(0)
        self.__setPoints(points)

    def __setPoints(self, points):
        # 引数チェック
        if type(points) is not list:
            raise ValueError("pointsはPointのリストでなければなりません。")
        for p in points:
            if type(p) is not Point:
                raise ValueError("pointsはPointのリストでなければなりません。")

        # セット
        self.__points = points

    def __getPoints(self):
        return self.__points

    def __setStep(self, step):
        # 引数チェック
        if type(step) is not int:
            raise ValueError("stepは整数でなければなりません。")

        # セット
        self.__step = step

    def getStep(self):
        return self.__step

    def showParameters(self):
        print("step: " + str(self.getStep()))

        i = 0
        for pp in self.__getPoints():
            print("point number: " + str(i))
            print(" M: " + str(pp.getMass()))
            print(" A: " + str(pp.getAcceleration()))
            print(" V: " + str(pp.getVelocity()))
            print(" X: " + str(pp.getPosition()))

            i += 1
        
        print("")

    def step(self):
        # 初期化
        length = len(self.__getPoints())
        force_vector_list = []
        for i in range(length):
            force_vector_list.append(np.asarray([0.0, 0.0, 0.0]))

        old_points = cp.deepcopy(self.__getPoints())

       # 万有引力ベクトルの導出
        def calc_force_vector(self, points, vectors, index):
           vectors[index] = np.asarray([0.0, 0.0, 0.0])
           v = points[index].getPosition()

           i = 0
           for pp in points:
                # 自分自身は除外する
                if i == index:
                    i += 1
                    continue

                vec = pp.getPosition() - v
                vectors[index] += self.__GRAVITATIONAL_CONSTANT * pp.getMass() * vec / np.power(np.linalg.norm(vec), 3)
                i += 1
        for i in range(length):
            calc_force_vector(self, old_points, force_vector_list, i)

        # リープ・フロッグ法で速度、変位を求める
        def leap_flog(self, points, vectors, index):
            p = points[index]

            pp_half = p.getVelocity() + (self.__TIME_STEP / 2.0) * p.getAcceleration()
            pp_x = p.getPosition() + self.__TIME_STEP * pp_half
            pp_v = p.getVelocity() + (self.__TIME_STEP * 2.0) * vectors[index]

            new_pp = self.__getPoints()[index]
            new_pp.setAcceleration(vectors[index])
            new_pp.setVelocity(pp_v)
            new_pp.setPosition(pp_x)
        for i in range(length):
            leap_flog(self, old_points, force_vector_list, i)

        # ステップ数を増やす
        self.__setStep(self.getStep() + 1)


def main():
    bodies = 100
    steps = 10

    z_vector = np.asarray([0.0, 0.0, 0.0])
    a = []
    rand_list = np.random.rand(bodies * 2) * 100.0
    for i in range(bodies):
        pos = np.asarray([rand_list[2 * i + 0], rand_list[2 * i + 1], 0.0])
        a.append(Point(1.0e+10, z_vector, z_vector, pos))

    # b = []
    # b.append(Point(1.0e+10, z_vector, z_vector, np.asarray([0.0, 0.0, 0.0])))
    # b.append(Point(1.0e+10, z_vector, z_vector, np.asarray([100.0, 0.0, 0.0])))

    f = Field(a)
    # f = Field(b)
    f.showParameters()
    start = time.time()
    for i in range(steps):
        f.step()
    end = time.time()
    f.showParameters()

    print(f"bodies: {bodies}, steps: {steps}")
    print(f"time: {(end - start) * 1000.0} [msec]")

    calc.step(a)


if __name__ == "__main__":
    main()
