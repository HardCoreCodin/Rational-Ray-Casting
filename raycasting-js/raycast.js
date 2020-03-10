const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const WALL_STRIP_WIDTH = 8;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.3;

// Original:
// =========
// const FOV_ANGLE = 60 * (Math.PI / 180);
//
// Rational:
// =========
const FOCAL_LENGTH = 3.5;
const FOV_RATIO = 1 / FOCAL_LENGTH;
const PROJECTION_PLANE_WIDTH = 2 * FOV_RATIO;
const FIRST_RAY_DIRECTION = -FOV_RATIO;
const RAY_STEP = PROJECTION_PLANE_WIDTH / NUM_RAYS;

class vec2 {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new vec2(this.x, this.y);
    }

    setRotation(t) {
        // Project a point on a unit circle from a position on a vertical line of "x = 1" towards the origin
        const t2 = t*t;
        const mult = 1 / (1 + t2);

        this.x = (1 - t2) * mult;
        this.y = (2 * t) * mult;
        return this;
    }

    rotateBy(amount) {
        return this.multiplyBy(temp_matrix.setRotationByAmount(amount));
    }

    multiplyBy(matrix) {
        const x = this.x;
        const y = this.y;
        this.x = matrix.m11*x + matrix.m21*y;
        this.y = matrix.m12*x + matrix.m22*y;
        return this;
    }

    projected_onto(other) {
        return (
            this.x * other.x
        ) + (
            this.y * other.y
        );
    }

    to(other, out) {
        out.x = other.x - this.x;
        out.y = other.y - this.y;
        return out;
    }
}

class mat2 {
    constructor() {
        this.m11 = 1; this.m21 = 0;
        this.m12 = 0; this.m22 = 1;
    }

    setRotationByAmount(amount) {
        return this.setRotation(temp_direction.setRotation(amount));
    }

    setRotation(v) {
        // Construct a 2D rotation matrix from a 2D coordinate of a unit vector (point on a unit circle):
        this.m11 = v.x;  this.m21 = -v.y;
        this.m12 = v.y;  this.m22 =  v.x;
        return this;
    }
}

const ray_direction = new vec2();
const rotation_matrix = new mat2();
const temp_matrix = new mat2();
const temp_direction = new vec2();
// =========

class Map {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 3, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 3, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }
    hasWallAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return true;
        }
        var mapGridIndexX = Math.floor(x / TILE_SIZE);
        var mapGridIndexY = Math.floor(y / TILE_SIZE);
        return this.grid[mapGridIndexY][mapGridIndexX] != 0;
    }
    getWallContentAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return 0;
        }
        var mapGridIndexX = Math.floor(x / TILE_SIZE);
        var mapGridIndexY = Math.floor(y / TILE_SIZE);
        return this.grid[mapGridIndexY][mapGridIndexX];
    }
    render() {
        for (var i = 0; i < MAP_NUM_ROWS; i++) {
            for (var j = 0; j < MAP_NUM_COLS; j++) {
                var tileX = j * TILE_SIZE;
                var tileY = i * TILE_SIZE;
                var tileColor = this.grid[i][j] != 0 ? "#222" : "#fff";
                stroke("#222");
                fill(tileColor);
                rect(
                    MINIMAP_SCALE_FACTOR * tileX,
                    MINIMAP_SCALE_FACTOR * tileY,
                    MINIMAP_SCALE_FACTOR * TILE_SIZE,
                    MINIMAP_SCALE_FACTOR * TILE_SIZE
                );
            }
        }
    }
}

class Player {
    constructor() {
// Original:
// =========
//         this.x = WINDOW_WIDTH / 2;
//         this.y = WINDOW_HEIGHT / 7;
//         this.rotationAngle = Math.PI / 2;
//         this.rotationSpeed = 1 * (Math.PI / 180);
//
// Rational:
// =========
        this.position = new vec2(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 7);
        this.orientation = new vec2(0, 1);
        this.rotation_matrix = new mat2();
        this.rotationSpeed = 0.03;
// =========

        this.radius = 4;
        this.turnDirection = 0; // -1 if left, +1 if right
        this.walkDirection = 0; // -1 if back, +1 if front
        this.moveSpeed = 4.0;
    }
    update() {
        var moveStep = this.walkDirection * this.moveSpeed;

// Original:
// =========
//      this.rotationAngle += this.turnDirection * this.rotationSpeed;
//      var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
//      var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;
//
// Rational:
// =========
        this.orientation.rotateBy(this.turnDirection * this.rotationSpeed);
        var newPlayerX = this.position.x + this.orientation.x * moveStep;
        var newPlayerY = this.position.y + this.orientation.y * moveStep;

        this.rotation_matrix.setRotation(this.orientation);
// =========

        if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
            this.position.x = newPlayerX;
            this.position.y = newPlayerY;
        }
    }
    render() {
        noStroke();
        fill("blue");
        circle(
            MINIMAP_SCALE_FACTOR * this.position.x,
            MINIMAP_SCALE_FACTOR * this.position.y,
            MINIMAP_SCALE_FACTOR * this.radius
        );
        stroke("blue");
        line(
// Original:
// =========
//          MINIMAP_SCALE_FACTOR * this.x,
//          MINIMAP_SCALE_FACTOR * this.y,
//          MINIMAP_SCALE_FACTOR * (this.x + Math.cos(this.rotationAngle) * 30),
//          MINIMAP_SCALE_FACTOR * (this.y + Math.sin(this.rotationAngle) * 30)
//
// Rational:
// =========
            MINIMAP_SCALE_FACTOR * this.position.x,
            MINIMAP_SCALE_FACTOR * this.position.y,
            MINIMAP_SCALE_FACTOR * (this.position.x + this.orientation.x * 30),
            MINIMAP_SCALE_FACTOR * (this.position.y + this.orientation.y * 30)
// =========
        );
    }
}

class Ray {
// Original:
// =========
//     constructor(rayAngle) {
//         this.rayAngle = normalizeAngle(rayAngle);
//         this.wallHitX = 0;
//         this.wallHitY = 0;
//         this.distance = 0;
//         this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
//         this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
//
// Rational:
// =========
    constructor(direction) {
        this.direction = direction.copy();
        this.wallHit = new vec2();
        this.isRayFacingRight = direction.x > 0;
        this.isRayFacingDown = direction.y > 0;
// =========
        this.isRayFacingUp = !this.isRayFacingDown;
        this.isRayFacingLeft = !this.isRayFacingRight;
        this.wasHitVertical = false;
        this.hitWallColor = 0;
    }
    cast() {
        var xintercept, yintercept;
        var xstep, ystep;

        ///////////////////////////////////////////
        // HORIZONTAL RAY-GRID INTERSECTION CODE
        ///////////////////////////////////////////
        var foundHorzWallHit = false;
        var horzWallHitX = 0;
        var horzWallHitY = 0;
        var horzWallColor = 0;

        // Find the y-coordinate of the closest horizontal grid intersenction
        yintercept = Math.floor(player.position.y / TILE_SIZE) * TILE_SIZE;
        yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

// Original:
// =========
//      // Find the x-coordinate of the closest horizontal grid intersection
//      xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);
//
//      // Calculate the increment xstep and ystep
//      xstep = TILE_SIZE / Math.tan(this.rayAngle);
//
// Rational:
// =========
        // Find the x-coordinate of the closest horizontal grid intersection
        xintercept = player.position.x + (yintercept - player.position.y) * this.direction.x / this.direction.y;

        // Calculate the increment xstep and ystep
        xstep = TILE_SIZE * this.direction.x / this.direction.y;
// =========
        xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

        ystep = TILE_SIZE;
        ystep *= this.isRayFacingUp ? -1 : 1;

        var nextHorzTouchX = xintercept;
        var nextHorzTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(
                nextHorzTouchX,
                nextHorzTouchY + (this.isRayFacingUp ? -1 : 0) // if ray is facing up, force one pixel up so we are inside a grid cell
            );
            if (wallGridContent != 0) {
                foundHorzWallHit = true;
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
                horzWallColor = wallGridContent;
                break;
            } else {
                nextHorzTouchX += xstep;
                nextHorzTouchY += ystep;
            }
        }

        ///////////////////////////////////////////
        // VERTICAL RAY-GRID INTERSECTION CODE
        ///////////////////////////////////////////
        var foundVertWallHit = false;
        var vertWallHitX = 0;
        var vertWallHitY = 0;
        var vertWallColor = 0;

        // Find the x-coordinate of the closest vertical grid intersenction
        xintercept = Math.floor(player.position.x / TILE_SIZE) * TILE_SIZE;
        xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

// Original:
// =========
//      // Find the y-coordinate of the closest vertical grid intersection
//      yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);
//
//      // Calculate the increment xstep and ystep
//      ystep = TILE_SIZE * Math.tan(this.rayAngle);
//
// Rational:
// =========
        // Find the y-coordinate of the closest vertical grid intersection
        yintercept = player.position.y + (xintercept - player.position.x) * this.direction.y / this.direction.x;

        // Calculate the increment xstep and ystep
        ystep = TILE_SIZE * this.direction.y / this.direction.x;
// =========
        ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
        ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

        xstep = TILE_SIZE;
        xstep *= this.isRayFacingLeft ? -1 : 1;

        var nextVertTouchX = xintercept;
        var nextVertTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(
                nextVertTouchX + (this.isRayFacingLeft ? -1 : 0), // if ray is facing left, force one pixel left so we are inside a grid cell
                nextVertTouchY
            );
            if (wallGridContent != 0) {
                foundVertWallHit = true;
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                vertWallColor = wallGridContent;
                break;
            } else {
                nextVertTouchX += xstep;
                nextVertTouchY += ystep;
            }
        }

        // Calculate both horizontal and vertical distances and choose the smallest value
// Original:
// =========
//      var horzHitDistance = foundHorzWallHit ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY) : Number.MAX_VALUE;
//      var vertHitDistance = foundVertWallHit ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY) : Number.MAX_VALUE;
//
// Rational:
// =========
        var horzHitDistance = foundHorzWallHit ? squaredDistanceBetweenPoints(player.position.x, player.position.y, horzWallHitX, horzWallHitY) : Number.MAX_VALUE;
        var vertHitDistance = foundVertWallHit ? squaredDistanceBetweenPoints(player.position.x, player.position.y, vertWallHitX, vertWallHitY) : Number.MAX_VALUE;
// =========

        // only store the smallest distance
        if (vertHitDistance < horzHitDistance) {
// Original:
// =========
//          this.wallHitX = vertWallHitX;
//          this.wallHitY = vertWallHitY;
//          this.distance = vertHitDistance;
//
// Rational:
// =========
            this.wallHit.x = vertWallHitX;
            this.wallHit.y = vertWallHitY;
// =========
            this.hitWallColor = vertWallColor;
            this.wasHitVertical = true;
        } else {
// Original:
// =========
//          this.wallHitX = horzWallHitX;
//          this.wallHitY = horzWallHitY;
//          this.distance = horzHitDistance;
//
// Rational:
// =========
            this.wallHit.x = horzWallHitX;
            this.wallHit.y = horzWallHitY;
// =========
            this.hitWallColor = horzWallColor;
            this.wasHitVertical = false;
        }
    }
    render() {
        stroke("rgba(255, 0, 0, 1.0)");
        line(
            MINIMAP_SCALE_FACTOR * player.position.x,
            MINIMAP_SCALE_FACTOR * player.position.y,
            MINIMAP_SCALE_FACTOR * this.wallHit.x,
            MINIMAP_SCALE_FACTOR * this.wallHit.y
        );
    }
}

var grid = new Map();
var player = new Player();
var rays = [];


function keyPressed() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = +1;
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection = -1;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = +1;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection = -1;
    }
}

function keyReleased() {
    if (keyCode == UP_ARROW) {
        player.walkDirection = 0;
    } else if (keyCode == DOWN_ARROW) {
        player.walkDirection = 0;
    } else if (keyCode == RIGHT_ARROW) {
        player.turnDirection = 0;
    } else if (keyCode == LEFT_ARROW) {
        player.turnDirection = 0;
    }
}

function castAllRays() {
// Original:
// =========
//    // start first ray subtracting half of the FOV
//    var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);
//
// Rational:
// =========
    // start first ray direction:
    ray_direction.setRotation(FIRST_RAY_DIRECTION).multiplyBy(player.rotation_matrix);

    // Construct a rotation matrix for rotating a 2D direction
    // from the current-ray's direction to the next ray's direction:
    rotation_matrix.setRotationByAmount(RAY_STEP);
// =========

    // empty array of rays
    rays = [];

    // loop all columns casting the rays
    for (var col = 0; col < NUM_RAYS; col++) {
// Original:
// =========
//         var ray = new Ray(rayAngle);
//         rayAngle += FOV_ANGLE / NUM_RAYS;
//
// Rational:
// =========
        var ray = new Ray(ray_direction);
        ray_direction.multiplyBy(rotation_matrix);
// =========

        ray.cast();
        rays.push(ray);
    }
}
function renderCeiling() {
    noStroke();
    fill('#414141');
    rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT/2);
}

function renderFloor() {
    noStroke();
    fill('#818181');
    rect(0, WINDOW_HEIGHT/2, WINDOW_WIDTH, WINDOW_HEIGHT)
}

function render3DProjectedWalls() {
    renderCeiling();
    renderFloor();

    // loop every ray in the array of rays
    for (var i = 0; i < NUM_RAYS; i++) {
        var ray = rays[i];

// Original:
// =========
//      // get the perpendicular distance to the wall to fix fishbowl distortion
//      var correctWallDistance = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);
//
//      // calculate the distance to the projection plane
//      var distanceProjectionPlane = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2);
//
// Rational:
// =========
        // get the perpendicular distance to the wall to fix fishbowl distortion
        var correctWallDistance = player.position.to(ray.wallHit, ray_direction).projected_onto(player.orientation);

        // calculate the distance to the projection plane
        var distanceProjectionPlane = (WINDOW_WIDTH / 2) * (FOCAL_LENGTH / 2);
// =========
        // projected wall height
        var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;

        // set a darker color if the wall is facing north-south
        var colorBrightness = ray.wasHitVertical ? 255 : 200;

        // set the correct color based on the wall hit grid content (1=Red, 2=Green, 3=Blue)
        var colorR = ray.hitWallColor == 1 ? colorBrightness : 0;
        var colorG = ray.hitWallColor == 2 ? colorBrightness : 0;
        var colorB = ray.hitWallColor == 3 ? colorBrightness : 0;
        var alpha = 1.0;

        fill("rgba(" + colorR + ", " + colorG + ", " + colorB + ", " + alpha + ")");
        noStroke();

        // render a rectangle with the calculated projected wall height
        rect(
           i * WALL_STRIP_WIDTH,
           (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
           WALL_STRIP_WIDTH,
           wallStripHeight
        );
    }
}

// Original:
// =========
// function normalizeAngle(angle) {
//     angle = angle % (2 * Math.PI);
//     if (angle < 0) {
//         angle = (2 * Math.PI) + angle;
//     }
//     return angle;
// }
//
// function distanceBetweenPoints(x1, y1, x2, y2) {
//     return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
// }
//
// Rational:
// =========
function squaredDistanceBetweenPoints(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

function setup() {
    createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
    player.update();
    castAllRays();
}

function draw() {
    background("#111");
    update();

    render3DProjectedWalls();

    grid.render();
    for (ray of rays) {
        ray.render();
    }
    player.render();
}
