let instance;

export default class Api {
	constructor() {
		if (instance) {
			return instance;
		}

		instance = this;

		this.domain = import.meta.env.VITE_API_DOMAIN;
	}

	/**
	 *
	 * @param {string} route
	 */
	async get(route) {
		try {
			const response = await fetch(this.domain + route);
			const contentType = response.headers.get("content-type");
			if (!contentType || !contentType.includes("application/json")) {
				throw new TypeError("Oops, we haven't got JSON!");
			}
			return await response.json();
			// process your data further
		} catch (error) {
			console.error("Error:", error);
		}
	}

	/**
	 *
	 * @param {string} route
	 * @param {object} data
	 * @returns
	 */
	async post(route, data = {}) {
		try {
			const response = await fetch(this.domain + route, {
				method: "POST", // *GET, POST, PUT, DELETE, etc.
				mode: "cors", // no-cors, *cors, same-origin
				cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
				credentials: "same-origin", // include, *same-origin, omit
				headers: {
					"Content-Type": "application/json",
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
				redirect: "follow", // manual, *follow, error
				referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
				body: JSON.stringify(data), // body data type must match "Content-Type" header
			});
			return response.json(); // parses JSON response into native JavaScript objects
		} catch (error) {
			console.error("Error:", error);
		}
	}
}
