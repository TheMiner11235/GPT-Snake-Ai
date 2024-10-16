const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let lastTime = 0;
let snakeSpeed = 15; // Adjust this to control game speed
let timeSinceLastMove = 0;

// Snake and Apple Configuration
const box = 20; // Size of each snake segment
let direction = "RIGHT"; // Initial snake direction
let snake = [{ x: 200, y: 200 }]; // Snake initial position

// Apple configuration
let apple = { 
    x: Math.floor(Math.random() * (canvas.width / box)) * box, 
    y: Math.floor(Math.random() * (canvas.height / box)) * box 
};

// A* node class
class Node {
    constructor(x, y, g, h) {
        this.x = x;
        this.y = y;
        this.g = g; // Cost from the start node
        this.h = h; // Heuristic distance to the apple
        this.f = g + h; // Total cost
        this.parent = null; // Pointer to the parent node
    }
}

// Manhattan distance heuristic
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Check if two nodes are equal
function nodesAreEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}

// Get neighbors for the current node
function getNeighbors(node) {
    const neighbors = [];

    const directions = [
        { x: -box, y: 0 }, // Left
        { x: box, y: 0 },  // Right
        { x: 0, y: -box }, // Up
        { x: 0, y: box },  // Down
    ];

    directions.forEach((dir) => {
        const newX = node.x + dir.x;
        const newY = node.y + dir.y;

        // Ensure the new position is within the grid and doesn't hit the snake
        if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height && !snakeCollision(newX, newY)) {
            neighbors.push(new Node(newX, newY, 0, 0));
        }
    });

    return neighbors;
}

// Check if the position collides with the snake body
function snakeCollision(x, y) {
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
            return true;
        }
    }
    return false;
}

// A* Pathfinding function
function findPath() {
    const start = new Node(snake[0].x, snake[0].y, 0, heuristic(snake[0], apple));
    const end = new Node(apple.x, apple.y, 0, 0);
    const openList = [start]; // Nodes to be evaluated
    const closedList = []; // Nodes already evaluated

    while (openList.length > 0) {
        // Get node with the lowest f score
        let lowestIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < openList[lowestIndex].f) {
                lowestIndex = i;
            }
        }

        const currentNode = openList[lowestIndex];

        // If we reached the goal, backtrack to find the path
        if (nodesAreEqual(currentNode, end)) {
            const path = [];
            let temp = currentNode;
            while (temp) {
                path.push(temp);
                temp = temp.parent;
            }
            return path.reverse(); // Return path from start to end
        }

        // Move current node from open to closed list
        openList.splice(lowestIndex, 1);
        closedList.push(currentNode);

        // Get neighbors and evaluate them
        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (closedList.some((closedNode) => nodesAreEqual(closedNode, neighbor))) {
                continue; // Skip if already evaluated
            }

            // Calculate the new g and h values
            const tentativeG = currentNode.g + 1;
            const existingOpenNode = openList.find((openNode) => nodesAreEqual(openNode, neighbor));

            if (!existingOpenNode || tentativeG < neighbor.g) {
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = currentNode;

                // If it's not in the open list, add it
                if (!existingOpenNode) {
                    openList.push(neighbor);
                }
            }
        }
    }

    // If we get here, no path was found (fall back to basic movement)
    return null;
}

// Update snake position based on direction
function updateSnakePosition() {
    const path = findPath();

    if (path && path.length > 1) {
        const nextNode = path[1]; // Get the next move from the path

        // Set direction based on the next move
        if (nextNode.x < snake[0].x) direction = "LEFT";
        if (nextNode.x > snake[0].x) direction = "RIGHT";
        if (nextNode.y < snake[0].y) direction = "UP";
        if (nextNode.y > snake[0].y) direction = "DOWN";
    } else {
        // No valid path, fallback to current direction
    }

    const head = { x: snake[0].x, y: snake[0].y };

    // Update the head position based on the direction
    if (direction === "LEFT") head.x -= box;
    if (direction === "UP") head.y -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "DOWN") head.y += box;

    // Boundary checks (wrap around)
    if (head.x < 0) head.x = canvas.width - box;
    if (head.y < 0) head.y = canvas.height - box;
    if (head.x >= canvas.width) head.x = 0;
    if (head.y >= canvas.height) head.y = 0;

    // Check if the snake eats the apple
    if (head.x === apple.x && head.y === apple.y) {
        apple = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box
        };
    } else {
        snake.pop(); // Remove the tail (keeps the snake the same size)
    }

    snake.unshift(head); // Add new head
}

// Render the snake and the apple
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    for (let i = 0; i < snake.length; i++) {
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "red";
    ctx.fillRect(apple.x, apple.y, box, box);
}

// Main game loop
function gameLoop(currentTime) {
    timeSinceLastMove += (currentTime - lastTime);
    lastTime = currentTime;

    if (timeSinceLastMove >= 1000 / snakeSpeed) {
        updateSnakePosition();
        timeSinceLastMove = 0;
    }

    renderGame();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
