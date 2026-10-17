#version 300 es

// The corners of the quad are already in clip space, so they pass straight
// through.

in vec2 a_position;

out vec2 v_position;

uniform vec2 u_center;
uniform float u_scale;
uniform float u_world_half_width;
uniform bool u_is_marker;

void main() {
    if (u_is_marker) {
        float clip_x = (a_position.x - u_center.x) / (u_world_half_width * u_scale);
        float clip_y = (a_position.y - u_center.y) / (u_world_half_width * u_scale);
        
        gl_Position = vec4(clip_x, clip_y, 0.0, 1.0);
        gl_PointSize = 8.0;
        
    } else {
        v_position = a_position;
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
}


