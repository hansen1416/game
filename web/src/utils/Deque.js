export default class Deque {
	/**
	 *
	 * @param {number} max_size
	 */
	constructor(max_size = 0) {
		this.max_size = max_size;
		this.items = {};
		this.frontIndex = 0;
		this.backIndex = -1;
	}

	// Adds an item to the front of the deque
	addFront(item) {
		this.frontIndex--;
		this.items[this.frontIndex] = item;

		if (this.max_size > 0 && this.size() > this.max_size) {
			this.removeBack();
		}
	}

	// Adds an item to the back of the deque
	addBack(item) {
		this.backIndex++;
		this.items[this.backIndex] = item;

		if (this.max_size > 0 && this.size() > this.max_size) {
			this.removeFront();
		}
	}

	// Removes and returns the front item of the deque
	removeFront() {
		if (this.isEmpty()) {
			return undefined;
		}

		const item = this.items[this.frontIndex];
		delete this.items[this.frontIndex];
		this.frontIndex++;
		return item;
	}

	// Removes and returns the back item of the deque
	removeBack() {
		if (this.isEmpty()) {
			return undefined;
		}

		const item = this.items[this.backIndex];
		delete this.items[this.backIndex];
		this.backIndex--;
		return item;
	}

	// Returns the front item of the deque without removing it
	peekFront() {
		if (this.isEmpty()) {
			return undefined;
		}

		return this.items[this.frontIndex];
	}

	// Returns the back item of the deque without removing it
	peekBack() {
		if (this.isEmpty()) {
			return undefined;
		}

		return this.items[this.backIndex];
	}

	peekIndex(idx) {
		if (this.isEmpty()) {
			return undefined;
		}

		return this.items[idx];
	}

	// Returns true if the deque is empty, false otherwise
	isEmpty() {
		return this.frontIndex > this.backIndex;
	}

	// Returns the number of items in the deque
	size() {
		return this.backIndex - this.frontIndex + 1;
	}

	toArray() {
		const res = [];

		for (let i = this.frontIndex; i <= this.backIndex; i++) {
			res.push(this.peekIndex(i));
		}

		return res;
	}

	clear() {
		this.items = {};
		this.frontIndex = 0;
		this.backIndex = -1;
	}
}

// const deque = new Deque(5);

// deque.addFront(1); // 1
// deque.addFront(2); // 2 1
// deque.addBack(3); // 2 1 3
// deque.addBack(4); // 2 1 3 4
// deque.addFront(5); // 5 2 1 3 4
// deque.addFront(6); // 6 5 2 1 3
// deque.addBack(7); // 5 2 1 3 7
// deque.addBack(8); // 2 1 3 7 8

// console.log(deque);
// console.log(deque.toArray());

// // // console.log(deque.peekFront()); // 2
// // // console.log(deque.peekBack()); // 4

// deque.removeFront();

// console.log(deque);
// console.log(deque.toArray());

// // // console.log(deque.peekFront()); // 1
// // // console.log(deque.peekBack()); // 3
