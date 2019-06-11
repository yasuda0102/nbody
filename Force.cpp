#include <string.h>
#include <vector>
#include <math.h>
#include <stdio.h>
#include <chrono>
#include <random>
#include <omp.h>
#include <boost/python/numpy.hpp>
#include <boost/python/suite/indexing/vector_indexing_suite.hpp>

using namespace std;
namespace p = boost::python;
namespace np = boost::python::numpy;

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
    Point() {
        this->mass = 0.0;
        memset(&(this->a), 0, sizeof(vec3));
        memset(&(this->v), 0, sizeof(vec3));
        memset(&(this->p), 0, sizeof(vec3));
    }

    Point(const double mass, const vec3 a, const vec3 v, const vec3 p) {
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

    void setMass(const double m) {
        this->mass = m;
    }

    void setA(const vec3 &a) {
        this->a = a;
    }

    void setV(const vec3 &v) {
        this->v = v;
    }

    void setP(const vec3 &p) {
        this->p = p;
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
    vector<vec3> *v = new vector<vec3>(p->size());

    #pragma omp parallel for
    for (int i = 0; i < p->size(); i++) {
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

    vector<Point> *pp = new vector<Point>(p->size());

    #pragma omp parallel for
    for (int i = 0; i < p->size(); i++) {
        vec3 pp_half = (*p)[i].getV() + (TIME_STEP / 2.0) * (*p)[i].getA();
        vec3 pp_x = (*p)[i].getP() + TIME_STEP * pp_half;
        vec3 pp_v = (*p)[i].getV() + (TIME_STEP * 2.0) * (*force_list)[i];

        (*pp)[i] = *new Point((*p)[i].getMass(), (*force_list)[i], pp_v, pp_x);
    }

    return pp;
}

void step(vector<Point> *points) {
    vector<vec3> *force_list = NULL;
    vector<Point> *l = new vector<Point>();

    force_list = calc_force_vector(l);
    vector<Point> *new_point = leap_flog(l, force_list);

    delete l;
    delete force_list;
    force_list = NULL;

    *points = *new_point;
}

BOOST_PYTHON_MODULE(calc) {
    using namespace boost::python;

    def("step", &step);

    class_<vec3>("vec3", init<const double, const double, const double>());

    class_<Point>("Point", init<const double, const vec3, const vec3, const vec3>())
        .def("getA", &Point::getA)
        .def("getV", &Point::getV)
        .def("getP", &Point::getP);
}