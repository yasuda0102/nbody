window.onload = () => {
    let canvas = document.getElementById("canvas");
    let gl;
    try {
        gl = canvas.getContext("webgl2");
    }
    catch (e) {
        console.log("WebGL 2.0 is disabled!");
    }

    // 背景を白で塗りつぶす
    let white = new Float32Array([1.0, 1.0, 1.0, 1.0]);
    gl.clearBufferfv(gl.COLOR, 0, white);

    // シェーダプログラムを生成する
    let v_source = document.getElementById("vs").innerHTML;
    let vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, v_source);
    gl.compileShader(vs);
    console.log(gl.getShaderInfoLog(vs));

    let f_source = document.getElementById("fs").innerHTML;
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, f_source);
    gl.compileShader(fs);
    console.log(gl.getShaderInfoLog(fs));

    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.transformFeedbackVaryings(program, ["a"], gl.SEPARATE_ATTRIBS);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Transform Feedbackオブジェクトを生成する
    let tf = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);

    // 1つ目のバッファオブジェクトにデータを転送する
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0]), gl.STREAM_READ, 0);

    // 1つ目のバッファオブジェクトをTransform Feedback Bufferに設定する
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);

    // 描画命令
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.endTransformFeedback();

    // データを回収する (ちゃんとバーテックスシェーダで代入されていれば、out_data[0] != 0.0となるはず)
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let out_data = new Float32Array([0.0]);
    console.log(out_data);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, out_data);
    console.log(out_data);
}