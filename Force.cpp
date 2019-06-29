#include <string.h>
#include <vector>
#include <math.h>
#include <stdio.h>
#include <chrono>
#include <random>
#include <omp.h>
#include <boost/python/numpy.hpp>

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

    double X() const {
        return this->vector[0];
    }

    double Y() const {
        return this->vector[1];
    }

    double Z() const {
        return this->vector[2];
    }

    void print() const {
        printf("%lf %lf %lf", this->X(), this->Y(), this->Z());
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

    double getMass() const {
        return this->mass;
    }

    vec3 getA() const {
        return this->a;
    }

    vec3 getV() const {
        return this->v;
    }

    vec3 getP() const {
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

class Points {
private:
    vector<Point> point_list;

public:
    Points(const int size) {
        this->point_list.resize(size);
    }

    void push(Point p, int i) {
        point_list[i] = p;
    }

    Point get(int i) const {
        return point_list[i];
    }

    int size() const {
        return point_list.size();
    }

    void print() const {
        for (int i = 0; i < this->point_list.size(); i++) {
            printf("Number: %d\n", i);
            printf("M: %lf\n", this->point_list[i].getMass());
            printf("A: %lf %lf %lf\n", this->point_list[i].getA().X(), 
                                       this->point_list[i].getA().Y(), 
                                       this->point_list[i].getA().Z());
            printf("V: %lf %lf %lf\n", this->point_list[i].getV().X(), 
                                       this->point_list[i].getV().Y(), 
                                       this->point_list[i].getV().Z());
            printf("P: %lf %lf %lf\n", this->point_list[i].getP().X(), 
                                       this->point_list[i].getP().Y(), 
                                       this->point_list[i].getP().Z());
            printf("\n");
        }

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

bool operator==(const vec3 &a, const vec3 &b) {
    if (a.vector[0] == b.vector[0] &&
        a.vector[1] == b.vector[1] &&
        a.vector[2] == b.vector[2]) {
            return true;
        }
        else {
            return false;
        }
}

bool operator==(const Point &a, const Point &b) {
    if (a.getMass() == b.getMass() &&
        a.getA() == b.getA() &&
        a.getV() == b.getV() &&
        a.getP() == b.getP()) {
            return true;
        }
        else {
            return false;
        }

}

vector<vec3> calc_force_vector(Points &p) {
    const double G = 6.67408e-11;
    vector<vec3> v(p.size());

    #pragma omp parallel for
    for (int i = 0; i < p.size(); i++) {
        for (int j = 0; j < p.size(); j++) {
            if (i == j) {
                continue;
            }

            vec3 vec = p.get(j).getP() - p.get(i).getP();
            double f = G * p.get(j).getMass() / pow(vec.norm(), 3);
            vec3 force = f * vec;
            v[i] += force;
        }
    }

    return v;
}

Points leap_flog(Points &p, vector<vec3> &force_list) {
    const double TIME_STEP = 10e-3;

    Points pp(p.size());

    #pragma omp parallel for
    for (int i = 0; i < p.size(); i++) {
        vec3 pp_half = p.get(i).getV() + (TIME_STEP / 2.0) * p.get(i).getA();
        vec3 pp_x = p.get(i).getP() + TIME_STEP * pp_half;
        vec3 pp_v = p.get(i).getV() + (TIME_STEP * 2.0) * force_list[i];

        Point new_p(p.get(i).getMass(), force_list[i], pp_v, pp_x);
        pp.push(new_p, i);
    }

    return pp;
}

void step(Points &points) {
    vector<vec3> force_list = calc_force_vector(points);
    Points new_point = leap_flog(points, force_list);

    points = new_point;
}

BOOST_PYTHON_MODULE(calc) {
    using namespace boost::python;

    def("step", &step);

    class_<vec3>("vec3", init<const double, const double, const double>())
        .def("X", &vec3::X)
        .def("Y", &vec3::Y)
        .def("Z", &vec3::Z)
        .def("print", &vec3::print);

    class_<Point>("Point", init<const double, const vec3, const vec3, const vec3>())
        .def("getMass", &Point::getMass)
        .def("getA", &Point::getA)
        .def("getV", &Point::getV)
        .def("getP", &Point::getP);

    class_<Points>("Points", init<const int>())
        .def("push", &Points::push)
        .def("get", &Points::get)
        .def("size", &Points::size)
        .def("print", &Points::print);
}