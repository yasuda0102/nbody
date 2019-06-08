#!/usr/bin/python3

import numpy as np
import copy as cp

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

    def __setPoint(self, point, index):
        # 引数チェック
        if type(point) is not Point:
            raise ValueError("pointsの要素はPointでなければなりません。")

        if (type(index) is not int) or (index < 0):
            raise ValueError("indexは正の整数でなければなりません。")

        # セット
        self.__points[index] = point
    
    def __getPoint(self, index):
        # 引数チェック
        if (type(index) is not int) or (index < 0):
            raise ValueError("indexは正の整数でなければなりません。")

        return self.__points[index]

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
        old_points = cp.deepcopy(self.__points)
        force_vector_list = []

        # 万有引力ベクトルの導出
        i = 0
        for pp in old_points:
            force_vector_list.append(0.0)

            for pp2 in old_points:
                # 自分自身は除外する
                if pp is pp2:
                    continue

                vec = pp.getPosition() - pp2.getPosition()
                force_vector_list[i] += self.__GRAVITATIONAL_CONSTANT * pp2.getMass() * vec / np.power(np.linalg.norm(vec), 3)

            i += 1

        # リープ・フロッグ法で速度、変位を求める
        i = 0
        for pp in old_points:
            pp_half = pp.getVelocity() + (self.__TIME_STEP / 2.0) * pp.getAcceleration()
            pp_x = pp.getPosition() + self.__TIME_STEP * pp_half
            pp_v = pp.getVelocity() + (self.__TIME_STEP * 2.0) * force_vector_list[i]

            self.__points[i].setAcceleration(force_vector_list[i])
            self.__points[i].setVelocity(pp_v)
            self.__points[i].setPosition(pp_x)

            i = i + 1

        # ステップ数を増やす
        self.__setStep(self.getStep() + 1)


def main():
    a = []
    a.append(Point(10.0, np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0])))
    a.append(Point(10.0, np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0]), np.asarray([100.0, 0.0, 0.0])))

    f = Field(a)
    f.showParameters()
    for i in range(100):
        f.step()
    f.showParameters()


if __name__ == "__main__":
    main()
