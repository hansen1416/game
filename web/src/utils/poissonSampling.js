/**
 *
 * This function takes in four parameters: the width and height of the sampling area,
 * the minimum distance between points, and the maximum number of tries to generate points.
 * It returns an array of points that are randomly distributed throughout the sampling area,
 * with a minimum distance of minDist between each point.
 *
 * The function works by creating a grid of cells with a size of minDist / Math.sqrt(2),
 * and randomly selecting a starting point.
 * It then adds this point to the grid and active list, and begins generating new points around it.
 * It generates 30 new points around the current point,
 * and checks if each point is valid by ensuring that it is within the sampling area,
 * and that it is at least minDist away from all other points in its 5x5 grid cell.
 * If a valid point is found, it is added to the grid and active list, and the process continues.
 * If no valid point is found, the current point is removed from the active list.
 *
 * The function continues generating points
 * until either the active list is empty or the maximum number of tries has been reached.
 * Once all points have been generated, the function returns the array of points.
 *
 * @param {*} width
 * @param {*} height
 * @param {*} minDist
 * @param {*} maxTries
 * @returns
 */
export function poissonDiskSampling(width, height, minDist, maxTries) {
	const cellSize = minDist / Math.sqrt(2);
	const gridWidth = Math.ceil(width / cellSize);
	const gridHeight = Math.ceil(height / cellSize);
	const grid = new Array(gridWidth * gridHeight).fill(-1);
	const points = [];
	const activeList = [];

	function addPoint(point) {
		const index =
			Math.floor(point.x / cellSize) +
			Math.floor(point.y / cellSize) * gridWidth;
		grid[index] = points.length;
		points.push(point);
		activeList.push(point);
	}

	function getDistance(pointA, pointB) {
		const dx = pointA.x - pointB.x;
		const dy = pointA.y - pointB.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getRandomPointAround(point) {
		const r1 = Math.random();
		const r2 = Math.random();
		const radius = minDist * (r1 + 1);
		const angle = 2 * Math.PI * r2;
		const x = point.x + radius * Math.cos(angle);
		const y = point.y + radius * Math.sin(angle);
		return { x, y };
	}

	const initialPoint = {
		x: Math.random() * width,
		y: Math.random() * height,
	};
	addPoint(initialPoint);

	while (activeList.length > 0 && points.length < maxTries) {
		const randomIndex = Math.floor(Math.random() * activeList.length);
		const point = activeList[randomIndex];

		let found = false;
		for (let i = 0; i < 30; i++) {
			const newPoint = getRandomPointAround(point);
			if (
				newPoint.x >= 0 &&
				newPoint.x < width &&
				newPoint.y >= 0 &&
				newPoint.y < height
			) {
				const index =
					Math.floor(newPoint.x / cellSize) +
					Math.floor(newPoint.y / cellSize) * gridWidth;
				let isValid = true;
				for (let j = -2; j <= 2; j++) {
					for (let k = -2; k <= 2; k++) {
						const neighborIndex = index + j + k * gridWidth;
						if (
							neighborIndex >= 0 &&
							neighborIndex < grid.length &&
							grid[neighborIndex] !== -1
						) {
							const neighbor = points[grid[neighborIndex]];
							const distance = getDistance(newPoint, neighbor);
							if (distance < minDist) {
								isValid = false;
								break;
							}
						}
					}
					if (!isValid) {
						break;
					}
				}
				if (isValid) {
					found = true;
					addPoint(newPoint);
					break;
				}
			}
		}

		if (!found) {
			activeList.splice(randomIndex, 1);
		}
	}

	return points;
}
