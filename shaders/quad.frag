#version 300 es

precision highp float;

const int MAX_SITES = 32;
const float MAX_FLOAT = 1e30; // nova constante que nos da um valor alto

uniform vec2  u_site_position[MAX_SITES];
uniform vec3  u_site_color[MAX_SITES];
uniform int   u_n_sites;      // how many of MAX_SITES are actually in use
uniform int   u_metric;       // 0 Euclidean, 1 Manhattan, 2 Chebyshev

uniform bool u_is_marker; // verdadeiro se o site é um marcador
uniform vec2  u_center;
uniform float u_scale;
uniform float u_world_half_width;

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

int site_index(vec2 current_world_pos, out float out_min_distance) {
    float min_distance = MAX_FLOAT;
    int index = 0;

    for(int i = 0; i < u_n_sites; i++) {
        float d = calc_distance(u_site_position[i], current_world_pos);
        
        if(d < min_distance) {
            min_distance = d;
            index = i;
        }
    }
    out_min_distance = min_distance;
    return index;
}

void main() {
    if (u_is_marker) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    if (u_n_sites == 0) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Converter a coordenada do píxel atual do ecrã para o Mundo Infinito
        vec2 world_pos = vec2(
            u_center.x + v_position.x * u_world_half_width * u_scale,
            u_center.y + v_position.y * u_world_half_width * u_scale
        );

        float dist_ao_centro;
        int index = site_index(world_pos, dist_ao_centro);

        // 2. Obter a cor original do site
        vec3 base_color = u_site_color[index];

        // 3. EFEITO FADE: 
        // A função exp() começa em 1.0 (no centro) e desce suavemente para 0.0
        // Quanto maior for o multiplicador (ex: 0.3), mais rápido o escuro aperta.
        float intensidade = exp(-dist_ao_centro * 0.02);

        color = vec4(base_color * intensidade, 1.0);
    }
}
