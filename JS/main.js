const G = 6.67408e-11;
const TIME_STEP = 1.0e-3;

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

    add(a, b) { 
        return new Vec3(
            a.vector[0] + b.vector[0],
            a.vector[1] + b.vector[1], 
            a.vector[2] + b.vector[2]
        );
    }

    sub(a, b) {
        return new Vec3(
            a.vector[0] - b.vector[0],
            a.vector[1] - b.vector[1],
            a.vector[2] - b.vector[2]
        );
    }

    mul(a, v) {
        return new Vec3(
            a * v.vector[0],
            a * v.vector[1],
            a * v.vector[2]
        );
    }

    dot(a, b) {
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
    v = new Vec3(0.0 ,0.0, 0.0);
    tmp = new Vec3(0.0, 0.0, 0.0);

    for(let i = 0; i < points.length; i++) {
        force_list.push(new Vec3(0.0, 0.0, 0.0));
        for (let j = 0; j < points.length; j++) {
            if (points[i] == points[j]) {
                continue;
            }

            d = tmp.sub(points[j].getP(), points[i].getP());
            norm = Math.pow(Math.sqrt(tmp.dot(d, d)), 3.0);
            v = tmp.add(v, tmp.mul(1.0 / norm, tmp.mul(G * points[j].getM(), d)));
        }
        force_list[i] = v;
    }
}

window.onload = () => {
    z = new Vec3(0.0, 0.0, 0.0);
    p = new Vec3(100.0, 0.0, 0.0);
    points = [
        new Point(1.0e+10, z, z, z),
        new Point(1.0e+10, z, z, p)
    ]
    calc_force_vector(points, force_list);
}