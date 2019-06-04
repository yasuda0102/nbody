#!/usr/bin/python3


class Point:
    def __init__(self, mass, acceleration, velocity, position):
        self.__mass = mass
        self.__acceleration = acceleration
        self.__velocity = velocity
        self.__position = position

    def getMass(self):
        return self.__mass

    def getAcceleration(self):
        return self.__acceleration

    def setAcceleration(self, acceleration):
        self.__acceleration = acceleration

    def getVelocity(self):
        return self.__velocity

    def setVelocity(self, velocity):
        self.__velocity = velocity

    def getPosition(self):
        return self.__position

    def setPosition(self, position):
        self.__position = position


class Field:
    def __init__(self, points):
        self.__points = points

