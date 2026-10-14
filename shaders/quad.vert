#version 300 es

// The corners of the quad are already in clip space, so they pass straight
// through.

in vec2 a_position;
out vec2 v_position;

uniform vec2 u_center;
uniform float u_scale;
uniform float u_world_half_width;

void main() {
    gl_Position = vec4((a_position.xy - u_center) / u_scale, 0.0, 1.0);

    gl_PointSize = 8.0f;
    v_position = a_position;
}
