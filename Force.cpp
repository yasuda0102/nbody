#include <string.h>
#include <vector>
#include <math.h>
#include <stdio.h>

using namespace std;

class vec3 {
public:
    double vector[3];

    vec3() {
        memset(&(this->vector), 0, sizeof(double) * 3);
    }

    vec3(const double x, const double y, const double z) {
        this->vector[0] = x;
        this->vector[1] = y;
        this->vector[2] = z;
    }

    vec3(const double v[3]) {
        memcpy(&(this->vector), v, sizeof(double) * 3);
    }

    vec3 &operator+=(const vec3 &a) {
        this->vector[0] += a.vector[0];
        this->vector[1] += a.vector[1];
        this->vector[2] += a.vector[2];

        return *this;
    }

    double norm() {
        return sqrt(this->vector[0] * this->vector[0] + 
                    this->vector[1] * this->vector[1] +
                    this->vector[2] * this->vector[2]);
    }
};

class Point {
private:
    double mass;
    double a[3];
    double v[3];
    double p[3];

public:
    Point(double mass, double a[3], double v[3], double p[3]) {
        this->mass = mass;
        memcpy(&(this->a), a, sizeof(double) * 3);
        memcpy(&(this->v), v, sizeof(double) * 3);
        memcpy(&(this->p), p, sizeof(double) * 3);
    }

    double getMass() {
        return this->mass;
    }

    vec3 getA() {
        return this->a;
    }

    vec3 getV() {
        return this->v;
    }

    vec3 getP() {
        return this->p;
    }
};

vec3 operator-(const vec3 &a, const vec3 &b) {
    vec3 result;

    result.vector[0] = a.vector[0] - b.vector[0];
    result.vector[1] = a.vector[1] - b.vector[1];
    result.vector[1] = a.vector[1] - b.vector[1];

    return result;
}

vec3 operator*(const double a, const vec3 &b) {
    vec3 result;

    result.vector[0] = a * b.vector[0];
    result.vector[1] = a * b.vector[1];
    result.vector[2] = a * b.vector[2];

    return result;
}

vector<vec3> *calc_force_vector(Point *p, int n) {
    const double G = 6.67408e-11;
    vector<vec3> *v = new vector<vec3>();

    for (int i = 0; i < n; i++) {
        v->push_back(vec3());
        for (int j = 0; j < n; j++) {
            if (i == j) {
                continue;
            }

            vec3 vec = p[j].getP() - p[i].getP();
            double f = G * p[j].getMass() / pow(vec.norm(), 3);
            vec3 force = f * vec;
            v->operator[](i) += force;
        }
    }

    return v;
}

vector<vec3> *leap_flog(Point *p, int n) {
    return NULL;
}

int main(void) {
    double m = 1.0e+10;
    double a[3] = {0.0, 0.0, 0.0};
    double v[3] = {0.0, 0.0, 0.0};
    double p1[3] = {0.0, 0.0, 0.0};
    double p2[3] = {100.0, 0.0, 0.0};

    Point x(m, a, v, p1);
    Point y(m, a, v, p2);
    Point l[2] = {x, y};
    vector<vec3> *force_list = NULL;

    force_list = calc_force_vector(l, 2);
    if (force_list == NULL) {
        return -1;
    }
    for (int i = 0; i < force_list->size(); i++) {
        printf("[%e %e %e]\n", force_list->operator[](i).vector[0], 
                               force_list->operator[](i).vector[1], 
                               force_list->operator[](i).vector[2]);
        
    }
}