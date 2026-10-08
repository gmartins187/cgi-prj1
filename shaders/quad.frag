#version 300 es

precision highp float;

out vec4 color = [vec4(1.0, 0.0, 0.0, 1.0), vec4(1.0, 0.0, 1.0, 1.0)];
in vec2 v_position;
uniform vec2 u_sites [2];

float d1 = distance(u_sites[0], v_position);
float d2 = distance(u_sites[1], v_position);

void main() {
    if(d1<d2){
        color = vec4(0.2f, 0.4f, 0.6f, 1.0f);
    } else{
        color = vec4(1.0f, 0.0f, 0.6f, 1.0f);
    }
}

//to add
//function distance(vec2 p1, vec2 p2){}
