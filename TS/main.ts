let vertex_shader: string = `#version 300 es

in float index;
out vec3 old_p;
out vec3 old_v;
out vec3 old_a;
uniform sampler2D p;
uniform sampler2D v;
uniform sampler2D a;

void main(void) {
	ivec2 tex_index = ivec2(int(index), 0);
	old_p = texelFetch(p, tex_index, 0).xyz;
	old_v = texelFetch(v, tex_index, 0).xyz;
	old_a = texelFetch(a, tex_index, 0).xyz;
}
`;

let fragment_shader: string = `#version 300 es

precision mediump float;

in vec3 old_p;
in vec3 old_v;
in vec3 old_a;
uniform sampler2D m;
uniform sampler2D global_p;
layout(location = 0) out vec3 new_p;
layout(location = 1) out vec3 new_v;
layout(location = 2) out vec3 new_a;

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

		vec3 distance = j_pos.xyz - old_p;
		float norm = sqrt(dot(distance, distance));
		if (norm == 0.0) {
			continue;
		}
		float invnorm = 1.0 / pow(norm, 3.0);
		f += G * mm * invnorm * distance;
	}

	new_p = vec3(1.0, 1.0, 1.0);
	new_v = vec3(0.0, 0.0, 0.0);
	new_a = f;
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
	
	// 背景を白にする
	let white: number[] = [1.0, 1.0, 1.0, 1.0];
	gl.clearBufferfv(gl.COLOR, 0, white);

	// データを用意する
	let index: number[] = [0.0, 0.0];
	let p: number[] = [0.0, 0.0, 0.0, 100.0, 0.0, 0.0];
	let v: number[] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
	let a: number[] = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
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
	pp_tex[0] = transfer_data(gl, pp, 3, gl.RGB32F, gl.RGB, gl.FLOAT);
	vv_tex[0] = transfer_data(gl, vv, 3, gl.RGB32F, gl.RGB, gl.FLOAT);
	aa_tex[0] = transfer_data(gl, aa, 3, gl.RGB32F, gl.RGB, gl.FLOAT);
	mm_tex[0] = transfer_data(gl, mm, 1, gl.R32F, gl.RED, gl.FLOAT);
	pp_tex[1] = transfer_data(gl, pp, 3, gl.RGB32F, gl.RGB, gl.FLOAT);
	vv_tex[1] = transfer_data(gl, vv, 3, gl.RGB32F, gl.RGB, gl.FLOAT);
	aa_tex[1] = transfer_data(gl, aa, 3, gl.RGB32F, gl.RGB, gl.FLOAT);

	// テクスチャをレンダーターゲットに指定
	let f: WebGLFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, f);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pp_tex[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vv_tex[1], 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, aa_tex[1], 0);

	// シェーダをコンパイル
	let vs: WebGLShader = compile_shader(gl, gl.VERTEX_SHADER, vertex_shader);
	let fs: WebGLShader = compile_shader(gl, gl.FRAGMENT_SHADER, fragment_shader);

	// シェーダをリンク・使用する
	let program: WebGLProgram = link_shader(gl, vs, fs);

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

function link_shader(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
	let p: WebGLProgram = gl.createProgram();

	gl.attachShader(p, vs);
	gl.attachShader(p, fs);

	gl.linkProgram(p);
	gl.useProgram(p);

	return p;
}