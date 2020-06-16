import Guard from './frameGuard.js';
import Animations from '../animation/animationMethods';
import { obj, warn } from '../util/util';

const { set } = obj;

export default class Animation {
  constructor(target) {
		this._map = new Map();
		this._target = target;
  }
  
  set({ property, oldVal = 0, newVal, animationType = 'linear', duration }) {
		if (property == undefined || newVal == undefined || duration == undefined || !(animationType in Animations)) return warn('animation init failed', JSON.stringify(arguments));
		const animate = Animations[animationType](oldVal, newVal, duration);
		const defs = { property, animate, duration, newVal, isEnd: false };
		const { _map, _target } = this;

		this.remove(property);

		Guard.request((t) => {
			if (defs.isEnd) return false;

			let { property, animate, duration, newVal, isEnd } = defs;
			let _val = t > duration ? newVal : animate(t);
			set(_target, property, _val);
			_target.trigger('change', property, _val);

			if (t > duration) isEnd = true;
			if (isEnd) {
				defs.isEnd = true;
				_map.delete(property);
				_target.trigger('animateEnd', property, _val);
				return false;
			}
		})
  }

  remove(property){
		const { _map } = this;

		if(_map.has(property)){
			_map.get(property).isEnd = true;
			_map.delete(property);
		}
	}
	
	static animate(target, options){
    let { _animation } = target;
    if(!_animation){
      _animation = target._animation = new Animation(target);
    }
    _animation.set(options);
	}
}