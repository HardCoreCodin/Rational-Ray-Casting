#include <stdio.h>
#include <limits.h>
#include <SDL2/SDL.h>
#include "constants.h"

const int map[MAP_NUM_ROWS][MAP_NUM_COLS] = {
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ,1, 1, 1, 1, 1, 1, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1},
    {1, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1},
    {1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 2, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}
};

// Rational:
// =========
typedef struct vec2 {float x, y;} vec2;
typedef struct mat2 {float m11, m12, m21, m22;} mat2;

vec2 ray_direction;
vec2 rotation_vector;
mat2 rotation_matrix;

float dot(vec2* a, vec2* b) {
    return (a->x * b->x) + (a->y * b->y);
}
void setRotationVector(vec2* v, float t) {
    // Project a point on a unit circle from a position on a vertical line of "x = 1" towards the origin
    const float t2 = t*t;
    const float factor = 1 / (1 + t2);

    v->x = (1 - t2) * factor;
    v->y = (2 * t) * factor;
}
void multiply(vec2* v, mat2* matrix) {
    const float x = v->x;
    const float y = v->y;

    v->x = matrix->m11*x + matrix->m21*y;
    v->y = matrix->m12*x + matrix->m22*y;
}
void setDirection(vec2* v, vec2* from, vec2* to) {
    v->x = to->x - from->x;
    v->y = to->y - from->y;
}

void setRotationMatrix(mat2* m, vec2* v) {
    // Construct a 2D rotation matrix from a 2D coordinate of a unit vector (point on a unit circle):
    m->m11 = v->x;  m->m22 =  v->x;
    m->m12 = v->y;  m->m21 = -v->y;
}
void setRotationMatrixByAmount(mat2* m, float amount) {
    setRotationVector(&rotation_vector, amount);
    setRotationMatrix(m, &rotation_vector);
}
void rotate(vec2* v, float amount) {
    setRotationMatrixByAmount(&rotation_matrix, amount);
    multiply(v, &rotation_matrix);
}
// ===========

struct Player {
// Original:
// =========
//  float x;
//  float y;
//  float rotationAngle;
//
// Rational:
// =========
    vec2 position;
    vec2 orientation;
    mat2 rotation_matrix;
// =========
    float width;
    float height;
    int turnDirection; // -1 for left, +1 for right
    int walkDirection; // -1 for back, +1 for front
    float walkSpeed;
    float turnSpeed;
} player;

struct Ray {
// Original:
// =========
//  float rayAngle;
//  float wallHitX;
//  float wallHitY;
//  float distance;
//
// Rational:
// =========
    vec2 direction;
    vec2 wallHit;
// =========
    int wasHitVertical;
    int isRayFacingUp;
    int isRayFacingDown;
    int isRayFacingLeft;
    int isRayFacingRight;
    int wallHitContent;
} rays[NUM_RAYS];

SDL_Window* window = NULL;
SDL_Renderer* renderer = NULL;
int isGameRunning = FALSE;
int ticksLastFrame;

Uint32* colorBuffer = NULL;
SDL_Texture* colorBufferTexture;

int initializeWindow() {
    if (SDL_Init(SDL_INIT_EVERYTHING) != 0) {
        fprintf(stderr, "Error initializing SDL.\n");
        return FALSE;
    }
    window = SDL_CreateWindow(
        NULL,
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        WINDOW_WIDTH,
        WINDOW_HEIGHT,
        SDL_WINDOW_BORDERLESS
    );
    if (!window) {
        fprintf(stderr, "Error creating SDL window.\n");
        return FALSE;
    }
    renderer = SDL_CreateRenderer(window, -1, 0);
    if (!renderer) {
        fprintf(stderr, "Error creating SDL renderer.\n");
        return FALSE;
    }
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);

    return TRUE;
}

void destroyWindow() {
    free(colorBuffer);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
}

void setup() {
// Original:
// =========
//  player.x = WINDOW_WIDTH / 2;
//  player.y = WINDOW_HEIGHT / 2;
//  player.rotationAngle = PI;
//  player.turnSpeed = 45 * (PI / 180);
//
// Rational:
// =========
    player.position.x = WINDOW_WIDTH / 2;
    player.position.y = WINDOW_HEIGHT / 2;
    player.orientation.x = -1;
    player.orientation.y = 0;
    player.turnSpeed = 1;
// =========
    player.width = 1;
    player.height = 1;
    player.turnDirection = 0;
    player.walkDirection = 0;
    player.walkSpeed = 100;

    // allocate the total amount of bytes in memory to hold our colorbuffer
    colorBuffer = (Uint32*) malloc(sizeof(Uint32) * (Uint32)WINDOW_WIDTH * (Uint32)WINDOW_HEIGHT);

    // create an SDL_Texture to display the colorbuffer
    colorBufferTexture = SDL_CreateTexture(
        renderer,
        SDL_PIXELFORMAT_ARGB8888,
        SDL_TEXTUREACCESS_STREAMING,
        WINDOW_WIDTH,
        WINDOW_HEIGHT
    );
}

int mapHasWallAt(float x, float y) {
    if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
        return TRUE;
    }
    int mapGridIndexX = floor(x / TILE_SIZE);
    int mapGridIndexY = floor(y / TILE_SIZE);
    return map[mapGridIndexY][mapGridIndexX] != 0;
}

void movePlayer(float deltaTime) {
    float moveStep = player.walkDirection * player.walkSpeed * deltaTime;
// Original:
// =========
//  player.rotationAngle += player.turnDirection * player.turnSpeed * deltaTime;
//  float newPlayerX = player.x + cos(player.rotationAngle) * moveStep;
//  float newPlayerY = player.y + sin(player.rotationAngle) * moveStep;
//
// Rational:
// =========
    rotate(&player.orientation, player.turnDirection * player.turnSpeed * deltaTime);
    float newPlayerX = player.position.x + player.orientation.x * moveStep;
    float newPlayerY = player.position.y + player.orientation.y * moveStep;

    setRotationMatrix(&player.rotation_matrix, &player.orientation);
// =========

    if (!mapHasWallAt(newPlayerX, newPlayerY)) {
        player.position.x = newPlayerX;
        player.position.y = newPlayerY;
    }
}

void renderPlayer() {
    SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
    SDL_Rect playerRect = {
        player.position.x * MINIMAP_SCALE_FACTOR,
        player.position.y * MINIMAP_SCALE_FACTOR,
        player.width * MINIMAP_SCALE_FACTOR,
        player.height * MINIMAP_SCALE_FACTOR
    };
    SDL_RenderFillRect(renderer, &playerRect);

    SDL_RenderDrawLine(
        renderer,
// Original:
// =========
//      MINIMAP_SCALE_FACTOR * player.x,
//      MINIMAP_SCALE_FACTOR * player.y,
//      MINIMAP_SCALE_FACTOR * (player.x + cos(player.rotationAngle) * 40),
//      MINIMAP_SCALE_FACTOR * (player.y + sin(player.rotationAngle) * 40)
//
// Rational:
// =========
        MINIMAP_SCALE_FACTOR * player.position.x,
        MINIMAP_SCALE_FACTOR * player.position.y,
        MINIMAP_SCALE_FACTOR * player.position.x + player.orientation.x * 40,
        MINIMAP_SCALE_FACTOR * player.position.y + player.orientation.y * 40
// =========
    );
}

// Original:
// =========
// float normalizeAngle(float angle) {
//    angle = remainder(angle, TWO_PI);
//    if (angle < 0) {
//        angle = TWO_PI + angle;
//    }
//    return angle;
//}
//
// float distanceBetweenPoints(float x1, float y1, float x2, float y2) {
//    return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
// }
//
// Rational:
// =========
float squaredDistanceBetweenPoints(float x1, float y1, float x2, float y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}
// =========

// Original:
// =========
// void castRay(float rayAngle, int stripId) {
//
//    rayAngle = normalizeAngle(rayAngle);
//    int isRayFacingDown = rayAngle > 0 && rayAngle < PI;
//    int isRayFacingRight = rayAngle < 0.5 * PI || rayAngle > 1.5 * PI;
//
// Rational:
// =========
void castRay(vec2* rayDir, int stripId) {
    int isRayFacingDown = rayDir->y > 0;
    int isRayFacingRight = rayDir->x > 0;
// =========
    int isRayFacingUp = !isRayFacingDown;
    int isRayFacingLeft = !isRayFacingRight;

    float xintercept, yintercept;
    float xstep, ystep;

    ///////////////////////////////////////////
    // HORIZONTAL RAY-GRID INTERSECTION CODE
    ///////////////////////////////////////////
    int foundHorzWallHit = FALSE;
    float horzWallHitX = 0;
    float horzWallHitY = 0;
    int horzWallContent = 0;

    // Find the y-coordinate of the closest horizontal grid intersection
    yintercept = floor(player.position.y / TILE_SIZE) * TILE_SIZE;
    yintercept += isRayFacingDown ? TILE_SIZE : 0;

// Original:
// =========
//  // Find the x-coordinate of the closest horizontal grid intersection
//  xintercept = player.x + (yintercept - player.y) / tan(rayAngle);
//
//  // Calculate the increment xstep and ystep
//  xstep = TILE_SIZE / tan(rayAngle);
//
// Rational:
// =========
    // Find the x-coordinate of the closest horizontal grid intersection
    xintercept = player.position.x + (yintercept - player.position.y) * rayDir->x / rayDir->y;

    // Calculate the increment xstep and ystep
    xstep = TILE_SIZE * rayDir->x / rayDir->y;
// ========
    xstep *= (isRayFacingLeft && xstep > 0) ? -1 : 1;
    xstep *= (isRayFacingRight && xstep < 0) ? -1 : 1;

    ystep = TILE_SIZE;
    ystep *= isRayFacingUp ? -1 : 1;

    float nextHorzTouchX = xintercept;
    float nextHorzTouchY = yintercept;

    // Increment xstep and ystep until we find a wall
    while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
        float xToCheck = nextHorzTouchX;
        float yToCheck = nextHorzTouchY + (isRayFacingUp ? -1 : 0);

        if (mapHasWallAt(xToCheck, yToCheck)) {
            // found a wall hit
            horzWallHitX = nextHorzTouchX;
            horzWallHitY = nextHorzTouchY;
            horzWallContent = map[(int)floor(yToCheck / TILE_SIZE)][(int)floor(xToCheck / TILE_SIZE)];
            foundHorzWallHit = TRUE;
            break;
        } else {
            nextHorzTouchX += xstep;
            nextHorzTouchY += ystep;
        }
    }

    ///////////////////////////////////////////
    // VERTICAL RAY-GRID INTERSECTION CODE
    ///////////////////////////////////////////
    int foundVertWallHit = FALSE;
    float vertWallHitX = 0;
    float vertWallHitY = 0;
    int vertWallContent = 0;

    // Find the x-coordinate of the closest vertical grid intersection
    xintercept = floor(player.position.x / TILE_SIZE) * TILE_SIZE;
    xintercept += isRayFacingRight ? TILE_SIZE : 0;

// Original:
// =========
//  // Find the y-coordinate of the closest vertical grid intersection
//  yintercept = player.y + (xintercept - player.x) * tan(rayAngle);
//
//  // Calculate the increment xstep and ystep
//  ystep = TILE_SIZE * tan(rayAngle);
// Rational:
// =========
    // Find the y-coordinate of the closest horizontal grid intersection
    yintercept = player.position.y + (xintercept - player.position.x) * rayDir->y / rayDir->x;

    // Calculate the increment xstep and ystep
    ystep = TILE_SIZE * rayDir->y / rayDir->x;
// ========
    ystep *= (isRayFacingUp && ystep > 0) ? -1 : 1;
    ystep *= (isRayFacingDown && ystep < 0) ? -1 : 1;

    xstep = TILE_SIZE;
    xstep *= isRayFacingLeft ? -1 : 1;

    float nextVertTouchX = xintercept;
    float nextVertTouchY = yintercept;

    // Increment xstep and ystep until we find a wall
    while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
        float xToCheck = nextVertTouchX + (isRayFacingLeft ? -1 : 0);
        float yToCheck = nextVertTouchY;

        if (mapHasWallAt(xToCheck, yToCheck)) {
            // found a wall hit
            vertWallHitX = nextVertTouchX;
            vertWallHitY = nextVertTouchY;
            vertWallContent = map[(int)floor(yToCheck / TILE_SIZE)][(int)floor(xToCheck / TILE_SIZE)];
            foundVertWallHit = TRUE;
            break;
        } else {
            nextVertTouchX += xstep;
            nextVertTouchY += ystep;
        }
    }

// Original:
// =========
//  // Calculate both horizontal and vertical hit distances and choose the smallest one
//  float horzHitDistance = foundHorzWallHit ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY) : INT_MAX;
//  float vertHitDistance = foundVertWallHit ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY) : INT_MAX;
//
// Rational:
// =========
    // Calculate both horizontal and vertical hit distances and choose the smallest one
    float horzHitDistance = foundHorzWallHit ? squaredDistanceBetweenPoints(player.position.x, player.position.y, horzWallHitX, horzWallHitY) : INT_MAX;
    float vertHitDistance = foundVertWallHit ? squaredDistanceBetweenPoints(player.position.x, player.position.y, vertWallHitX, vertWallHitY) : INT_MAX;
// ========

    if (vertHitDistance < horzHitDistance) {
// Original:
// =========
//      rays[stripId].distance = vertHitDistance;
//      rays[stripId].wallHitX = vertWallHitX;
//      rays[stripId].wallHitY = vertWallHitY;
//
// Rational:
// =========
        rays[stripId].wallHit.x = vertWallHitX;
        rays[stripId].wallHit.y = vertWallHitY;
// ========
        rays[stripId].wallHitContent = vertWallContent;
        rays[stripId].wasHitVertical = TRUE;
    } else {
// Original:
// =========
//      rays[stripId].distance = horzHitDistance;
//      rays[stripId].wallHitX = horzWallHitX;
//      rays[stripId].wallHitY = horzWallHitY;
//
// Rational:
// =========
        rays[stripId].wallHit.x = horzWallHitX;
        rays[stripId].wallHit.y = horzWallHitY;
// ========
        rays[stripId].wallHitContent = horzWallContent;
        rays[stripId].wasHitVertical = FALSE;
    }

// Original:
// =========
//  rays[stripId].rayAngle = rayAngle;
//
// Rational:
// =========
    rays[stripId].direction.x = rayDir->x;
    rays[stripId].direction.y = rayDir->y;
// ========
    rays[stripId].isRayFacingDown = isRayFacingDown;
    rays[stripId].isRayFacingUp = isRayFacingUp;
    rays[stripId].isRayFacingLeft = isRayFacingLeft;
    rays[stripId].isRayFacingRight = isRayFacingRight;
}

void castAllRays() {
// Original:
// =========
//  float rayAngle = player.rotationAngle - (FOV_ANGLE / 2);
//
// Rational:
// =========
    setRotationVector(&ray_direction, FIRST_RAY_DIRECTION);
    multiply(&ray_direction, &player.rotation_matrix);

    // Construct a rotation matrix for rotating a 2D direction
    // from the current-ray's direction to the next ray's direction:
    setRotationMatrixByAmount(&rotation_matrix, RAY_STEP);
// =========

    for (int stripId = 0; stripId < NUM_RAYS; stripId++) {
// Original:
// =========
//      castRay(rayAngle, stripId);
//      rayAngle += FOV_ANGLE / NUM_RAYS;
//
// Rational:
// =========
        castRay(&ray_direction, stripId);
        multiply(&ray_direction, &rotation_matrix);
// =========
    }
}

void renderMap() {
    for (int i = 0; i < MAP_NUM_ROWS; i++) {
        for (int j = 0; j < MAP_NUM_COLS; j++) {
            int tileX = j * TILE_SIZE;
            int tileY = i * TILE_SIZE;
            int tileColor = map[i][j] != 0 ? 255 : 0;

            SDL_SetRenderDrawColor(renderer, tileColor, tileColor, tileColor, 255);
            SDL_Rect mapTileRect = {
                tileX * MINIMAP_SCALE_FACTOR,
                tileY * MINIMAP_SCALE_FACTOR,
                TILE_SIZE * MINIMAP_SCALE_FACTOR,
                TILE_SIZE * MINIMAP_SCALE_FACTOR
            };
            SDL_RenderFillRect(renderer, &mapTileRect);
        }
    }
}

void renderRays() {
    SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
    for (int i = 0; i < NUM_RAYS; i++) {
        SDL_RenderDrawLine(
            renderer,
            MINIMAP_SCALE_FACTOR * player.position.x,
            MINIMAP_SCALE_FACTOR * player.position.y,
            MINIMAP_SCALE_FACTOR * rays[i].wallHit.x,
            MINIMAP_SCALE_FACTOR * rays[i].wallHit.y
        );
    }
}

void processInput() {
    SDL_Event event;
    SDL_PollEvent(&event);
    switch (event.type) {
        case SDL_QUIT: {
            isGameRunning = FALSE;
            break;
        }
        case SDL_KEYDOWN: {
            if (event.key.keysym.sym == SDLK_ESCAPE)
                isGameRunning = FALSE;
            if (event.key.keysym.sym == SDLK_UP)
                player.walkDirection = +1;
            if (event.key.keysym.sym == SDLK_DOWN)
                player.walkDirection = -1;
            if (event.key.keysym.sym == SDLK_RIGHT)
                player.turnDirection = +1;
            if (event.key.keysym.sym == SDLK_LEFT)
                player.turnDirection = -1;
            break;
        }
        case SDL_KEYUP: {
            if (event.key.keysym.sym == SDLK_UP)
                player.walkDirection = 0;
            if (event.key.keysym.sym == SDLK_DOWN)
                player.walkDirection = 0;
            if (event.key.keysym.sym == SDLK_RIGHT)
                player.turnDirection = 0;
            if (event.key.keysym.sym == SDLK_LEFT)
                player.turnDirection = 0;
            break;
        }
    }
}

void update() {
    // waste some time until we reach the target frame time length
    while (!SDL_TICKS_PASSED(SDL_GetTicks(), ticksLastFrame + FRAME_TIME_LENGTH));

    float deltaTime = (SDL_GetTicks() - ticksLastFrame) / 1000.0f;

    ticksLastFrame = SDL_GetTicks();

    movePlayer(deltaTime);
    castAllRays();
}

void generate3DProjection() {
    for (int i = 0; i < NUM_RAYS; i++) {
// Original:
// =========
//      float perpDistance = rays[i].distance * cos(rays[i].rayAngle - player.rotationAngle);
//      float distanceProjPlane = (WINDOW_WIDTH / 2) / tan(FOV_ANGLE / 2);
//
// Rational:
// =========
        setDirection(&ray_direction, &player.position, &rays[i].wallHit);
        float perpDistance = dot(&ray_direction, &player.orientation);
        float distanceProjPlane = (WINDOW_WIDTH / 2) * (FOCAL_LENGTH / 2);
// =========

        float projectedWallHeight = (TILE_SIZE / perpDistance) * distanceProjPlane;

        int wallStripHeight = (int)projectedWallHeight;

        int wallTopPixel = (WINDOW_HEIGHT / 2) - (wallStripHeight / 2);
        wallTopPixel = wallTopPixel < 0 ? 0 : wallTopPixel;

        int wallBottomPixel = (WINDOW_HEIGHT / 2) + (wallStripHeight / 2);
        wallBottomPixel = wallBottomPixel > WINDOW_HEIGHT ? WINDOW_HEIGHT : wallBottomPixel;

        // set the color of the ceiling
        for (int y = 0; y < wallTopPixel; y++)
            colorBuffer[(WINDOW_WIDTH * y) + i] = 0xFF333333;

        // render the wall from wallTopPixel to wallBottomPixel
        for (int y = wallTopPixel; y < wallBottomPixel; y++) {
            colorBuffer[(WINDOW_WIDTH * y) + i] = rays[i].wasHitVertical ? 0xFFFFFFFF : 0xFFCCCCCC;
        }

        // set the color of the floor
        for (int y = wallBottomPixel; y < WINDOW_HEIGHT; y++)
            colorBuffer[(WINDOW_WIDTH * y) + i] = 0xFF777777;
    }
}

void clearColorBuffer(Uint32 color) {
    for (int x = 0; x < WINDOW_WIDTH; x++)
        for (int y = 0; y < WINDOW_HEIGHT; y++)
            colorBuffer[(WINDOW_WIDTH * y) + x] = color;
}

void renderColorBuffer() {
    SDL_UpdateTexture(
        colorBufferTexture,
        NULL,
        colorBuffer,
        (int)((Uint32)WINDOW_WIDTH * sizeof(Uint32))
    );
    SDL_RenderCopy(renderer, colorBufferTexture, NULL, NULL);
}

void render() {
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
    SDL_RenderClear(renderer);

    generate3DProjection();

    renderColorBuffer();
    clearColorBuffer(0xFF000000);

    renderMap();
    renderRays();
    renderPlayer();

    SDL_RenderPresent(renderer);
}

int main() {
    isGameRunning = initializeWindow();

    setup();

    while (isGameRunning) {
        processInput();
        update();
        render();
    }

    destroyWindow();

    return 0;
}
