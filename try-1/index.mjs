const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const viewCanvas = document.getElementById('viewCanvas');
const viewCtx = viewCanvas.getContext('2d');

// Размеры карты
const mapWidth = 20; // Количество ячеек по горизонтали
const mapHeight = 20; // Количество ячеек по вертикали

// Расчет размера одной ячейки
const tileSize = canvas.width / mapWidth;

let player = { x: 400, y: 300, angle: 0 };
let keys = { left: false, right: false, up: false, down: false };

// Создаем карту
const map = [
    "********************",
    "*------------------*",
    "*------------------*",
    "*---------**-------*",
    "*------------***---*",
    "*------------------*",
    "*------****--------*",
    "*------------------*",
    "*******-----***----*",
    "********************"
];

// Вычисляем размер одной ячейки
const tileSizeX = canvas.width / map[0].length;
const tileSizeY = canvas.height / map.length;

function drawMap() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === '*') {
                ctx.fillStyle = 'gray';
                ctx.fillRect(x * tileSizeX, y * tileSizeY, tileSizeX, tileSizeY);
            }
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + 20 * Math.cos(player.angle), player.y + 20 * Math.sin(player.angle));
    ctx.stroke();
}
function updatePlayer() {
    if (keys.left) player.angle -= 0.02;
    if (keys.right) player.angle += 0.02;

    const speed = 2;
    let newX = player.x;
    let newY = player.y;

    if (keys.up) {
        newX += speed * Math.cos(player.angle);
        newY += speed * Math.sin(player.angle);
    }
    if (keys.down) {
        newX -= speed * Math.cos(player.angle);
        newY -= speed * Math.sin(player.angle);
    }

    // Расчет индекса тайла на карте
    let mapX = Math.floor(newX / tileSizeX);
    let mapY = Math.floor(newY / tileSizeY);

    // Проверяем, не сталкивается ли игрок со стеной
    if (map[mapY] && map[mapY][mapX] !== '*') {
        player.x = newX;
        player.y = newY;
    }
}


function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMap();
    updatePlayer();
    drawPlayer();

    let rays = getRays(player);
    drawRays(rays);

    // Очистка и отрисовка на втором канвасе
    viewCtx.clearRect(0, 0, viewCanvas.width, viewCanvas.height);
    draw3DPerspective(rays);

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
});

window.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});

// Параметры поля зрения и количества лучей
const pov = 60; // Поле зрения в градусах
const numRays = 60; // Количество лучей

// Функция для инициализации лучей
function getRays(player) {
    let rays = [];
    let startAngle = player.angle - (pov / 2) * (Math.PI / 180); // Начальный угол

    for (let i = 0; i < numRays; i++) {
        let rayAngle = startAngle + (i * (pov / numRays)) * (Math.PI / 180);
        rays.push({ angle: rayAngle, x: player.x, y: player.y });
    }

    return rays;
}

function castRay(ray) {
    let distance = 0; // Начальное расстояние
    let hitWall = false; // Столкновение со стеной

    while (!hitWall && distance < 500) { // Ограничение дальности луча
        distance += 1; // Увеличиваем дистанцию

        // Вычисляем текущие координаты луча
        let testX = ray.x + Math.cos(ray.angle) * distance;
        let testY = ray.y + Math.sin(ray.angle) * distance;

        // Проверяем столкновение со стеной
        let mapX = Math.floor(testX / tileSizeX);
        let mapY = Math.floor(testY / tileSizeY);

        if (map[mapY] && map[mapY][mapX] === '*') {
            hitWall = true;
        }
    }

    return distance;
}

function drawRays(rays) {
    for (let ray of rays) {
        let distance = castRay(ray);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Светлые лучи
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            player.x + Math.cos(ray.angle) * distance,
            player.y + Math.sin(ray.angle) * distance
        );
        ctx.stroke();
    }
}


// Рисуем перспективу в отдельном канвасе
function draw3DPerspective(rays) {
    const screenWidth = viewCanvas.width;
    const screenHeight = viewCanvas.height;
    const maxDistance = 500; // Максимальная видимая дистанция
    const rayWidth = screenWidth / rays.length; // Ширина каждого "столбца"
    const maxBrightness = 180; // Максимальная яркость для ближних стен

    for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];
        let distance = castRay(ray);

        // Коррекция "рыбьего глаза"
        const correctDistance = distance * Math.cos(ray.angle - player.angle);

        // Высчитываем высоту столбца
        const columnHeight = (1 / correctDistance) * screenHeight * 277;

        // Определяем яркость цвета стены на основе дистанции
        let brightness = Math.min(maxBrightness, 255 - (correctDistance / maxDistance) * 255);
        const color = `rgb(${brightness}, ${brightness}, ${brightness})`;

        // Рисуем столбец
        viewCtx.fillStyle = color;
        viewCtx.fillRect(
            i * rayWidth, // X координата столбца
            (screenHeight - columnHeight) / 2, // Y координата столбца
            rayWidth, // Ширина столбца
            columnHeight // Высота столбца
        );
    }
}




gameLoop();
