function randomChoice(p) {
	let rnd = Math.random();
	return p.findIndex((a) => (rnd -= a) < 0);
}

function randomChoices(p, count) {
	return Array.from(Array(count), randomChoice.bind(null, p));
}

module.exports = { randomChoices };
