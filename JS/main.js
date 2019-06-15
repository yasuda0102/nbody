const G = 6.67408e-11;
const TIME_STEP = 1.0e-3;

let points = [];
let force_list = [];

const v_shader = "#version 300 es \n\
in vec3 a; \n\
\n\
void main(void) { \n\
    gl_Position = vec4(a, 1.0);\n\
    gl_PointSize = 2.0;\n\
} \n\
";

const f_shader = "#version 300 es \n\
\n\
precision mediump float;\n\
\n\
out vec4 color;\n\
\n\
void main(void) { \n\
    color = vec4(0.0, 0.0, 0.0, 1.0); \n\
} \n\
";

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

let calc_force_vector = (points, force_list) => {
    for(let i = 0; i < points.length; i++) {
        force_list.push(new Vec3(0.0, 0.0, 0.0));
        force_list[i].set(0.0, 0.0, 0.0);
        for (let j = 0; j < points.length; j++) {
            if (points[i] == points[j]) {
                continue;
            }

            let distance = Vec3.sub(points[j].getP(), points[i].getP());
            let norm = Math.pow(Math.sqrt(Vec3.dot(distance, distance)), 3.0);
            force_list[i].add(Vec3.mul(1.0 / norm, Vec3.mul(G * points[j].getM(), distance)));
        }
    }
}

let leap_flog = (force_list, points) => {
    for (let i = 0; i < points.length; i++) {
        let pp_half = Vec3.add(points[i].getV(), Vec3.mul(TIME_STEP / 2.0, points[i].getA()));
        let pp_x = Vec3.add(points[i].getP(), Vec3.mul(TIME_STEP, pp_half));
        let pp_v = Vec3.add(points[i].getV(), Vec3.mul(TIME_STEP * 2.0, force_list[i]));

        points[i].setA(force_list[i]);
        points[i].setV(pp_v);
        points[i].setP(pp_x);
    }
}

let compile_shader = (gl, type, source) => {
    let v = gl.createShader(type);

    gl.shaderSource(v, source);
    gl.compileShader(v);
   console.log(gl.getShaderInfoLog(v));

    return v;
}

let link_shader = (gl, vertex, fragment) => {
    let p = gl.createProgram();

    gl.attachShader(p, vertex);
    gl.attachShader(p, fragment);

    gl.linkProgram(p);
    gl.useProgram(p);

    return p;
}

window.onload = () => {
    const N = 100;
    const STEP = 100;

    const z = new Vec3(0.0, 0.0, 0.0);
    points = [];
    for (let i = 0; i < N; i++) {
        points.push(new Point(10e+10, z, z, new Vec3(Math.random() * 100.0, Math.random() * 100.0, 0.0)));
    }

    const start = performance.now();
    for (let i = 0; i < STEP; i++) {
        force_list = [];
        calc_force_vector(points, force_list);
        leap_flog(force_list, points);
    }
    const end = performance.now();
    const elapsed = end - start;
    const elapsedStr = elapsed.toPrecision(5);
    console.log(elapsedStr);

    // WebGL 2.0のテスト
    const canvas = document.getElementById("webgl");
    let gl;
    try {
        gl = canvas.getContext("webgl2");
    }
    catch (e) {
        console.log("WebGL 2.0 is disabled!");
    }

    let white = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    gl.clearBufferfv(gl.COLOR, 0, white);

    const vert = compile_shader(gl, gl.VERTEX_SHADER, v_shader);
    const frag = compile_shader(gl, gl.FRAGMENT_SHADER, f_shader);

    const program = link_shader(gl, vert, frag);

    let pos = [];
    for (let i = 0; i < 100; i++) {
        pos.push((Math.random() * 2.0) - 1.0);
        pos.push((Math.random() * 2.0) - 1.0);
        pos.push(0.0);
    }
    let vertex_pos = new Float32Array(pos);
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertex_pos, gl.STATIC_DRAW, 0);

    let a = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, 100);

    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);

}