#version 300 es

precision highp float;

const int MAX_SITES = 32;
const float MAX_FLOAT = 1e30; // nova constante que nos da um valor alto

uniform vec2  u_site_position[MAX_SITES];
uniform vec3  u_site_color[MAX_SITES];
uniform int   u_n_sites;      // how many of MAX_SITES are actually in use
uniform int   u_metric;       // 0 Euclidean, 1 Manhattan, 2 Chebyshev
uniform bool u_is_marker; // verdadeiro se o site é um marcador

out vec4 color;

in vec2 v_position;

float calc_distance(vec2 p1, vec2 p2) {
    if (u_metric == 0) { // 0 - Euclidiana
        return length(p1 - p2);
    } else if (u_metric == 1) { // 1 - Manhattan
        return abs(p1.x - p2.x) + abs(p1.y - p2.y);
    } else { // 2 - Chebyshev
        return max(abs(p1.x - p2.x), abs(p1.y - p2.y));
    }
}

// Corrigi este metodo
int site_index() {
    float min_distance = MAX_FLOAT;
    int index = 0;

    for(int i = 0; i < u_n_sites; i++) {
        float d = calc_distance(u_site_position[i], v_position);
        
        if(d < min_distance) {
            min_distance = d;
            index = i;
        }
    }
    return index;
}

void main() {
    if (u_is_marker) {
        color = vec4(0.0, 0.0, 0.0, 1.0); // preto para o marcador
        return;
    }
    // se nao existirem sites, pinta o fundo de preto. Se existirem, pinta a cor do site mais proximo.
    if (u_n_sites == 0) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        color = vec4(u_site_color[site_index()], 1.0);
    }
}
