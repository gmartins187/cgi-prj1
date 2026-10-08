#version 300 es

precision highp float;

const int MAX_SITES = 32;

uniform vec2  u_site_position[MAX_SITES];
uniform vec3  u_site_color[MAX_SITES];
uniform int   u_n_sites;      // how many of MAX_SITES are actually in use
uniform int   u_metric;       // 0 Euclidean, 1 Manhattan, 2 Chebyshev

out vec4 color;

in vec2 v_position;

float calc_distance(vec2 p1, vec2 p2) {
    if (u_metric == 0) { // Euclidean (o length e uma funcao do GLSL que calcula a distancia euclidiana)
        return length(p1 - p2);
    } else if (u_metric == 1) { // Manhattan
        return abs(p1.x - p2.x) + abs(p1.y - p2.y);
    } else { // Chebyshev
        return max(abs(p1.x - p2.x), abs(p1.y - p2.y));
    }
}

void main() {
    // distancia de v_position para cada site
    float d1 = calc_distance(v_position, u_site_position[0]);
    float d2 = calc_distance(v_position, u_site_position[1]);
    // próxima de 0, estamos na fronteira(linha branca)
    float diff = abs(d1 - d2);

    if (diff < 0.01) { 
        // Linha branca da distancia igual
        color = vec4(1.0, 1.0, 1.0, 1.0);
    } else if (d1 < d2) {
        // Site 0
        color = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        // Site 1
        color = vec4(0.0, 1.0, 0.0, 1.0);
    }
}
