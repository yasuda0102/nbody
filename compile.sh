g++ -g3 `python3-config --cflags` -DPIC -shared -fPIC -fopenmp -o calc.so Force.cpp -lboost_python3 `python3-config --ldflags`
