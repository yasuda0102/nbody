"use strict";
var vertex_shader = "#version 300 es\n\nin float index;\nout vec4 old_p;\nout vec4 old_v;\nout vec4 old_a;\nout float index_fs;\nuniform sampler2D p;\nuniform sampler2D v;\nuniform sampler2D a;\n\nvoid main(void) {\n\tivec2 tex_index = ivec2(int(index), 0);\n\told_p = texelFetch(p, tex_index, 0);\n\told_v = texelFetch(v, tex_index, 0);\n\told_a = texelFetch(a, tex_index, 0);\n\n\tfloat max = float(textureSize(p, 0).x);\n\tfloat x_coord = (index / (max - 1.0)) * 2.0 - 1.0;\n\tif (x_coord < 1.0e-5) {\n\t\tx_coord += 1.0 / max;\n\t}\n\telse {\n\t\tx_coord -= 1.0 / max;\n\t}\n\tgl_Position = vec4(x_coord, 0.0, 0.0, 1.0);\n\tindex_fs = index;\n}\n";
var fragment_shader = "#version 300 es\n\nprecision mediump float;\n\nin float index_fs;\nin vec4 old_p;\nin vec4 old_v;\nin vec4 old_a;\nuniform sampler2D m;\nuniform sampler2D global_p;\nlayout(location = 0) out vec4 new_p;\nlayout(location = 1) out vec4 new_v;\nlayout(location = 2) out vec4 new_a;\n\nconst float G = 6.67408e-11;\nconst float TIME_STEP = 1.0;\n\nvoid main(void) {\n\tivec2 size = textureSize(global_p, 0);\n\tvec3 f = vec3(0.0, 0.0, 0.0);\n\n\t// \u4E07\u6709\u5F15\u529B\u8A08\u7B97\n\tfor (int i = 0; i < size.x; i++) {\n\t\tif (i == int(index_fs)) {\n\t\t\tcontinue;\n\t\t}\n\t\tivec2 pos = ivec2(i, 0);\n\t\tvec4 j_pos = texelFetch(global_p, pos, 0);\n\t\tfloat mm = texelFetch(m, pos, 0).x;\n\n\t\tvec3 distance = j_pos.xyz - old_p.xyz;\n\t\tfloat norm = sqrt(dot(distance, distance));\n\t\tfloat invnorm = 1.0 / pow(norm, 3.0);\n\t\tf += G * mm * invnorm * distance;\n\t}\n\n    // \u30EA\u30FC\u30D7\u30D5\u30ED\u30C3\u30B0\u6CD5\n    vec4 pp_half = old_v + vec4(TIME_STEP / 2.0) * old_a;\n    vec4 pp_p = old_p + TIME_STEP * pp_half;\n\tvec4 pp_v = old_v + (TIME_STEP * 2.0) * vec4(f, 0.0);\n\n    new_a = vec4(f, 0.0);\n    new_v = pp_v;\n    new_p = pp_p;\n}\n";
var vs_display = "#version 300 es\n\nuniform sampler2D p;\n\nvoid main(void) {\n\tivec2 pos = ivec2(gl_VertexID, 0);\n\tgl_Position = texelFetch(p, pos, 0);\n\tgl_PointSize = 4.0;\n}\n";
var fs_display = "#version 300 es\n\nprecision mediump float;\n\nout vec4 color;\n\nvoid main(void) {\n\tcolor = vec4(1.0, 0.0, 0.0, 1.0);\n}\n";
window.onload = function () {
    // WebGL 2.0コンテキストを取得する
    var canvas = document.getElementById("webgl");
    var gl = canvas.getContext("webgl2");
    // floatのテクスチャを有効にする
    if (gl.getExtension("OES_texture_float_linear") == null) {
        console.log("OES_texture_float_linear is not supported!");
        return;
    }
    if (gl.getExtension("EXT_color_buffer_float") == null) {
        console.log("EXT_color_buffer_float is not supported!");
        return;
    }
    // 定数
    var N = 512;
    // 背景を白にする
    var white = [1.0, 1.0, 1.0, 1.0];
    gl.clearBufferfv(gl.COLOR, 0, white);
    // データを用意する
    var index = [];
    var p = [];
    var v = [];
    var a = [];
    var m = [];
    for (var i = 0; i < N; i++) {
        index.push(i);
        p.push(2 * Math.random() - 1);
        p.push(2 * Math.random() - 1);
        p.push(0.0);
        p.push(1.0);
        for (var j = 0; j < 4; j++) {
            v.push(0);
            a.push(0);
        }
        m.push(1.0e+2);
    }
    var index_ = new Float32Array(index);
    var pp = new Float32Array(p);
    var vv = new Float32Array(v);
    var aa = new Float32Array(a);
    var mm = new Float32Array(m);
    // テクスチャを生成する
    var pp_tex = [];
    var vv_tex = [];
    var aa_tex = [];
    var mm_tex = [];
    pp_tex[0] = transfer_data(gl, pp, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    vv_tex[0] = transfer_data(gl, vv, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    aa_tex[0] = transfer_data(gl, aa, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    mm_tex[0] = transfer_data(gl, mm, 1, gl.R32F, gl.RED, gl.FLOAT);
    pp_tex[1] = transfer_data(gl, pp, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    vv_tex[1] = transfer_data(gl, vv, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    aa_tex[1] = transfer_data(gl, aa, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    // シェーダをコンパイル
    var vs = compile_shader(gl, gl.VERTEX_SHADER, vertex_shader);
    var fs = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_shader);
    var vs_d = compile_shader(gl, gl.VERTEX_SHADER, vs_display);
    var fs_d = compile_shader(gl, gl.FRAGMENT_SHADER, fs_display);
    // シェーダをリンクする
    var program = link_shader(gl, vs, fs, ["old_p", "gl_Position"]);
    var d_program = link_shader(gl, vs_d, fs_d, null);
    // Transform Feedback用のバッファを用意する
    var old_p_buffer = gl.createBuffer();
    if (old_p_buffer == null) {
        throw new Error();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, old_p_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, pp, gl.STREAM_READ);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, old_p_buffer);
    var p_buffer = gl.createBuffer();
    if (p_buffer == null) {
        throw new Error();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, p_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, pp, gl.STREAM_READ);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, p_buffer);
    var n = 0;
    swapping();
    function swapping() {
        // Transform Feedbackを使う
        var transform_feedback = gl.createTransformFeedback();
        if (transform_feedback == null) {
            throw new Error();
        }
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transform_feedback);
        // GPGPUシェーダを使用
        gl.useProgram(program);
        // in変数をVBOと関連付ける
        var index_buffer = gl.createBuffer();
        if (index_buffer == null) {
            throw new Error();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, index_, gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(program, "index");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 1, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // フレームバッファをバインドする
        var f = gl.createFramebuffer();
        if (f == null) {
            throw new Error();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        // テクスチャをレンダーターゲットに指定
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_tex[(n % 2) ? 0 : 1], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vv_tex[(n % 2) ? 0 : 1], 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, aa_tex[(n % 2) ? 0 : 1], 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
        // uniform変数とテクスチャを関連付ける
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pp_tex[(n % 2) ? 1 : 0]);
        gl.uniform1i(gl.getUniformLocation(program, "p"), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, vv_tex[(n % 2) ? 1 : 0]);
        gl.uniform1i(gl.getUniformLocation(program, "v"), 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, aa_tex[(n % 2) ? 1 : 0]);
        gl.uniform1i(gl.getUniformLocation(program, "a"), 2);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, mm_tex[0]);
        gl.uniform1i(gl.getUniformLocation(program, "m"), 3);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, pp_tex[(n % 2) ? 1 : 0]);
        gl.uniform1i(gl.getUniformLocation(program, "global_p"), 4);
        // Transform Feedbackによるデバッグ
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, old_p_buffer);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, p_buffer);
        // 描画命令
        gl.viewport(0, 0, N, 1);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, N);
        gl.endTransformFeedback();
        gl.flush();
        // // Transform Feedbackの内容を取り出す
        // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
        // gl.bindBuffer(gl.ARRAY_BUFFER, old_p_buffer);
        // let tf_buf1 = new Float32Array(p);
        // gl.getBufferSubData(gl.ARRAY_BUFFER, 0, tf_buf1);
        // gl.bindBuffer(gl.ARRAY_BUFFER, p_buffer);
        // let tf_buf2 = new Float32Array(p);
        // gl.getBufferSubData(gl.ARRAY_BUFFER, 0, tf_buf2);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // console.log(tf_buf1);
        // console.log(tf_buf2);
        // // フレームバッファから読み出し
        // gl.readBuffer(gl.COLOR_ATTACHMENT0);
        // let reading_buffer: Float32Array = new Float32Array(N * 4);
        // gl.readPixels(0, 0, N, 1, gl.RGBA, gl.FLOAT, reading_buffer);
        // console.log(reading_buffer);
        // 結果をスクリーンに描画する
        gl.useProgram(d_program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pp_tex[(n % 2) ? 1 : 0]);
        gl.uniform1i(gl.getUniformLocation(d_program, "p"), 0);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.drawArrays(gl.POINTS, 0, N);
        if (n == 0) {
            n = 1;
        }
        else {
            n = 0;
        }
        requestAnimationFrame(swapping);
    }
};
function transfer_data(gl, list, dimension, iformat, format, type) {
    var tex = gl.createTexture();
    if (tex == null) {
        throw new Error();
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, iformat, list.length / dimension, 1, 0, format, type, list);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
}
function compile_shader(gl, type, source) {
    var s = gl.createShader(type);
    if (s == null) {
        throw new Error();
    }
    gl.shaderSource(s, source);
    gl.compileShader(s);
    console.log(gl.getShaderInfoLog(s));
    return s;
}
function link_shader(gl, vs, fs, tf_list) {
    var p = gl.createProgram();
    if (p == null) {
        throw new Error();
    }
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    if (tf_list != null) {
        gl.transformFeedbackVaryings(p, tf_list, gl.SEPARATE_ATTRIBS);
    }
    gl.linkProgram(p);
    return p;
}
