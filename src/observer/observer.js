import { isFunction } from '../util/util';

export default class Observer {
  constructor(target){
    this._target = target;
    this._watchers = new Map();
    
    this._init();
  }

  _init(){
    const { _target } = this;
    const properties = {};
    
    Object.keys(_target).forEach(key => {
      let _val = _target[key];
      
      if(!isFunction(_val)) {
        properties[key] = {
          enumerable: true,
          configurable: true,
          get: () => {
            return _val;
          },
          set: (val) => {
            let _old = _val;
            _val = val;
            if(_val !== _old) this._fire(key, _val, _old);
          }
        };
      }
    });
	
		Object.defineProperties(_target, properties);
  }

  find(prop){
    return this._watchers.get(prop);
  }

  _fire(prop){
    const { _target } = this; 

    const watcher = this.find(prop);
    if(watcher) {
      watcher.forEach(w => w.apply(_target, arguments));
    }
  }

  on(prop, ...args){
    let watcher = this.find(prop);
    if(!watcher){
      watcher = [];
      this._watchers.set(prop, watcher);
    }

    watcher.push(...args);
  }

  off(prop, ...args) {
    const watcher = this.find(prop);

    if(watcher){
      if(args.length){
        watcher.forEach(w => {
          const index = w.indexOf(arg);
          if(index > -1){
            w.splice(index, 1);
          }
        });
      } else {
        watcher.length = 0;
      }
    }
  }
}