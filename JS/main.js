const G = 6.67408e-11;
const TIME_STEP = 1.0e-3;

let points = [];
let force_list = [];
let force;

const compute_force_shader = `#version 300 es

in float m;
in vec3 old_a;
in vec3 old_v;
in vec3 old_p;
out vec3 new_a;
out vec3 new_v;
out vec3 new_p;
uniform sampler2D tex_p;

const float G = 6.67408e-11;
const float TIME_STEP = 1.0e-3;

void main(void) {
    ivec2 size = textureSize(tex_p, 0);
    vec3 f = vec3(0.0, 0.0, 0.0);

    // 万有引力計算
    for (int i = 0; i < size.x; i++) {
        if (gl_VertexID == i) {
            continue;
        }

        ivec2 pos = ivec2(i, 0);
        vec4 j_pos = texelFetch(tex_p, pos, 0);

        vec3 distance = j_pos.xyz - old_p;
        float norm = sqrt(dot(distance, distance));
        float invnorm = 1.0 / pow(norm, 3.0);
        f += G * m * invnorm * distance;
    }

    // リープフロッグ法
    vec3 pp_half = old_v + vec3(TIME_STEP / 2.0) * old_a;
    vec3 pp_p = old_p + TIME_STEP * pp_half;
    vec3 pp_v = old_v + (TIME_STEP * 2.0) * f;

    new_a = f;
    new_v = pp_v;
    new_p = pp_p;
}
`;

const f_shader_nop = `#version 300 es

precision mediump float;

out vec4 o;

void main(void) {
    o = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

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

let link_shader = (gl, vertex, fragment, tf_list) => {
    let p = gl.createProgram();

    gl.attachShader(p, vertex);
    gl.attachShader(p, fragment);

    if (tf_list.length != 0) {
        gl.transformFeedbackVaryings(p, tf_list, gl.SEPARATE_ATTRIBS);
    }

    gl.linkProgram(p);
    gl.useProgram(p);

    return p;
}

let transfer_data = (gl, program, list, dimension, attribstr, mode) => {
    let f32 = new Float32Array(list);

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode, 0);
    
    if (attribstr != null) {
        let location = gl.getAttribLocation(program, attribstr);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, dimension, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}

let transfer_texdata = (gl, program, list, dimension, iformat, format, type, attribstr) => {
    let f32 = new Float32Array(list);

    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, iformat, f32.length / dimension, 1, 0, format, type,
                  f32);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
    let of = gl.getUniformLocation(program, attribstr);
    gl.uniform1i(of, 0);

    return tex;
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

    // 重力計算用バーテックスシェーダを使ってみる
    let transformFeedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    let vv = compile_shader(gl, gl.VERTEX_SHADER, compute_force_shader);
    let ff = compile_shader(gl, gl.FRAGMENT_SHADER, f_shader_nop);

    let pp = link_shader(gl, vv, ff, ["new_a", "new_v", "new_p"]);

    let p = [0.0, 0.0, 0.0, 100.0, 0.0, 0.0];
    let v = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    let a = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    let m = [1.0e+10, 1.0e+10];
    force = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    let p_buffer = [];
    let v_buffer = [];
    let a_buffer = [];
    let m_buffer = transfer_data(gl, pp, m, 1, "m", gl.STATIC_DRAW);
    p_buffer[0] = transfer_data(gl, pp, p, 3, "old_a", gl.STATIC_DRAW);
    v_buffer[0] = transfer_data(gl, pp, v, 3, "old_v", gl.STATIC_DRAW);
    a_buffer[0] = transfer_data(gl, pp, a, 3, "old_a", gl.STATIC_DRAW);
    p_buffer[1] = transfer_data(gl, pp, p, 3, null, gl.STREAM_READ);
    v_buffer[1] = transfer_data(gl, pp, v, 3, null, gl.STREAM_READ);
    a_buffer[1] = transfer_data(gl, pp, a, 3, null, gl.STREAM_READ);
    let p_texture = transfer_texdata(gl, pp, p, 3, gl.RGB32F, gl.RGB, gl.FLOAT, "tex_p");

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, a_buffer[1]);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, v_buffer[1]);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, p_buffer[1]);

    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, m.length);
    gl.endTransformFeedback();

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, a_buffer[1]);
    let force_float = new Float32Array(force);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, force_float);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    for (let i = 0; i < force_float.length; i++) {
        force[i] = force_float[i];
    }

}