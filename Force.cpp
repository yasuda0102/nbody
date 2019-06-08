#include <string.h>
#include <vector>
#include <math.h>
#include <stdio.h>
#include <chrono>

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

    vec3 &operator=(const vec3 &a) {
        this->vector[0] = a.vector[0];
        this->vector[1] = a.vector[1];
        this->vector[2] = a.vector[2];

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
    vec3 a;
    vec3 v;
    vec3 p;

public:
    Point(double mass, vec3 &a, vec3 &v, vec3 &p) {
        this->mass = mass;
        memcpy(&(this->a), &a, sizeof(vec3));
        memcpy(&(this->v), &v, sizeof(vec3));
        memcpy(&(this->p), &p, sizeof(vec3));
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

vec3 operator+(const vec3 &a, const vec3 &b) {
    vec3 result;

    result.vector[0] = a.vector[0] + b.vector[0];
    result.vector[1] = a.vector[1] + b.vector[1];
    result.vector[2] = a.vector[2] + b.vector[2];

    return result;
}

vector<vec3> *calc_force_vector(vector<Point> *p) {
    const double G = 6.67408e-11;
    vector<vec3> *v = new vector<vec3>();

    for (int i = 0; i < p->size(); i++) {
        v->push_back(vec3());
        for (int j = 0; j < p->size(); j++) {
            if (i == j) {
                continue;
            }

            vec3 vec = (*p)[j].getP() - (*p)[i].getP();
            double f = G * (*p)[i].getMass() / pow(vec.norm(), 3);
            vec3 force = f * vec;
            (*v)[i] += force;
        }
    }

    return v;
}

vector<Point> *leap_flog(vector<Point> *p, vector<vec3> *force_list) {
    const double TIME_STEP = 10e-3;

    vector<Point>*pp = new vector<Point>();

    for (int i = 0; i < p->size(); i++) {
        vec3 pp_half = (*p)[i].getV() + (TIME_STEP / 2.0) * (*p)[i].getA();
        vec3 pp_x = (*p)[i].getP() + TIME_STEP * pp_half;
        vec3 pp_v = (*p)[i].getV() + (TIME_STEP * 2.0) * (*force_list)[i];

        pp->push_back(*new Point((*p)[i].getMass(), (*force_list)[i], pp_v, pp_x));
    }

    return pp;
}

int main(void) {
    double m = 1.0e+10;
    vec3 a = {0.0, 0.0, 0.0};
    vec3 v = {0.0, 0.0, 0.0};
    vec3 p1 = {0.0, 0.0, 0.0};
    vec3 p2 = {100.0, 0.0, 0.0};

    Point *x = new Point(m, a, v, p1);
    Point *y = new Point(m, a, v, p2);
    vector<Point> *l = new vector<Point>();
    l->push_back(*x);
    l->push_back(*y);
    vector<vec3> *force_list = NULL;

    auto start = chrono::system_clock::now();
    for (int i = 0; i < 100; i++) {
        force_list = calc_force_vector(l);
        vector<Point> *new_point = leap_flog(l, force_list);

        
        delete l;
        delete force_list;
        force_list = NULL;

        l = new_point;
    }
    auto end = chrono::system_clock::now();
    auto usec = chrono::duration_cast<chrono::microseconds>(end - start).count();
    printf("%ld [usec]\n", usec);

    for (int i = 0; i < l->size(); i++) {
        printf("[%e %e %e]\n", (*l)[i].getP().vector[0], 
                               (*l)[i].getP().vector[1], 
                               (*l)[i].getP().vector[2]);
    }
}