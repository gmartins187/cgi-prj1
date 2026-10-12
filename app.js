import { loadShadersFromURLS, buildProgramFromSources, setupWebGL } from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

/** @type {HTMLCanvasElement} */
let canvas;
/** @type {WebGL2RenderingContext} */
let gl;

var sitesBuffer;   // buffer for the sites uniform

var sites = [];
var sitesColor = [];
var n_sites;

let program;
let quad_vao;       // the quad covering the whole viewport


// Localizações dos uniforms
let u_sites_color;
let u_n_sites;
let u_site_position_loc;
let u_metric_loc;

// var hasMoved;
var moved;

// ---------------------------------------------------------------------------
// Input. The event listeners are already set up in setup_input(); fill in
// these functions. Mouse positions are in canvas pixels, with (0, 0) at the
// top-left corner and y growing downwards.
// ---------------------------------------------------------------------------
function euclidian_distance(x1, y1, x2, y2){
}

function is_in_site(vec){
    for(let i=0;i<sites.length;i++){
        if(vec2.equals(sites[i],vec)){return true;}
    } 
    return false;
}

//guilherme martins
function on_mouse_down(x, y) {
    if(is_in_site(vec2(x,y))){

    } else{

    }
}

function on_mouse_move(x, y) {
    if(is_down){

    } else{ //is_up

    }
}

function random_site_color(){
    return vec4(Math.random(), Math.random(), Math.random(), 1.0);
}

function add_site(x,y){
    sites.push(vec2(x,y));
    sitesColor.push(random_site_color());
    n_sites+=1;
}

//rodrigo santos
function on_mouse_up(x, y) {
    //if (isDragging) {
    //    isDragging = false;
    //    hasDragged = false;
    //}
    if(moved){
        
    } else{ //hasnt moved
        add_site(x,y);
    }
}

// dy > 0 when the wheel is scrolled down (towards the user)
function on_wheel(x, y, dy) {
}

function on_key(key) {
    switch (key) {
        case '1':       // Euclidean distance
            break;
        case '2':       // Manhattan distance
            break;
        case '3':       // Chebyshev distance
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
    gl.uniform4f(u_sites_color, flatten(sitesColor));
    gl.uniform2fv(u_site_position_loc, flatten(sites));
    gl.uniform1i(u_metric_loc, 0); // 0 = Euclidiana

    gl.bindVertexArray(quad_vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.useProgram(null);
}

loadShadersFromURLS(["quad.vert", "quad.frag"]).then(shaders => setup(shaders));
