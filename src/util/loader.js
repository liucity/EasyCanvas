import { isFunction } from './util'

let sourceManager = {
	cache: {},
	load: function (type, source, callback) {
		let obj = this.cache[source];
		if (obj) {
			if (obj.complete) {
				if (isFunction(callback)) callback.call(obj, obj);
			} else {
				let _onload = obj.onload;
				obj.onload = () => {
					_onload();
					this.load(type, source, callback);
				}
			}
		} else {
			obj = document.createElement(type);
			obj.src = source;
			obj.onload = () => {
				return this.load(type, source, callback);
			}
			this.cache[source] = obj;
		}
		return obj;
	}
}

export default sourceManager