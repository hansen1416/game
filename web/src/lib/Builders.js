//Parent Class
class BaseBuilder {
	init() {
		Object.keys(this).forEach((key) => {
			const withName = `with${key
				.substring(0, 1)
				.toUpperCase()}${key.substring(1)}`;
			this[withName] = (value) => {
				this[key] = value;
				return this;
			};
		});
	}

	build() {
		const keysNoWithers = Object.keys(this).filter(
			(key) => typeof this[key] !== "function"
		);

		return keysNoWithers.reduce((returnValue, key) => {
			return {
				...returnValue,
				[key]: this[key],
			};
		}, {});
	}
}

//Subclass 1: BookBuilder
class BookBuilder extends BaseBuilder {
	constructor() {
		super();

		this.name = "";
		this.author = "";
		this.price = 0;
		this.category = "";

		super.init();
	}
}

//Subclass 2
class printHouseBuilder extends BaseBuilder {
	constructor() {
		super();

		this.name = "";
		this.location = "";
		this.quality = "";

		super.init();
	}
}

const book = new BookBuilder()
	.withName("The Reckonings")
	.withAuthor("Lacy Johnson")
	.withPrice(31)
	.withCategory("Literature")
	.build();

const printHouse = new printHouseBuilder()
	.withName("Printers")
	.withLocation("New York")
	.withQuality("A")
	.build();
