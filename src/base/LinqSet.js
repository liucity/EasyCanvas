import { isFunction, isArray } from './util.js';

let concat = Array.prototype.concat;

export default function LinqSet() {
	let set = new Set()
	Object.assign(set, {
		map(callback) {
			if (!isFunction(callback)) console.error('callback is not a function')
			let arr = []
			this.forEach((value, index, set) => {
				arr.push(callback(value, index, set))
			})
			return arr
		},

		selectMany(callback) {
			let arr = this.map(callback)
			while (arr.some(isArray)) {
				arr = concat.apply([], arr)
			}

			return arr.filter(arg => arg != undefined)
		}
	})
	return set
}