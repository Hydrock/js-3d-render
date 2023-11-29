const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.style.width = window.innerWidth + 'px';
canvas.height = 300;
canvas.style.height = window.innerHeight + 'px';

const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const mapWidth = map[0].length;
const mapHeight = map.length;

let playerX = 2; // Игрок начинает в центре карты
let playerY = 2;
let playerAngle = 0; // Направление взгляда игрока
const fov = Math.PI / 3; // Поле зрения

function render() {
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x++) {
        // Для каждого столбца экрана вычисляем угол луча
        const rayAngle = playerAngle - (fov / 2) + (x / canvas.width) * fov;

        let distanceToWall = 0;
        let hitWall = false;
        let wallType = 0;

        const eyeX = Math.cos(rayAngle);
        const eyeY = Math.sin(rayAngle);

        while (!hitWall && distanceToWall < 20) {
            distanceToWall += 0.1;

            const testX = Math.floor(playerX + eyeX * distanceToWall);
            const testY = Math.floor(playerY + eyeY * distanceToWall);

            // Проверяем, не вышли ли мы за пределы карты
            if (testX < 0 || testX >= mapWidth || testY < 0 || testY >= mapHeight) {
                hitWall = true; // Предотвращаем зацикливание
                distanceToWall = 20;
            } else {
                // Проверяем, ударились ли мы в стену
                if (map[testY][testX] == 1) {
                    hitWall = true;
                }
            }

            if (hitWall) {
                // Определяем тип стены
                wallType = map[testY][testX];
                console.log('wallType:', wallType);
            }
        }

        // Выбираем цвет на основе типа стены
        let color;
        switch(wallType) {
            case 1: color = 88; break;
            case 2: color = 44; break;
            // Другие случаи для разных типов стен
            default: color = 255; // Для пустого пространства или неизвестных типов
        }

        // Вычисляем яркость в зависимости от расстояния
        const brightness = 1 - Math.min(distanceToWall / 8, 1);
        const colorValue = Math.floor(color * brightness);

        // Устанавливаем цвет стены
        // ctx.strokeStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
        ctx.strokeStyle = `rgb(${colorValue}, 34, 33)`;

        // Вычисляем высоту стены для текущего луча
        const ceiling = (canvas.height / 2.0) - (canvas.height / distanceToWall);
        const floor = canvas.height - ceiling;

        // ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x, ceiling);
        ctx.lineTo(x, floor);
        ctx.stroke();
    }

    // Отрисовка миникарты
    renderMiniMap();

    requestAnimationFrame(render);
}

document.addEventListener('keydown', function(event) {
    let newX = playerX;
    let newY = playerY;

    if (event.key === 'ArrowLeft') {
        playerAngle -= 0.1;
    } else if (event.key === 'ArrowRight') {
        playerAngle += 0.1;
    } else if (event.key === 'ArrowUp') {
        newX += Math.cos(playerAngle) * 0.5;
        newY += Math.sin(playerAngle) * 0.5;
    } else if (event.key === 'ArrowDown') {
        newX -= Math.cos(playerAngle) * 0.5;
        newY -= Math.sin(playerAngle) * 0.5;
    }

    // Проверяем, свободно ли новое местоположение
    if (isSpaceFree(newX, newY)) {
        playerX = newX;
        playerY = newY;
    }
});

function renderMiniMap() {
    const miniMapScale = 4; // Масштаб миникарты
    const miniMapPosX = canvas.width - (mapWidth * miniMapScale) - 10; // Позиция миникарты на холсте
    const miniMapPosY = 10;

    // Отрисовка карты
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            ctx.fillStyle = map[y][x] == 1 ? 'gray' : 'black';
            ctx.fillRect(miniMapPosX + x * miniMapScale, miniMapPosY + y * miniMapScale, miniMapScale, miniMapScale);
        }
    }

    // Расчет и отрисовка направления взгляда игрока
    const viewLength = 2; // Длина линии направления
    const playerViewX = playerX + Math.cos(playerAngle) * viewLength;
    const playerViewY = playerY + Math.sin(playerAngle) * viewLength;

    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(miniMapPosX + playerX * miniMapScale + (miniMapScale / 2), miniMapPosY + playerY * miniMapScale + (miniMapScale / 2));
    ctx.lineTo(miniMapPosX + playerViewX * miniMapScale, miniMapPosY + playerViewY * miniMapScale);
    ctx.stroke();

    // Отрисовка позиции игрока
    ctx.fillStyle = 'yellow';
    ctx.fillRect(miniMapPosX + playerX * miniMapScale - 2, miniMapPosY + playerY * miniMapScale - 2, miniMapScale, miniMapScale);
}

// Функция для проверки, свободна ли клетка
function isSpaceFree(x, y) {
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
        return false;
    }
    return map[Math.floor(y)][Math.floor(x)] === 0;
}


render();
