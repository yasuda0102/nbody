#!/usr/bin/python3

import numpy as np

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
        if acceleration is not np.ndarray:
            raise ValueError("加速度はndarrayでなければなりません。")
        
        if acceleration.size != 3:
            raise ValueError("加速度は3次元ベクトルでなければなりません。")
        
        # セット
        self.__acceleration = acceleration

    def getAcceleration(self):
        return self.__acceleration

    def setVelocity(self, velocity):
        # 引数チェック
        if velocity is not np.ndarray:
            raise ValueError("速度はndarrayでなければなりません。")
        
        if velocity.size != 3:
            raise ValueError("速度は3次元ベクトルでなければなりません。")
        
        # セット
        self.__velocity = velocity

    def getVelocity(self):
        return self.__velocity

    def setPosition(self, position):
        # 引数チェック
        if position is not np.ndarray:
            raise ValueError("位置はndarrayでなければなりません。")
        
        if position.size != 3:
            raise ValueError("位置は3次元ベクトルでなければなりません。")
        
        # セット
        self.__position = position

    def getPosition(self):
        return self.__position

class Field:
    def __init__(self, points):
        self.__points = points

def main():
    print("test")

if __name__ == "__main__":
    main()