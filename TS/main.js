var vertex_shader = "#version 300 es\n\nin float index;\nout vec4 old_p;\nout vec4 old_v;\nout vec4 old_a;\nuniform sampler2D p;\nuniform sampler2D v;\nuniform sampler2D a;\n\nvoid main(void) {\n\tivec2 tex_index = ivec2(int(index), 0);\n\told_p = texelFetch(p, tex_index, 0);\n\told_v = texelFetch(v, tex_index, 0);\n\told_a = texelFetch(a, tex_index, 0);\n\n\tfloat max = float(textureSize(p, 0).x);\n\tfloat x_coord = (index / max) * 2.0 - 1.0;\n\tgl_Position = vec4(x_coord, 0.0, 0.0, 1.0);\n}\n";
var fragment_shader = "#version 300 es\n\nprecision mediump float;\n\nin vec4 old_p;\nin vec4 old_v;\nin vec4 old_a;\nuniform sampler2D m;\nuniform sampler2D global_p;\nlayout(location = 0) out vec4 new_p;\nlayout(location = 1) out vec4 new_v;\nlayout(location = 2) out vec4 new_a;\n\nconst float G = 6.67408e-11;\nconst float TIME_STEP = 1.0e-3;\n\nvoid main(void) {\n\tivec2 size = textureSize(global_p, 0);\n\tvec3 f = vec3(0.0, 0.0, 0.0);\n\n\t// \u4E07\u6709\u5F15\u529B\u8A08\u7B97\n\tfor (int i = 0; i < size.x; i++) {\n\t\tivec2 pos = ivec2(i, 0);\n\t\tvec4 j_pos = texelFetch(global_p, pos, 0);\n\t\tfloat mm = texelFetch(m, pos, 0).x;\n\n\t\tvec3 distance = j_pos.xyz - old_p.xyz;\n\t\tfloat norm = sqrt(dot(distance, distance));\n\t\tif (norm == 0.0) {\n\t\t\tcontinue;\n\t\t}\n\t\tfloat invnorm = 1.0 / pow(norm, 3.0);\n\t\tf += G * mm * invnorm * distance;\n\t}\n\n\tnew_p = vec4(1.0, 1.0, 1.0, 1.0);\n\tnew_v = vec4(0.0, 0.0, 0.0, 1.0);\n\tnew_a = vec4(f, 0.0);\n}\n";
window.onload = function () {
    // WebGL 2.0コンテキストを取得する
    var canvas = document.getElementById("webgl");
    var gl;
    try {
        gl = canvas.getContext("webgl2");
    }
    catch (e) {
        console.log("WebGL 2.0 is disabled!");
    }
    // floatのテクスチャを有効にする
    if (gl.getExtension("OES_texture_float_linear") == null) {
        console.log("OES_texture_float_linear is not supported!");
    }
    if (gl.getExtension("EXT_color_buffer_float") == null) {
        console.log("EXT_color_buffer_float is not supported!");
    }
    // 背景を白にする
    var white = [1.0, 1.0, 1.0, 1.0];
    gl.clearBufferfv(gl.COLOR, 0, white);
    // データを用意する
    var index = [0.0, 1.0];
    var p = [0.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0];
    var v = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    var a = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    var m = [1.0e+10, 1.0e+10];
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
    pp_tex[0] = transfer_data(gl, pp, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    vv_tex[0] = transfer_data(gl, vv, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    aa_tex[0] = transfer_data(gl, aa, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    mm_tex[0] = transfer_data(gl, mm, 1, gl.R32F, gl.RED, gl.FLOAT);
    pp_tex[1] = transfer_data(gl, pp, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    vv_tex[1] = transfer_data(gl, vv, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    aa_tex[1] = transfer_data(gl, aa, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
    // テクスチャをレンダーターゲットに指定
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    var depth_render_buffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth_render_buffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2, 1);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth_render_buffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_tex[1], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vv_tex[1], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, aa_tex[1], 0);
    // シェーダをコンパイル
    var vs = compile_shader(gl, gl.VERTEX_SHADER, vertex_shader);
    var fs = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_shader);
    // シェーダをリンク・使用する
    var program = link_shader(gl, vs, fs);
    // in変数をVBOと関連付ける
    var index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, index_, gl.STATIC_DRAW);
    var location = gl.getAttribLocation(program, "index");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // uniform変数とテクスチャを関連付ける
    gl.bindTexture(gl.TEXTURE_2D, pp_tex[0]);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, "p"), 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, vv_tex[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(gl.getUniformLocation(program, "v"), 1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, aa_tex[0]);
    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(gl.getUniformLocation(program, "a"), 2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, mm_tex[0]);
    gl.activeTexture(gl.TEXTURE3);
    gl.uniform1i(gl.getUniformLocation(program, "m"), 3);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_2D, pp_tex[0]);
    gl.activeTexture(gl.TEXTURE4);
    gl.uniform1i(gl.getUniformLocation(program, "global_p"), 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    // 描画命令
    gl.drawArrays(gl.POINTS, 0, mm.length);
    // 読み出し
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    var reading_buffer = new Float32Array(8);
    gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, reading_buffer);
    console.log(reading_buffer);
};
function transfer_data(gl, list, dimension, iformat, format, type) {
    var tex = gl.createTexture();
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
    gl.shaderSource(s, source);
    gl.compileShader(s);
    console.log(gl.getShaderInfoLog(s));
    return s;
}
function link_shader(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.useProgram(p);
    return p;
}
