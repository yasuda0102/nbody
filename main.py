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
    GRAVITATIONAL_CONSTANT = 6.67408e-11
    TIME_STEP = 1.0e-3

    def __init__(self, points):
        # 引数チェック
        if type(points) is not list:
            raise ValueError("pointsはPointのリストでなければなりません。")
        for p in points:
            if type(p) is not Point:
                raise ValueError("pointsはPointのリストでなければなりません。")
        
        # セット
        self.__points = points
    
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
                force_vector_list[i] += self.GRAVITATIONAL_CONSTANT * pp2.getMass() * vec / np.power(np.linalg.norm(vec), 3)

            i = i + 1
        

def main():
    a = []
    a.append(Point(10.0, np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0])))
    a.append(Point(10.0, np.asarray([0.0, 0.0, 0.0]), np.asarray([0.0, 0.0, 0.0]), np.asarray([100.0, 0.0, 0.0])))

    f = Field(a)
    f.step()

if __name__ == "__main__":
    main()