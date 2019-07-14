let vertex_shader: string = `#version 300 es

in float index;
out vec4 old_p;
out vec4 old_v;
out vec4 old_a;
uniform sampler2D p;
uniform sampler2D v;
uniform sampler2D a;

void main(void) {
	ivec2 tex_index = ivec2(int(index), 0);
	old_p = texelFetch(p, tex_index, 0);
	old_v = texelFetch(v, tex_index, 0);
	old_a = texelFetch(a, tex_index, 0);

	float max = float(textureSize(p, 0).x);
	float x_coord = (index / (max - 1.0)) * 2.0 - 1.0;
	if (x_coord <= 0.0) {
		x_coord += 1.0 / max;
	}
	else {
		x_coord -= 1.0 / max;
	}
	gl_Position = vec4(x_coord, 0.0, 0.0, 1.0);
}
`;

let fragment_shader: string = `#version 300 es

precision mediump float;

in vec4 old_p;
in vec4 old_v;
in vec4 old_a;
uniform sampler2D m;
uniform sampler2D global_p;
layout(location = 0) out vec4 new_p;
layout(location = 1) out vec4 new_v;
layout(location = 2) out vec4 new_a;

const float G = 6.67408e-11;
const float TIME_STEP = 1.0e-3;

void main(void) {
	ivec2 size = textureSize(global_p, 0);
	vec3 f = vec3(0.0, 0.0, 0.0);

	// 万有引力計算
	for (int i = 0; i < size.x; i++) {
		ivec2 pos = ivec2(i, 0);
		vec4 j_pos = texelFetch(global_p, pos, 0);
		float mm = texelFetch(m, pos, 0).x;

		vec3 distance = j_pos.xyz - old_p.xyz;
		float norm = sqrt(dot(distance, distance));
		if (norm == 0.0) {
			continue;
		}
		float invnorm = 1.0 / pow(norm, 3.0);
		f += G * mm * invnorm * distance;
	}

	new_p = vec4(1.0, 1.0, 1.0, 1.0);
	new_v = vec4(0.0, 0.0, 0.0, 1.0);
	new_a = vec4(f, 0.0);
}
`;

window.onload = () => {
	// WebGL 2.0コンテキストを取得する
	const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("webgl");
	let gl: WebGL2RenderingContext;
	try {
		gl = canvas.getContext("webgl2");
	}
	catch (e) {
		console.log("WebGL 2.0 is disabled!");
	}

	// floatのテクスチャを有効にする
	if (gl.getExtension("OES_texture_float_linear") == null) {
		console.log("OES_texture_float_linear is not supported!");
		return;
	}
	if (gl.getExtension("EXT_color_buffer_float") == null) {
		console.log("EXT_color_buffer_float is not supported!");
		return;
	}
	
	// 背景を白にする
	let white: number[] = [1.0, 1.0, 1.0, 1.0];
	gl.clearBufferfv(gl.COLOR, 0, white);

	// Transform Feedbackを使う
	let transform_feedback: WebGLTransformFeedback = gl.createTransformFeedback();
	gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transform_feedback);

	// データを用意する
	let index: number[] = [0.0, 1.0];
	let p: number[] = [0.0, 0.0, 0.0, 0.0, 100.0, 0.0, 0.0, 0.0];
	let v: number[] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
	let a: number[] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
	let m: number[] = [1.0e+10, 1.0e+10];
	let index_: Float32Array = new Float32Array(index);
	let pp: Float32Array = new Float32Array(p);
	let vv: Float32Array = new Float32Array(v);
	let aa: Float32Array = new Float32Array(a);
	let mm: Float32Array = new Float32Array(m);
	
	// テクスチャを生成する
	let pp_tex: WebGLTexture[] = [];
	let vv_tex: WebGLTexture[] = [];
	let aa_tex: WebGLTexture[] = [];
	let mm_tex: WebGLTexture[] = [];
	pp_tex[0] = transfer_data(gl, pp, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	vv_tex[0] = transfer_data(gl, vv, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	aa_tex[0] = transfer_data(gl, aa, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	mm_tex[0] = transfer_data(gl, mm, 1, gl.R32F, gl.RED, gl.FLOAT);
	pp_tex[1] = transfer_data(gl, pp, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	vv_tex[1] = transfer_data(gl, vv, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	aa_tex[1] = transfer_data(gl, aa, 3, gl.RGBA32F, gl.RGBA, gl.FLOAT);

	// テクスチャをレンダーターゲットに指定
	let f: WebGLFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, f);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_tex[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vv_tex[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, aa_tex[1], 0);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

	// シェーダをコンパイル
	let vs: WebGLShader = compile_shader(gl, gl.VERTEX_SHADER, vertex_shader);
	let fs: WebGLShader = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_shader);

	// シェーダをリンク・使用する
	let program: WebGLProgram = link_shader(gl, vs, fs, ["gl_Position", "old_p"]);

	// in変数をVBOと関連付ける
	let index_buffer: WebGLBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, index_, gl.STATIC_DRAW);
	let location: number = gl.getAttribLocation(program, "index");
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

	// Transform Feedback用のVBOを用意する
	let buffer_gl_Position: WebGLBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_gl_Position);
	gl.bufferData(gl.ARRAY_BUFFER, 100, gl.STREAM_READ);

	let buffer_old_p: WebGLBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_old_p);
	gl.bufferData(gl.ARRAY_BUFFER, 100, gl.STREAM_READ);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer_gl_Position);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, buffer_old_p);

	// 描画命令
	gl.viewport(0, 0, 2, 1);
	gl.beginTransformFeedback(gl.POINTS);
	gl.drawArrays(gl.POINTS, 0, index.length);
	gl.endTransformFeedback();

	// VBOから読み出し
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
	let f32_gl_Position: Float32Array = new Float32Array(8);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_gl_Position);
	gl.getBufferSubData(gl.ARRAY_BUFFER, 0, f32_gl_Position);
	let f32_old_p: Float32Array = new Float32Array(8);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_old_p);
	gl.getBufferSubData(gl.ARRAY_BUFFER, 0, f32_old_p);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	console.log(f32_gl_Position);
	console.log(f32_old_p);

	// フレームバッファから読み出し
	gl.readBuffer(gl.COLOR_ATTACHMENT0);
	let reading_buffer: Float32Array = new Float32Array(8);
	gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, reading_buffer);
	console.log(reading_buffer);
};

function transfer_data(gl: WebGL2RenderingContext, list: Float32Array, dimension: number, 
	                   iformat: number, format: number, type: number): WebGLTexture {
	let tex: WebGLTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, iformat, list.length / dimension, 1, 0, format, type, list);
	gl.bindTexture(gl.TEXTURE_2D, null);

	return tex;
}

function compile_shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	let s = gl.createShader(type);

	gl.shaderSource(s, source);
	gl.compileShader(s);
	console.log(gl.getShaderInfoLog(s));

	return s;
}

function link_shader(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader, tf_list: string[]): WebGLProgram {
	let p: WebGLProgram = gl.createProgram();

	gl.attachShader(p, vs);
	gl.attachShader(p, fs);

	if (tf_list != null) {
		gl.transformFeedbackVaryings(p, tf_list, gl.SEPARATE_ATTRIBS);
	}

	gl.linkProgram(p);
	gl.useProgram(p);

	return p;
}