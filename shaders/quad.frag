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
uniform float u_aspect;
uniform int u_toggle_borders;

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

bool is_border(vec2 world_position){
    float distances[MAX_SITES];
    for(int i = 0; i < u_n_sites; i++) {
        distances[i] = calc_distance(world_position, u_site_position[i]);
    }

    float d1 = MAX_FLOAT;
    float d2 = MAX_FLOAT;

    for(int i = 0; i < u_n_sites; i++) {
        if (distances[i] < d1) {
            d2 = d1;
            d1 = distances[i];
        } else if (distances[i] < d2) {
            d2 = distances[i];
        }
    }
    
    if(abs(d1-d2)<0.1){return true;}    
    return false;
}


int is_site_border(vec2 world_position){
    float min_distance = MAX_FLOAT;
    for(int i = 0; i < u_n_sites; i++) {
        float d = length(u_site_position[i] - world_position);
        if(d < min_distance) {
            min_distance = d;
        }
    }
    if(min_distance < 0.15 && min_distance > 0.07){
        return 2;
    } else if(min_distance < 0.24 && min_distance > 0.15){
        return 1;
    } else 
        return 0;
}

void main() {   
    if (u_n_sites == 0) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Converter a coordenada do píxel atual do ecrã para o Mundo Infinito
        vec2 world_pos = vec2(
            u_center.x + v_position.x * u_world_half_width * u_scale,
            u_center.y + v_position.y * u_world_half_width * u_scale * u_aspect
        );

        if(is_border(world_pos) && u_toggle_borders == 1){
            // cor da linha entre sites
            color=vec4(1.0f);
        } else if(is_site_border(world_pos)==2){
            // Cor do circulo a volta do ponto do site
            color=vec4(1.0f);
        } else if(is_site_border(world_pos)==1){
            // Cor do ponto do site
            color=vec4(0.0f, 0.0f, 0.0f, 1.0f);
        } else{ //sites area color

            float dist_ao_centro;
            // 1. Obter o index do site para depois obter cor
            int index = site_index(world_pos, dist_ao_centro);

            // 2. Obter a cor original do site
            vec3 base_color = u_site_color[index];

            // 3. EFEITO FADE: 
            float intensidade = exp(-dist_ao_centro * 0.02);
            color = vec4(base_color * intensidade, 1.0);
        }
    }
}
