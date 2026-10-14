#version 300 es

// The corners of the quad are already in clip space, so they pass straight
// through.

in vec2 a_position;

out vec2 v_position;

void main() {
    v_position = a_position;
    gl_Position = vec4(a_position, 0.0f, 1.0f);
    gl_PointSize = 8.0f; // para o programa saber o tamanho dos pontos que vai desenhar nas locs dos sites
}
