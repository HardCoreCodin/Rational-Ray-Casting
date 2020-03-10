#define FALSE 0
#define TRUE 1

#define TILE_SIZE 64
#define MAP_NUM_ROWS 13
#define MAP_NUM_COLS 20
#define NUM_TEXTURES 8

#define MINIMAP_SCALE_FACTOR 0.2

#define WINDOW_WIDTH (MAP_NUM_COLS * TILE_SIZE)
#define WINDOW_HEIGHT (MAP_NUM_ROWS * TILE_SIZE)

#define TEXTURE_WIDTH 64
#define TEXTURE_HEIGHT 64

#define NUM_RAYS WINDOW_WIDTH

#define FPS 30
#define FRAME_TIME_LENGTH (1000 / FPS)

// Original:
// =========
// #define FOV_ANGLE (60 * (PI / 180))
// #define PI 3.14159265
// #define TWO_PI 6.28318530
//
// Rational:
// =========
#define FOCAL_LENGTH 3.5f
#define FOV_RATIO (1 / FOCAL_LENGTH)
#define PROJECTION_PLANE_WIDTH (2 * FOV_RATIO)
const float FIRST_RAY_DIRECTION = -FOV_RATIO;
const float RAY_STEP = PROJECTION_PLANE_WIDTH / NUM_RAYS;
// =========