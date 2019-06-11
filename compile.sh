#!/bin/bash

g++ -g3 `python3-config --cflags` -DPIC -shared -fPIC -fopenmp -o calc.so Force.cpp `python3-config --ldflags` -lboost_python3
