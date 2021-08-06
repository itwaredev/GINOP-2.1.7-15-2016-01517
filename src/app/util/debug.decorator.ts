export function Debug(target: any) {
  console.warn(`${target.name} is in debug mode with @Debug decorator`);
  Object.getOwnPropertyNames(target.prototype).forEach(property => {
    const oldFn = target.prototype[property];
    target.prototype[property] = function (...args) {
      console.log(`${property} called with arguments: ${args.join(', ')}`);
      return oldFn.apply(this, args);
    };
  });
  Object.defineProperty(target.prototype, 'debug', {
    value: function (arg) {
      console.log(arg);
      return arg;
    }
  });
  return target;
}
