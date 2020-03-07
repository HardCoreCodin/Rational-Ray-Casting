const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOCAL_LENGTH = 3.5;
const PROJECTION_PLANE_WIDTH = 2 / FOCAL_LENGTH;

const WALL_STRIP_WIDTH = 1; 
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;
const RAY_STEP = PROJECTION_PLANE_WIDTH / NUM_RAYS;
const MINIMAP_SCALE_FACTOR = 0.25; 

class Map {
    constructor() {
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
    }
    hasWallAt(x, y) {
        if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
            return true;
        }
        var mapGridIndexX = ~~(x / TILE_SIZE);
        var mapGridIndexY = ~~(y / TILE_SIZE);
        return this.grid[mapGridIndexY][mapGridIndexX] != 0;
    }
    render() {
        for (var i = 0; i < MAP_NUM_ROWS; i++) {
            for (var j = 0; j < MAP_NUM_COLS; j++) {
                var tileX = j * TILE_SIZE;
                var tileY = i * TILE_SIZE;
                var tileColor = this.grid[i][j] == 1 ? "#222" : "#fff";
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
        this.x = WINDOW_WIDTH / 2;
        this.y = WINDOW_HEIGHT / 7;
        this.radius = 4;
        this.turnDirection = 0; // -1 if left, +1 if right
        this.walkDirection = 0; // -1 if back, +1 if front
        this.orientation = {x: 0, y: 1};
        this.rotation_matrix = getRotationMatrixFromDirection(this.orientation);
        this.moveSpeed = 4.0;
        this.rotationSpeed = 0.03;
    }
    update() {
        rotateVectorByAmount(this.orientation, this.turnDirection * this.rotationSpeed);
        setRotationMatrix(this.rotation_matrix, this.orientation.x, this.orientation.y);

        var moveStep = this.walkDirection * this.moveSpeed;

        var newPlayerX = this.x + this.orientation.x * moveStep;
        var newPlayerY = this.y + this.orientation.y * moveStep;

        if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
            this.x = newPlayerX;
            this.y = newPlayerY;
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
        this.direction = {x: dirX, y: dirY};
        this.wallHitX = 0;
        this.wallHitY = 0;
        this.wasHitVertical = false;

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

        // Find the y-coordinate of the closest horizontal grid intersenction
        yintercept = ~~(player.y / TILE_SIZE) * TILE_SIZE;
        yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

        // Find the x-coordinate of the closest horizontal grid intersection
        xintercept = player.x + (yintercept - player.y) * this.direction.x / this.direction.y;

        // Calculate the increment xstep and ystep
        ystep = TILE_SIZE;
        ystep *= this.isRayFacingUp ? -1 : 1;

        xstep = TILE_SIZE * this.direction.x / this.direction.y;
        xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
        xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

        var nextHorzTouchX = xintercept;
        var nextHorzTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextHorzTouchX >= 0 && nextHorzTouchX <= WINDOW_WIDTH && nextHorzTouchY >= 0 && nextHorzTouchY <= WINDOW_HEIGHT) {
            if (grid.hasWallAt(nextHorzTouchX, nextHorzTouchY - (this.isRayFacingUp ? 1 : 0))) {
                foundHorzWallHit = true;
                horzWallHitX = nextHorzTouchX;
                horzWallHitY = nextHorzTouchY;
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

        // Find the x-coordinate of the closest vertical grid intersenction
        xintercept = ~~(player.x / TILE_SIZE) * TILE_SIZE;
        xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

        // Find the y-coordinate of the closest vertical grid intersection
        yintercept = player.y + (xintercept - player.x) * this.direction.y / this.direction.x;

        // Calculate the increment xstep and ystep
        xstep = TILE_SIZE;
        xstep *= this.isRayFacingLeft ? -1 : 1;

        ystep = TILE_SIZE * this.direction.y / this.direction.x;
        ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
        ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

        var nextVertTouchX = xintercept;
        var nextVertTouchY = yintercept;

        // Increment xstep and ystep until we find a wall
        while (nextVertTouchX >= 0 && nextVertTouchX <= WINDOW_WIDTH && nextVertTouchY >= 0 && nextVertTouchY <= WINDOW_HEIGHT) {
            if (grid.hasWallAt(nextVertTouchX - (this.isRayFacingLeft ? 1 : 0), nextVertTouchY)) {
                foundVertWallHit = true;
                vertWallHitX = nextVertTouchX;
                vertWallHitY = nextVertTouchY;
                break;
            } else {
                nextVertTouchX += xstep;
                nextVertTouchY += ystep;
            }
        }

        // Calculate both horizontal and vertical distances and choose the smallest value
        var horzHitDistanceSquared = (foundHorzWallHit)
            ? distanceBetweenPointsSquared(player.x, player.y, horzWallHitX, horzWallHitY)
            : Number.MAX_VALUE;
        var vertHitDistanceSquared = (foundVertWallHit)
            ? distanceBetweenPointsSquared(player.x, player.y, vertWallHitX, vertWallHitY)
            : Number.MAX_VALUE;

        // only store the smallest of the distances
        if (vertHitDistanceSquared < horzHitDistanceSquared) {
            this.wallHitX = vertWallHitX;
            this.wallHitY = vertWallHitY;
            this.wasHitVertical = true;
        } else {
            this.wallHitX = horzWallHitX;
            this.wallHitY = horzWallHitY;
            this.wasHitVertical = false;
        }
    }
    render() {
        stroke("rgba(255, 0, 0, 1.0)");
        line(
            MINIMAP_SCALE_FACTOR * player.x,
            MINIMAP_SCALE_FACTOR * player.y,
            MINIMAP_SCALE_FACTOR * this.wallHitX,
            MINIMAP_SCALE_FACTOR * this.wallHitY
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
    // start first ray direction:
    var ray_direction = getUnitVector(-PROJECTION_PLANE_WIDTH / 2);
    multiplyVectorByMatrix(player.rotation_matrix, ray_direction);

    // Construct a rotation matrix for rotating a 2D direction
    // from the current-ray's direction to the next ray's direction:
    var rotation_matrix = getRotationMatrix(RAY_STEP);

    rays = [];

    // loop all columns casting the rays
    for (var col = 0; col < NUM_RAYS; col++) {
        var ray = new Ray(ray_direction.x, ray_direction.y);
        ray.cast();
        rays.push(ray);

        multiplyVectorByMatrix(rotation_matrix, ray_direction);
    }
}

function render3DProjectedWalls() {
    // loop every ray in the array of rays
    for (var i = 0; i < NUM_RAYS; i++) {
        var ray = rays[i];

        // get the perpendicular distance to the wall to fix fishbowl distortion
        var correctWallDistance = (ray.wallHitX - player.x)*player.orientation.x + (ray.wallHitY - player.y)*player.orientation.y;

        // calculate the distance to the projection plane
        var distanceProjectionPlane = (WINDOW_WIDTH / 2) / PROJECTION_PLANE_WIDTH;

        // projected wall height
        var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;
        
        // compute the transparency based on the wall distance
        var alpha = 1.0; //170 / correctWallDistance;
        
        var color = ray.wasHitVertical ? 255 : 180;

        // render a rectangle with the calculated wall height
        fill("rgba(" + color + "," + color + "," + color + "," + alpha + ")");
        noStroke();
        rect(
           i * WALL_STRIP_WIDTH,
           (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
           WALL_STRIP_WIDTH,
           wallStripHeight
        );
    }
}

function getUnitVector(t) {
    // Project a point on a unit circle from a position on a vertical line of "x = 1" towards the origin
    var t2 = t*t;
    return {
        x: (1 - t2) / (1 + t2),
        y: (2 * t) / (1 + t2)
    };
}

function createMatrix() {
    return [
        [1, 0],
        [0, 1],
    ];
}

function setRotationMatrix(m, c, s) {
    // Construct a 2D rotation matrix from a 2D coordinate of a unit vector (point on a unit circle):
    m[0][0] =  c;  m[0][1] = s;
    m[1][0] = -s;  m[1][1] = c;
}

function getRotationMatrixFromDirection(v) {
    var m = createMatrix();
    setRotationMatrix(m, v.x, v.y);
    return m;
}

function getRotationMatrix(t) {
    return getRotationMatrixFromDirection(getUnitVector(t));
}

function multiplyVectorByMatrix(m, v) {
    var x = v.x;
    var y = v.y;
    v.x = m[0][0]*x + m[1][0]*y;
    v.y = m[0][1]*x + m[1][1]*y;
}

function rotateVectorByAmount(v, t) {
    // Rotate the orientation vector by a 2D rotation matrix representing the rotation by the given amount:
    multiplyVectorByMatrix(getRotationMatrix(t), v);
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
    clear("#111");
    update();

    render3DProjectedWalls();
    
    grid.render();
    for (ray of rays) {
        ray.render();
    }
    player.render();

}
