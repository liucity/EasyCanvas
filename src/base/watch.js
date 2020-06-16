import tool from './tool.js'

let { isObject, isFunction, isArray } = tool;

export default function Watch(obj, prop, onChange) {
	if (!isObject(obj)) return console.error('Expire Object, got [' + typeof obj + ']');
	if (isFunction(prop)) {
		onChange = prop;
		prop = undefined;
	}
	if (!isFunction(onChange)) {
		return console.warn('please set a listener!')
	}

	let keys = prop
		?
		isArray(prop) ? prop : [prop]
		:
		Object.keys(obj);

	let properties = {};
	keys.forEach((key) => {
		let _val = obj[key];
		properties[key] = {
			enumerable: true,
			configurable: true,
			get: () => {
				return _val;
			},
			set: (val) => {
				let _old = _val;
				_val = val;
				onChange(key, _val, _old)
			}
		};
	});

	Object.defineProperties(obj, properties);
}