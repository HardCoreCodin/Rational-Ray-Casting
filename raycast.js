const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOCAL_LENGTH = 3.5;
const PROJECTION_PLANE_WIDTH = 2 / FOCAL_LENGTH;
const FIRST_RAY_ROTATION_AMOUNT = -PROJECTION_PLANE_WIDTH / 2;

const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.2;
const RAY_STEP = PROJECTION_PLANE_WIDTH / NUM_RAYS;

class Map {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 3, 0, 0, 1, 0, 0, 3, 1, 0, 1, 0, 1],
            [1, 0, 0, 3, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 0, 2, 3, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }
    getWallContentAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return 1;
        }
        var mapGridIndexX = ~~(x / TILE_SIZE);
        var mapGridIndexY = ~~(y / TILE_SIZE);
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

class vec2 {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
    }

    setRotation(t) {
        // Project a point on a unit circle from a position on a vertical line of "x = 1" towards the origin
        const t2 = t*t;
        const mult = 1 / (1 + t2);
        this.x = (1 - t2) * mult;
        this.y = (2 * t) * mult;
    }

    rotateBy(matrix) {
        const x = this.x;
        const y = this.y;
        this.x = matrix.m11*x + matrix.m21*y;
        this.y = matrix.m12*x + matrix.m22*y;
    }
}

class mat2 {
    constructor() {
        this.m11 = 0; this.m21 = 0;
        this.m12 = 0; this.m22 = 0;

        this.temp_direction = new vec2();
    }

    setRotationByAmount(amount) {
        this.temp_direction.setRotation(amount);
        this.setRotationByDirection(this.temp_direction.x, this.temp_direction.y);
    }

    setRotationByDirection(x, y) {
        // Construct a 2D rotation matrix from a 2D coordinate of a unit vector (point on a unit circle):
        this.m11 =  x;  this.m12 = y;
        this.m21 = -y;  this.m22 = x;
    }
}

class Player {
    constructor() {
        this.position = new vec2(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 7);
        this.radius = 4;
        this.turnDirection = 0; // -1 if left, +1 if right
        this.walkDirection = 0; // -1 if back, +1 if front
        this.orientation = new vec2(0, 1);
        this.rotation_matrix = new mat2();
        this.relative_rotation_matrix = new mat2();
        this.moveSpeed = 4.0;
        this.rotationSpeed = 0.03;
    }
    update() {
        // Rotate the orientation vector by a 2D rotation matrix representing the rotation by the given amount:
        this.relative_rotation_matrix.setRotationByAmount(this.turnDirection * this.rotationSpeed);
        this.orientation.rotateBy(this.relative_rotation_matrix);
        this.rotation_matrix.setRotationByDirection(this.orientation.x, this.orientation.y);

        var moveStep = this.walkDirection * this.moveSpeed;

        var newPlayerX = this.position.x + this.orientation.x * moveStep;
        var newPlayerY = this.position.y + this.orientation.y * moveStep;

        if (grid.getWallContentAt(newPlayerX, newPlayerY) == 0) {
            this.position.x = newPlayerX;
            this.position.y = newPlayerY;
        }
    }
    render() {
        noStroke();
        fill("blue");
        circle(
            MINIMAP_SCALE_FACTOR * this.x,
            MINIMAP_SCALE_FACTOR * this.y,
            MINIMAP_SCALE_FACTOR * this.radius
        );
        stroke("blue");
        line(
            MINIMAP_SCALE_FACTOR * this.x,
            MINIMAP_SCALE_FACTOR * this.y,
            MINIMAP_SCALE_FACTOR * (this.x + this.orientation.x * 30),
            MINIMAP_SCALE_FACTOR * (this.y + this.orientation.y * 30)
        );
    }
}

class Ray {
    constructor(dirX, dirY) {
        this.direction = new vec2(dirX, dirY);
        this.wallHit = new vec2();
        this.wasHitVertical = false;
        this.hitWallColor = 0;

        this.isRayFacingDown = dirY > 0;
        this.isRayFacingUp = !this.isRayFacingDown;

        this.isRayFacingRight = dirX > 0;
        this.isRayFacingLeft = !this.isRayFacingRight;
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
        yintercept = ~~(player.position.y / TILE_SIZE) * TILE_SIZE;
        yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

        // Find the x-coordinate of the closest horizontal grid intersection
        xintercept = player.position.x + (yintercept - player.position.y) * this.direction.x / this.direction.y;

        // Calculate the increment xstep and ystep
        ystep = TILE_SIZE;
        ystep *= this.isRayFacingUp ? -1 : 1;

        xstep = TILE_SIZE * this.direction.x / this.direction.y;
        xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

        var nextHorzTouchX = xintercept;
        var nextHorzTouchY = yintercept;

        if (this.isRayFacingUp)
            nextHorzTouchY--;

        // Increment xstep and ystep until we find a wall
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(nextHorzTouchX, nextHorzTouchY);
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
        xintercept = ~~(player.position.x / TILE_SIZE) * TILE_SIZE;
        xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

        // Find the y-coordinate of the closest vertical grid intersection
        yintercept = player.position.y + (xintercept - player.position.x) * this.direction.y / this.direction.x;

        // Calculate the increment xstep and ystep
        xstep = TILE_SIZE;
        xstep *= this.isRayFacingLeft ? -1 : 1;

        ystep = TILE_SIZE * this.direction.y / this.direction.x;
        ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
        ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

        var nextVertTouchX = xintercept;
        var nextVertTouchY = yintercept;

        if (this.isRayFacingLeft)
            nextVertTouchX--;

        // Increment xstep and ystep until we find a wall
        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            var wallGridContent = grid.getWallContentAt(nextVertTouchX, nextVertTouchY);
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
        var horzHitDistanceSquared = (foundHorzWallHit)
            ? distanceBetweenPointsSquared(player.position.x, player.position.y, horzWallHitX, horzWallHitY)
            : Number.MAX_VALUE;
        var vertHitDistanceSquared = (foundVertWallHit)
            ? distanceBetweenPointsSquared(player.position.x, player.position.y, vertWallHitX, vertWallHitY)
            : Number.MAX_VALUE;

        // only store the smallest of the distances
        if (vertHitDistanceSquared < horzHitDistanceSquared) {
            this.wallHit.x = vertWallHitX;
            this.wallHit.y = vertWallHitY;
            this.hitWallColor = vertWallColor;
            this.wasHitVertical = true;
        } else {
            this.wallHit.x = horzWallHitX;
            this.wallHit.y = horzWallHitY;
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
const ray_direction = new vec2();
const rotation_matrix = new mat2();

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
    // start first ray direction:
    ray_direction.setRotation(FIRST_RAY_ROTATION_AMOUNT);
    ray_direction.rotateBy(player.rotation_matrix);

    // Construct a rotation matrix for rotating a 2D direction
    // from the current-ray's direction to the next ray's direction:
    rotation_matrix.setRotationByAmount(RAY_STEP);

    rays = [];

    // loop all columns casting the rays
    for (var i = 0; i < NUM_RAYS; i++) {
        var ray = new Ray(ray_direction.x, ray_direction.y);
        ray.cast();
        rays.push(ray);

        ray_direction.rotateBy(rotation_matrix);
    }
}

function render3DProjectedWalls() {
    // loop every ray in the array of rays
    for (var i = 0; i < NUM_RAYS; i++) {
        var ray = rays[i];

        // get the perpendicular distance to the wall to fix fishbowl distortion
        var correctWallDistance = (ray.wallHit.x - player.position.x)*player.orientation.x + (ray.wallHit.y - player.position.y)*player.orientation.y;

        // calculate the distance to the projection plane
        var distanceProjectionPlane = (WINDOW_WIDTH / 2) / PROJECTION_PLANE_WIDTH;

        // projected wall height
        var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;

        // compute the transparency based on the wall distance
        var alpha = 200 / correctWallDistance;

        // set the correct color based on the wall hit grid content (1=Red, 2=Green, 3=Blue)
        var colorR = ray.hitWallColor == 1 ? 255 : ray.hitWallColor == 2 ? 0 : ray.hitWallColor == 3 ? 0 : 255;
        var colorG = ray.hitWallColor == 1 ? 0 : ray.hitWallColor == 2 ? 255 : ray.hitWallColor == 3 ? 0 : 255;
        var colorB = ray.hitWallColor == 1 ? 0 : ray.hitWallColor == 2 ? 0 : ray.hitWallColor == 3 ? 255 : 255;
        fill("rgba(" + colorR + ", " + colorG + ", " + colorB + ", " + alpha + ")");
        noStroke();

        // render a rectangle with the calculated wall height
        rect(
           i * WALL_STRIP_WIDTH,
           (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
           WALL_STRIP_WIDTH,
           wallStripHeight
        );
    }
}

function distanceBetweenPointsSquared(x1, y1, x2, y2) {
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
