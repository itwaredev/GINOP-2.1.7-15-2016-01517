const unsub = (sub: any): void => {
    if (Array.isArray(sub)) {
        sub.forEach(prop => unsub(prop));
    } else if (sub) {
      if (typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      } else if (typeof sub.complete === 'function') {
        sub.complete();
      }
    }
};

export function Unsubscribe({whiteList = [], blackList = [], event = 'ngOnDestroy'} = {}) {
    return function(constructor: Function) {
        const original = constructor.prototype[event];

        if (typeof original !== 'function') {
          throw new Error(
            `${constructor.name} is using @Unsubscribe but does not implement ${event}`
          );
        }

        constructor.prototype[event] = function(...args: any[]) {
          const propNames = whiteList && whiteList.length ? whiteList : Object.keys(this);
          for (const propName of propNames) {
            if (blackList.includes(propName)) {
                continue;
            }
            unsub(this[propName]);
          }

          return original.apply(this, args);
        };
    };
}
