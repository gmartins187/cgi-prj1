import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";
import { vec2, vec3, flatten } from "../../libs/MV.js";

/** @type {HTMLCanvasElement} */
let canvas;
/** @type {WebGL2RenderingContext} */
let gl;

var sitesBuffer;   // buffer for the sites uniform

var sites = [];
var sitesColor = [];
var n_sites = 0;

let program;
let quad_vao;       // the quad covering the whole viewport


// Localizações dos uniforms
let u_site_color;
let u_n_sites;
let u_site_position_loc;
let u_metric_loc;

// Novas variáveis para o ponto dos sites
let u_is_marker_loc;
let sites_vao; 
let sites_buffer;

// Variaveis para o os mouse_down, mouse_move, mouse_up...
var isDragging;
var hasDragged;

const TOLERANCE = 0.01;

// ---------------------------------------------------------------------------
// Input. The event listeners are already set up in setup_input(); fill in
// these functions. Mouse positions are in canvas pixels, with (0, 0) at the
// top-left corner and y growing downwards.
// ---------------------------------------------------------------------------

// Função do exercício 12.
function to_clip_space(x, y) {
    return vec2(
        (x / canvas.width) * 2 - 1,
        1 - (y / canvas.height) * 2   // invertido: os pixels crescem para baixo, o espaço de recorte cresce para cima
    );
}

function is_in_site(x,y){
    const click_pos = to_clip_space(x, y);

    for (let i = 0; i < n_sites; i++) {
        let site = sites[i];
        
        let dx = click_pos[0] - site[0];
        let dy = click_pos[1] - site[1];

        if (Math.sqrt(dx*dx + dy*dy) < TOLERANCE) {
            return true;
        }
    }
    return false;
}

function on_mouse_down(x, y) {
    if (is_in_site(x,y)) {
        isDragging = true;
        hasDragged = false;
    }
}

function on_mouse_move(x, y) {
    if (isDragging) {
        hasDragged = true;
        // Update site position
    
    }
}

function random_site_color(){
    return vec3(Math.random(), Math.random(), Math.random());
}

function add_site(x,y){
    sites.push(to_clip_space(x, y));
    sitesColor.push(random_site_color());
    n_sites++;
}

function on_mouse_up(x, y) {
    if (isDragging) {
        isDragging = false;
        hasDragged = false;
    } else {
        add_site(x,y);
    }
}

// dy > 0 when the wheel is scrolled down (towards the user)
function on_wheel(x, y, dy) {

}

function on_key(key) {
    // Aqui coloquei o useProgram porque se não o programa não fazia nada ao clicar nas teclas.
    gl.useProgram(program);

    switch (key) {
        case '1':       // Euclidean distance
            gl.uniform1i(u_metric_loc, 0);
            break;
        case '2':       // Manhattan distance
            gl.uniform1i(u_metric_loc, 1);
            break;
        case '3':       // Chebyshev distance
            gl.uniform1i(u_metric_loc, 2);
            break;
        case 'b':       // toggle cell borders
            break;
        case 'x':       // remove the site under the pointer
            break;
        case 'm':       // switch rendering technique / split view
            break;
    }
}


// ---------------------------------------------------------------------------

function resize() {
    // Match the canvas's drawing buffer to the size it is shown at, and
    // draw over all of it
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function setup_input() {
    canvas.addEventListener("mousedown", (event) => on_mouse_down(event.offsetX, event.offsetY));
    canvas.addEventListener("mousemove", (event) => on_mouse_move(event.offsetX, event.offsetY));
    window.addEventListener("mouseup", (event) => on_mouse_up(event.offsetX, event.offsetY));
    canvas.addEventListener("wheel", (event) => {
        on_wheel(event.offsetX, event.offsetY, event.deltaY);
        event.preventDefault();     // don't let the page scroll as well
    });
    window.addEventListener("keydown", (event) => on_key(event.key));
}

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["quad.vert"], shaders["quad.frag"]);

    // A quad covering the whole viewport, as two triangles: its corners are
    // the corners of clip space, from (-1, -1) to (1, 1)
    const corners = new Float32Array([
        -1, -1,     1, -1,     1, 1,       // first triangle
        -1, -1,     1, 1,     -1, 1,       // second triangle
    ]);

    quad_vao = gl.createVertexArray();
    gl.bindVertexArray(quad_vao);

    sitesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sitesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW);

    const a_position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    // Obter as locs dos Uniforms 
    u_n_sites = gl.getUniformLocation(program, "u_n_sites");
    u_site_color = gl.getUniformLocation(program, "u_site_color");
    u_site_position_loc = gl.getUniformLocation(program, "u_site_position");
    u_metric_loc = gl.getUniformLocation(program, "u_metric");
    u_is_marker_loc = gl.getUniformLocation(program, "u_is_marker");


    // Aqui temos de criar o VAO (VAO próprio para os pontos e para capturar a variável booleana) e o buffer para os sites.
    sites_vao = gl.createVertexArray();
    gl.bindVertexArray(sites_vao);
    sites_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sites_buffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    resize();
    window.addEventListener("resize", resize);
    setup_input();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Tive de passar o uniform u_metric_loc para 0 (Euclidiana) aqui, porque se não o programa não desenha nada. Não sei porquê.
    gl.useProgram(program);
    gl.uniform1i(u_metric_loc, 0); // 0 = Euclidiana

    window.requestAnimationFrame(animate);
}

function animate(timestamp) {
    window.requestAnimationFrame(animate);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform1i(u_n_sites, n_sites);

    // Protecao porque no inicio não existem sites.
    if (n_sites > 0) {
        gl.uniform3fv(u_site_color, flatten(sitesColor));
        gl.uniform2fv(u_site_position_loc, flatten(sites));
    }

    gl.bindVertexArray(quad_vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (n_sites > 0) {
        gl.uniform1i(u_is_marker_loc, 1);
        gl.bindVertexArray(sites_vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, sites_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sites), gl.STATIC_DRAW); // Atualiza dados
        gl.drawArrays(gl.POINTS, 0, n_sites); // Desenha pontos
    }

    gl.bindVertexArray(null);
    gl.useProgram(null);
}

loadShadersFromURLS(["quad.vert", "quad.frag"]).then(shaders => setup(shaders));
