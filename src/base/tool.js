let arr = [];
let hasOwn = arr.hasOwnProperty;
let tostring = Object.prototype.toString;
let type = function (obj) {
	switch (tostring.call(obj)) {
		case '[object Object]': return 'object';
		case '[object Number]': return 'number';
		case '[object String]': return 'string';
		case '[object Function]': return 'function';
		case '[object Array]': return 'array';
		case '[object Arguments]': return 'arguments';
		case '[object Boolean]': return 'bool';
		case '[object Null]': return 'null';
		case '[object Undefined]': return 'undefined';
	}
}

let tool = {
	version: '0.0.1',
	type: type,
	isObject(obj) {
		return type(obj) === 'object';
	},
	isArray(obj) {
		return type(obj) === 'array';
	},
	isFunction(obj) {
		return type(obj) === 'function';
	},
	isString(obj) {
		return type(obj) === 'string';
	},
	isWindow(obj) {
		return obj != null && obj === obj.window;
	},
	isPlainObject(obj) {
		if (type(obj) !== "object" || obj.nodeType || tool.isWindow(obj)) return false;
		if (obj.constructor && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return false;
		return true;
	},
	error(msg) {
		throw new Error(msg);
	},
	random(max) {
		return Math.floor(Math.random() * max)
		// return Math.round(Math.random() * max + 0.5) - 1
	},
	range(val, min, max){
		return Math.max(Math.min(val, max), min)
	},
	formatDate(time, format = 'yyyy-MM-dd'){
		let t = time instanceof Date ? time : new Date(time)
		return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
			switch (a) {
				case 'yyyy':
					return t.getFullYear() > 1970 ? (t.getFullYear() + '').padStart(2, '0') : ''
				case 'MM':
					return (t.getMonth() + 1 + '').padStart(2, '0')
				case 'mm':
					return (t.getMinutes() + '').padStart(2, '0')
				case 'dd':
					return (t.getDate() + '').padStart(2, '0')
				case 'HH':
					return (t.getHours() + '').padStart(2, '0')
				case 'ss':
					return (t.getSeconds() + '').padStart(2, '0')
			}
		})
	}
}

let { isObject, isArray, isFunction, isPlainObject } = tool

let extend = function (isDeep) {
	let target, args
	if (type(isDeep) !== 'bool') {
		[target, ...args] = arguments
		isDeep = false
	} else {
		[isDeep, target, ...args] = arguments
	}

	args.forEach((item, i) => {
		if (isObject(item)) {
			Object.keys(item).forEach(k => {
				let v = item[k]
				if (hasOwn.call(item, k) && v !== undefined) {
					if (isDeep && isObject(v) && isPlainObject(v)) {
						target[k] = extend(isDeep, target[k] || {}, v);
					} else {
						target[k] = v;
					}
				}
			})
		}
	});
	return target
}
tool.extend = extend;

tool.replacer = (function () {
	let replacer_reg = /\{\s*([^\}]*)\s*\}/g;
	let getProperty = function (obj, properties) {
		let pArr = properties.split('.'),
			len = pArr.length,
			i = 0;

		for (; obj && i < len; i++) obj = obj[pArr[i]];
		return obj;
	}

	return function (temp, datas, callback) {
		let html, v;
		if (!temp) return;
		if (!datas) return temp;
		if (!isArray(datas)) datas = [datas];
		if (!isFunction(callback)) callback = function (data, m) {
			v = getProperty(data, m);
			return v === undefined ?
				typeof data === 'string' || typeof data === 'number' ? data : ''
				:
				v;
		};
		html = [];
		datas.forEach((data, i) => {
			html.push(temp.replace(replacer_reg, function (m, k) {
				return callback(data, k);
			}));
		})
		return html.join('');
	}
})();

tool.obj = {
	get(obj, properties) {
		var pArr = properties.split('.'),
			len = pArr.length,
			i = 0

		for (; obj && i < len; i++) obj = obj[pArr[i]]
		return obj
	},
	set(obj, properties, val) {
		var pArr = properties.split('.'),
			len = pArr.length,
			i = 0

		for (; i < len - 1; i++) {
			if (!obj[pArr[i]]) obj[pArr[i]] = {}
			obj = obj[pArr[i]]
		}
		obj[pArr[len - 1]] = val
	},
	has(obj, properties) {
		var pArr = properties.split('.'),
			len = pArr.length,
			i = 0

		for (; obj && i < len - 1; i++) obj = obj[pArr[i]]
		return !!obj && hasOwn.call(obj, pArr[i])
	}
}

tool.number = (function(){
	let float2Fixed = (num) => {
		if(isNaN(num)) return NaN;
		return +num.toString().replace('.', '')
	}
	let digitLength = (num) => {
		if(isNaN(num)) return NaN;
		return (num.toString().split('.')[1] || '').length
	}
	
	let plus = (num1, num2, ...nums) => {
		if(nums.length){
				return plus(plus(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
		return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
	};
	
	let minus = (num1, num2, ...nums) => {
		if(nums.length){
				return minus(minus(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
		return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
	}
	
	let times = (num1, num2, ...nums) => {
		if(nums.length){
				return times(times(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, digitLength(num1) + digitLength(num2));
		return float2Fixed(num1) * float2Fixed(num2) / baseNum;
	}
	
	let divide = (num1, num2, ...nums) => {
		if(nums.length){
				return divide(divide(num1, num2), nums[0], ...nums.slice(1));
		}
		return times(float2Fixed(num1) / float2Fixed(num2), Math.pow(10, digitLength(num2) - digitLength(num1)));
	}
	
	let avg = (...datas) => {
		return divide(plus(...datas), datas.length);
	};
	
	let diff = (source, target) => {
		return divide(minus(target, source), source);
	}
	
	let fix = (source, length) => {
		let baseNum = Math.pow(10, length);
		return divide(Math.round(times(source, baseNum)), baseNum)
	}
	
	return {
		plus: plus,
		minus: minus,
		times: times,
		divide: divide,
		avg: avg,
		diff: diff,
		fix: fix
	}
})();


export default tool;