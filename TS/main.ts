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
const float TIME_STEP = 10.0;

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

    // リープフロッグ法
    vec4 pp_half = old_v + vec4(TIME_STEP / 2.0) * old_a;
    vec4 pp_p = old_p + TIME_STEP * pp_half;
	vec4 pp_v = old_v + (TIME_STEP * 2.0) * vec4(f, 0.0);

    new_a = vec4(f, 0.0);
    new_v = pp_v;
    new_p = pp_p;
}
`;

const vs_display: string = `#version 300 es

in vec4 pp;

void main(void) {
	gl_Position = pp;
	gl_PointSize = 4.0;
}
`;

const fs_display: string = `#version 300 es

precision mediump float;

out vec4 color;

void main(void) {
	color = vec4(1.0, 0.0, 0.0, 1.0);
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

	// 定数
	const N = 128;
	
	// 背景を白にする
	let white: number[] = [1.0, 1.0, 1.0, 1.0];
	gl.clearBufferfv(gl.COLOR, 0, white);

	// データを用意する
	let index: number[] = [];
	let p: number[] = [];
	let v: number[] = [];
	let a: number[] = [];
	let m: number[] = [];
	for (let i = 0; i < N; i++) {
		index.push(i);
		p.push(2 * Math.random() - 1);
		p.push(2 * Math.random() - 1);
		p.push(0.0);
		p.push(1.0);
		for (let j = 0; j < 4; j++) {
			v.push(0);
			a.push(0);
		}
		m.push(1.0e+3);
	}
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
	pp_tex[0] = transfer_data(gl, pp, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	vv_tex[0] = transfer_data(gl, vv, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	aa_tex[0] = transfer_data(gl, aa, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	mm_tex[0] = transfer_data(gl, mm, 1, gl.R32F, gl.RED, gl.FLOAT);
	pp_tex[1] = transfer_data(gl, pp, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	vv_tex[1] = transfer_data(gl, vv, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);
	aa_tex[1] = transfer_data(gl, aa, 4, gl.RGBA32F, gl.RGBA, gl.FLOAT);

	// シェーダをコンパイル
	let vs: WebGLShader = compile_shader(gl, gl.VERTEX_SHADER, vertex_shader);
	let fs: WebGLShader = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_shader);

	let vs_d: WebGLShader = compile_shader(gl, gl.VERTEX_SHADER, vs_display);
	let fs_d: WebGLShader = compile_shader(gl, gl.FRAGMENT_SHADER, fs_display);

	// シェーダをリンク・使用する
	let program: WebGLProgram = link_shader(gl, vs, fs, ["old_p"]);
	let d_program: WebGLProgram = link_shader(gl, vs_d, fs_d, null);

	// in変数をVBOと関連付ける
	let index_buffer: WebGLBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, index_, gl.STATIC_DRAW);
	let location: number = gl.getAttribLocation(program, "index");
	gl.enableVertexAttribArray(location);
	gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// Transform Feedback用のバッファを用意する
	let old_p_buffer: WebGLBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, old_p_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, pp, gl.STREAM_READ);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, old_p_buffer);

	let n: number = 0;
	swapping();

	function swapping() {
		// Transform Feedbackを使う
		let transform_feedback: WebGLTransformFeedback = gl.createTransformFeedback();
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transform_feedback);
	
		// GPGPUシェーダを使用
		gl.useProgram(program);

		// フレームバッファをバインドする
		let f: WebGLFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, f);
	
		// テクスチャをレンダーターゲットに指定
		gl.bindFramebuffer(gl.FRAMEBUFFER, f);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_tex[n % 2], 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vv_tex[n % 2], 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, aa_tex[n % 2], 0);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

		// uniform変数とテクスチャを関連付ける
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, pp_tex[(n % 2)?0:1]);
		gl.uniform1i(gl.getUniformLocation(program, "p"), 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, vv_tex[(n % 2)?0:1]);
		gl.uniform1i(gl.getUniformLocation(program, "v"), 1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, aa_tex[(n % 2)?0:1]);
		gl.uniform1i(gl.getUniformLocation(program, "a"), 2);

		gl.activeTexture(gl.TEXTURE3);
		gl.bindTexture(gl.TEXTURE_2D, mm_tex[(n % 2)?0:1]);
		gl.uniform1i(gl.getUniformLocation(program, "m"), 3);

		gl.activeTexture(gl.TEXTURE4);
		gl.bindTexture(gl.TEXTURE_2D, pp_tex[(n % 2)?0:1]);
		gl.uniform1i(gl.getUniformLocation(program, "global_p"), 4);

		gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, old_p_buffer);

		// 描画命令
		gl.viewport(0, 0, N, 1);
		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, index.length);
		gl.endTransformFeedback();
		gl.flush();

		// フレームバッファから読み出し
		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		let reading_buffer: Float32Array = new Float32Array(N * 4);
		gl.readPixels(0, 0, N, 1, gl.RGBA, gl.FLOAT, reading_buffer);
		// console.log(reading_buffer);

		// 表示する
		gl.useProgram(d_program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

		let aaa: WebGLBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, aaa);
		gl.bufferData(gl.ARRAY_BUFFER, reading_buffer, gl.STATIC_DRAW);
		let location: number = gl.getAttribLocation(d_program, "pp");
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0);

		gl.viewport(0, 0, 500, 500);
		gl.drawArrays(gl.POINTS, 0, index.length);

		n++;

		requestAnimationFrame(swapping);
	}
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

	return p;
}