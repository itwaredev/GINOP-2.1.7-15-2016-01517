export function LoopBlock({whiteList = [], blackList = [], warn = false} = {}) {
  return function(constructor: Function) {
    if (!whiteList || !whiteList.length) {
      whiteList = Object.keys(constructor.prototype).filter(key => typeof constructor.prototype[key] === 'function');
    }

    for (const func of whiteList) {
      let name = func, limit = 1;
      if (typeof name !== 'string') {
        name = func['name'];
        limit = func['limit'] || limit;
      }
      if (blackList.includes(name)) {
        continue;
      }
      const original = constructor.prototype[name.toString()];

      if (typeof original !== 'function') {
        throw new Error(
          `${constructor.name} is using @SafeCall but does not implement ${name}`
        );
      }

      let safeCalls = 0;
      constructor.prototype[name.toString()] = function(...args) {
        if (safeCalls < limit) {
          safeCalls++;
          const ret = original.apply(this, args);
          safeCalls--;
          return ret;
        } else if (warn) {
          console.warn(`${name} tried to run more than ${limit} times in ${constructor.name}`);
        }
      };
    }
  };
}
