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
let u_center;
let u_scale;
let u_world_half_width;

// Novas variáveis para o ponto dos sites
let u_is_marker;
let sites_vao; 
let sites_buffer;

// Variaveis para o os mouse_down, mouse_move, mouse_up...
var isDragging = false;
var hasDragged = false;
var startPos = null;
var lastPos = null;
var draggedSiteIndex = -1; // -1 se nenhum site esta a ser arrastado

var currentMousePos = { x: 0, y: 0 };

var center = [0.0, 0.0];
var scale = 2.0;

const WORLD_HALF_WIDTH = 10.0;
const TOLERANCE = 0.03;

// ---------------------------------------------------------------------------
// Input. The event listeners are already set up in setup_input(); fill in
// these functions. Mouse positions are in canvas pixels, with (0, 0) at the
// top-left corner and y growing downwards.
// ---------------------------------------------------------------------------

// Função do exercício 12. teve de ser alterada para o espaço do mundo, porque o espaço do clip nao fazia os pontos mexer.
function to_world_space(x, y) {
    // 1. Obter o espaço de recorte (-1 a 1)
    const clip_x = (x / canvas.width) * 2 - 1;
    const clip_y = 1 - (y / canvas.height) * 2;

    // 2. Aplicar a transformação da câmara (Centro e Zoom)
    const world_x = center[0] + clip_x * WORLD_HALF_WIDTH * scale;
    const world_y = center[1] + clip_y * WORLD_HALF_WIDTH * scale;

    return vec2(world_x, world_y);
}

function update_site_counter() {
    const counterDisplay = document.getElementById('site-count');
    if (counterDisplay) {
        counterDisplay.innerText = n_sites;
    }
}

function is_in_site(x, y) {
    const click_world = to_world_space(x, y);
    const world_tolerance = TOLERANCE * WORLD_HALF_WIDTH * scale;

    for (let i = 0; i < n_sites; i++) {
        let site = sites[i];
        
        let dx = click_world[0] - site[0];
        let dy = click_world[1] - site[1];

        if (Math.sqrt(dx*dx + dy*dy) < world_tolerance) {
            return i; // Retorna o índice do site que está dentro da tolerância
        }
    }
    return -1;
}

function on_mouse_down(x, y) {
    isDragging = true;
    hasDragged = false;
    if (n_sites > 0) {
        draggedSiteIndex = is_in_site(x, y);
    }

    if (draggedSiteIndex !== -1) {
        sites[draggedSiteIndex] = to_world_space(x, y);
    }
    
    startPos = { x: x, y: y };
    lastPos = { x: x, y: y };
}

function pan(dx, dy) {
    const units_per_pixel_x = (2 * WORLD_HALF_WIDTH * scale) / canvas.width;
    const units_per_pixel_y = (2 * WORLD_HALF_WIDTH * scale) / canvas.height;
    
    center[0] -= dx * units_per_pixel_x;
    center[1] += dy * units_per_pixel_y;
}

function on_mouse_move(x, y) {
    // Memorizar a posição atual para o teclado poder usar
    currentMousePos = { x: x, y: y };

    if (isDragging) {
        const dx_total = x - startPos.x;
        const dy_total = y - startPos.y;

        if (!hasDragged && Math.sqrt(dx_total*dx_total + dy_total*dy_total) > 4) {
            hasDragged = true;
        }


        if (hasDragged) {
            if (draggedSiteIndex !== -1) {
                sites[draggedSiteIndex] = to_world_space(x, y);
            } else if (isDragging) {
                const dx = x - lastPos.x;
                const dy = y - lastPos.y;
            
                pan(dx, dy);
            }

            lastPos = { x: x, y: y };
        }
    }
}

function random_site_color(){
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    if (x < 0.4) {
        return vec3(x + 0.6, y, z);
    }
    if (y < 0.4) {
        return vec3(x, y + 0.6, z);
    }
    if (z < 0.4) {
        return vec3(x, y, z + 0.6);
    }
    
    return vec3(x, y, z);  
}

function add_site(x, y) {
    sites.push(to_world_space(x, y));
    sitesColor.push(random_site_color());
    n_sites++;

    update_site_counter();
}

function on_mouse_up(x, y) {
    const wasClick = isDragging && !hasDragged;
    const insideCanvas = x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height;

    if (wasClick && insideCanvas && draggedSiteIndex == -1 && n_sites < 32) {
        add_site(x,y);
    }

    isDragging = false;
    hasDragged = false;
    lastPos = null;
    draggedSiteIndex = -1;
}

// dy > 0 when the wheel is scrolled down (towards the user)
function on_wheel(x, y, dy) {
    scale = Math.min(4.0, Math.max(0.2, scale * (1 + dy / 1000)));
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
            // Procura o índice do site na posição atual do rato
            const indexToRemove = is_in_site(currentMousePos.x, currentMousePos.y);
            
            if (indexToRemove !== -1) {
                // Remove 1 elemento dos arrays a partir da posição "indexToRemove"
                sites.splice(indexToRemove, 1);
                sitesColor.splice(indexToRemove, 1);
                n_sites--;

                update_site_counter();
            }
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
    canvas.addEventListener("mouseup", (event) => on_mouse_up(event.offsetX, event.offsetY));
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
    u_is_marker = gl.getUniformLocation(program, "u_is_marker");
    u_center = gl.getUniformLocation(program, "u_center");
    u_scale = gl.getUniformLocation(program, "u_scale");
    u_world_half_width = gl.getUniformLocation(program, "u_world_half_width");


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

    window.requestAnimationFrame(animate);
}

function animate(timestamp) {
    window.requestAnimationFrame(animate);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform1i(u_n_sites, n_sites);

    // Protecao porque no inicio não existem sites.
    if (n_sites > 0){
        gl.uniform3fv(u_site_color, flatten(sitesColor));
        gl.uniform2fv(u_site_position_loc, flatten(sites));
    }
    
    gl.uniform1f(u_world_half_width, WORLD_HALF_WIDTH);
    gl.uniform2fv(u_center, center);
    gl.uniform1f(u_scale, scale);


    gl.bindVertexArray(quad_vao);
    gl.uniform1i(u_is_marker, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    if (n_sites > 0){
        gl.uniform1i(u_is_marker, 1);
        gl.bindVertexArray(sites_vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, sites_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(sites), gl.STATIC_DRAW); // Atualiza dados
        gl.drawArrays(gl.POINTS, 0, n_sites); // Desenha pontos
    }
    gl.bindVertexArray(null);
    gl.useProgram(null);
}

loadShadersFromURLS(["quad.vert", "quad.frag"]).then(shaders => setup(shaders));
