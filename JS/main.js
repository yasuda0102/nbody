const G = 6.67408e-11;
const TIME_STEP = 1.0e-3;

let points = [];
let force_list = [];

class Vec3 {
    constructor(x, y, z) {
        this.vector = [];
        this.vector[0] = x;
        this.vector[1] = y;
        this.vector[2] = z;
    }

    set(x, y, z) {
        this.vector[0] = x;
        this.vector[1] = y;
        this.vector[2] = z;
    }

    get() {
        return [this.vector[0], this.vector[1], this.vector[2]];
    }

    static add(a, b) { 
        return new Vec3(
            a.vector[0] + b.vector[0],
            a.vector[1] + b.vector[1], 
            a.vector[2] + b.vector[2]
        );
    }

    add(a) {
        this.vector[0] += a.vector[0];
        this.vector[1] += a.vector[1];
        this.vector[2] += a.vector[2];
    }

    static sub(a, b) {
        return new Vec3(
            a.vector[0] - b.vector[0],
            a.vector[1] - b.vector[1],
            a.vector[2] - b.vector[2]
        );
    }

    sub(a) {
        this.vector[0] -= a.vector[0];
        this.vector[1] -= a.vector[1];
        this.vector[2] -= a.vector[2];
    }

    static mul(a, v) {
        return new Vec3(
            a * v.vector[0],
            a * v.vector[1],
            a * v.vector[2]
        );
    }

    mul(a) {
        this.vector[0] *= a;
        this.vector[1] *= a;
        this.vector[2] *= a;
    }

    static dot(a, b) {
        return a.vector[0] * b.vector[0] + a.vector[1] * b.vector[1] + a.vector[2] * b.vector[2];
    }

    normalize() {
        return this.mul(1 / Math.sqrt(this.vector[0] * this.vector[0] + 
                                      this.vector[1] * this.vector[1] + 
                                      this.vector[2] * this.vector[2]), this);
    }
}



class Point {
    constructor(m, a, v, p) {
        this.m = m;
        this.a = a;
        this.v = v;
        this.p = p;
    }

    getM() {
        return this.m;
    }

    getA() {
        return this.a;
    }

    setA(a) {
        this.a = a;
    }

    getV() {
        return this.v;
    }

    setV(v) {
        this.v = v;
    }

    getP() {
        return this.p;
    }

    setP(p) {
        this.p = p;
    }
}

calc_force_vector = (points, force_list) => {
    let v = new Vec3(0.0 ,0.0, 0.0);

    for(let i = 0; i < points.length; i++) {
        force_list.push(new Vec3(0.0, 0.0, 0.0));
        force_list[i].set(0.0, 0.0, 0.0);
        for (let j = 0; j < points.length; j++) {
            if (points[i] == points[j]) {
                continue;
            }

            distance = Vec3.sub(points[j].getP(), points[i].getP());
            norm = Math.pow(Math.sqrt(Vec3.dot(distance, distance)), 3.0);
            force_list[i].add(Vec3.mul(1.0 / norm, Vec3.mul(G * points[j].getM(), distance)));
        }
    }
}

leap_flog = (force_list, points) => {
    for (let i = 0; i < points.length; i++) {
        let pp_half = Vec3.add(points[i].getV(), Vec3.mul(TIME_STEP / 2.0, points[i].getA()));
        pp_x = Vec3.add(points[i].getP(), Vec3.mul(TIME_STEP, pp_half));
        pp_v = Vec3.add(points[i].getV(), Vec3.mul(TIME_STEP * 2.0, force_list[i]));

        points[i].setA(force_list[i]);
        points[i].setV(pp_v);
        points[i].setP(pp_x);
    }
}

window.onload = () => {
    let z = new Vec3(0.0, 0.0, 0.0);
    let p = new Vec3(100.0, 0.0, 0.0);
    points = [
        new Point(1.0e+10, z, z, z),
        new Point(1.0e+10, z, z, p)
    ]

    for (let i = 0; i < 100; i++) {
        force_list = [];
        calc_force_vector(points, force_list);
        leap_flog(force_list, points);
    }
}