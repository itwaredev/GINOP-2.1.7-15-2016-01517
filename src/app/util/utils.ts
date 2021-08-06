import { Settings } from '../settings/settings';
import { MatSidenavContainer, MatTabGroup } from '@angular/material';

export function shallowMerge(to: any, from: any) {
  Object.keys(from).forEach(key => {
    to[key] = from[key];
  });
}

export function download(dataurl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataurl;
  a.setAttribute('download', filename);
  const b = document.createEvent('MouseEvents');
  b.initEvent('click', false, true);
  a.dispatchEvent(b);
  return false;
}

export function unAccent(s: string): string {
  return s == null || s === '' ? s : s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function hash(s: string): number {
  let hashCode = 0, chr;
  if (s.length) {
    for (let i = 0; i < s.length; i++) {
      chr   = s.charCodeAt(i);
      hashCode  = ((hashCode << 5) - hashCode) + chr; // tslint:disable-line:no-bitwise
      hashCode |= 0; // tslint:disable-line:no-bitwise // Convert to 32bit integer
    }
  }
  return hashCode;
}

export function range(from: number, to: number): Array<number> {
  let n = 1;
  let fn: (i: number) => number;
  if (from <= to) {
    n += to - from;
    fn = i => from + i;
  } else {
    n += from - to;
    fn = i => from - i;
  }
  const arr = new Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = fn(i);
  }
  return arr;
}

export function offsetBounds(bounds: any): { east: number, west: number, north: number, south: number} {
  let baseBounds = bounds ? {
    east: bounds.getNorthEast().lng(),
    north: bounds.getNorthEast().lat(),
    west: bounds.getSouthWest().lng(),
    south: bounds.getSouthWest().lat()
  } : { east: null, north: null, west: null, south: null };

  const offsetLng = Math.abs(baseBounds.east - baseBounds.west) / 5;
  const offsetLat = Math.abs(baseBounds.north - baseBounds.south) / 5;

  baseBounds = {
    east: baseBounds.east - offsetLng,
    north: baseBounds.north - offsetLat,
    west: baseBounds.west + offsetLng,
    south: baseBounds.south + offsetLat
  };

  return baseBounds;
}

declare global {
  interface Array<T> {
    flatten(result: Array<T>): this;
    include(item: T | Array<T>): this;
    fillIfEmpty(item: T | Array<T>): this;
    pushIfNotNull(item: T | Array<T>): this;
  }

  interface Window {
    onpushstate(state: any, title: string, url?: string): void;
  }

  interface History {
    protoPushState(state: any, title: string, url?: string): void;
  }

  interface Math {
    ceilDiv(value: number, to: number): number;
    floorDiv(value: number, to: number): number;
    roundDiv(value: number, to: number): number;
    percent(value: number, base: number): number;
  }

  interface Date {
    toTimezone(zone: string): Date;
    addYears(years: number): Date;
    addMonths(months: number): Date;
    addDates(dates: number): Date;
    addHours(hours: number): Date;
    addMinutes(minutes: number): Date;
    addSeconds(seconds: number): Date;
    addMilliseconds(milliseconds: number): Date;
    toStartOfDay(): Date;
  }

  interface Number {
    precision(checkUntil?: number): number;
    toFixedPrecision(checkUntil?: number): number;
  }
}
Array.prototype.flatten = function (resultParam?: any[]) {
  const result = resultParam || [];
  for (let i = 0; i < this.length; i++) {
    const value = this[i];
    if (Array.isArray(value)) {
      value.flatten(result);
    } else {
      result.push(value);
    }
  }
  return result;
};
Array.prototype.include = function (item: any) {
  if (Array.isArray(item)) {
    item.forEach(el => this.include(el));
  } else {
    for (let i = 0; i < this.length; i++) {
      if (this[i] === item) {
        return this;
      }
    }
    this.push(item);
    return this;
  }
};
Array.prototype.fillIfEmpty = function (item: any) {
  if (!this.length) {
    if (Array.isArray(item)) {
      item.forEach(el => this.push(el));
    } else {
      this.push(item);
    }
  }
  return this;
};

Array.prototype.pushIfNotNull = function (item: any) {
  if (item != null) {
    if (Array.isArray(item)) {
      item.forEach(el => this.push(el));
    } else {
      this.push(item);
    }
  }
  return this;
};

History.prototype.protoPushState = History.prototype.pushState;
History.prototype.pushState = (data: any, title: string, url?: string) => {
  if (typeof window.onpushstate === 'function') {
    window.onpushstate(data, title, url);
  }
  return history.protoPushState(data, title, url);
};

Math.ceilDiv = (value: number, to: number) => {
  if (!to) {
    return value;
  }
  return Math.ceil(value / to) * to;
};
Math.floorDiv = (value: number, to: number) => {
  if (!to) {
    return value;
  }
  return Math.floor(value / to) * to;
};
Math.roundDiv = (value: number, to: number) => {
  if (!to) {
    return value;
  }
  return Math.round(value / to) * to;
};
Math.percent = (value: number, base: number) => {
  if (value === base) {
    return 100;
  }
  if (!base) {
    return Infinity;
  }
  return value / base * 100;
};

Date.prototype.toTimezone = function(zone: string): Date {
  return new Date(this.toLocaleString('en-US', {timeZone: zone}));
};
Date.prototype.addYears = function(years: number): Date {
  this.setFullYear(this.getFullYear() + years);
  return this;
};
Date.prototype.addMonths = function(months: number): Date {
  this.setMonth(this.getMonth() + months);
  return this;
};
Date.prototype.addDates = function(dates: number): Date {
  this.setDate(this.getDate() + dates);
  return this;
};
Date.prototype.addHours = function(hours: number): Date {
  this.setHours(this.getHours() + hours);
  return this;
};
Date.prototype.addMinutes = function(minutes: number): Date {
  this.setMinutes(this.getMinutes() + minutes);
  return this;
};
Date.prototype.addSeconds = function(seconds: number): Date {
  this.setSeconds(this.getSeconds() + seconds);
  return this;
};
Date.prototype.addMilliseconds = function(milliseconds: number): Date {
  this.setMilliseconds(this.getMilliseconds() + milliseconds);
  return this;
};
Date.prototype.toStartOfDay = function(): Date {
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
  this.setMilliseconds(0);
  return this;
};

Number.prototype.precision = function(checkUntil: number = 2): number {
  return (this.toString().split('.')[1] || '').split('')
    .reduce((val: number, str: string, idx: number) => idx < checkUntil || str !== '0' ? val + 1 : val, 0);
};
Number.prototype.toFixedPrecision = function(checkUntil?: number): number {
  return this.toFixed(this.precision(checkUntil));
};

function touch(callback: () => void, tapping?: boolean): void {
  if (this.longTimer) {
    clearTimeout(this.longTimer);
    this.longTimer = null;
  }
  if (tapping) {
    this.longTimer = setTimeout(callback, Settings.LONG_TOUCH_DURATION);
  }
}

declare let Hammer: any;
declare const propagating: any;
export function longTouch(el: HTMLElement, callback: () => void, off?: boolean): void {
  if (!el) {
    return;
  }
  if (off) {
    el.ontouchend = el.onmouseup = el.ontouchstart = el.onmousedown = undefined;
    Hammer.on(el, 'pan pinch', undefined);
  } else {
    if (el.ontouchend != null) {
      console.warn('Element already has touch event bindings, skipping.');
      return;
    }
    const hammer = new Hammer(el);
    hammer.get('pinch').set({ enable: true });
    const self = {};
    el.ontouchend = el.onmouseup = touch.bind(self, callback, false);
    el.ontouchstart = el.onmousedown = touch.bind(self, callback, true);
    hammer.on('pan pinch', touch.bind(self, callback, undefined));
  }
}
export function disableEvent(el: HTMLElement, event: string): void {
  if (!el) {
    return;
  }
  const hammer = propagating(new Hammer(el));
  hammer.on(event, (e: any) => {
    e.stopPropagation();
  });
}

MatSidenavContainer.prototype['oldNavContainerInit'] = MatSidenavContainer.prototype.ngAfterContentInit;
MatSidenavContainer.prototype.ngAfterContentInit = function(): void {
  this._swipeControls = [];
  this._drawers._results.forEach(drawer => {
    const controlPair = {open: null, close: null};
    this._swipeControls.push(controlPair);
    const hammer = propagating(new Hammer(this._element.nativeElement));
    controlPair.open = (e: any) => {
      const x = e.center.x - e.deltaX, maxX = this._element.nativeElement.clientWidth;
      if (!drawer.disabled && (drawer.position === 'end' && x >= maxX - 10 || x <= 10)) {
        e.stopPropagation();
        setTimeout(() => {
          this.open();
          this._changeDetectorRef.markForCheck();
        });
      }
    };
    hammer.on(drawer.position === 'end' ? 'swipeleft' : 'swiperight', controlPair.open);
    const drawerHammer = propagating(new Hammer(drawer._elementRef.nativeElement));
    controlPair.close = (e: any) => {
      e.stopPropagation();
      setTimeout(() => {
        this.close();
        this._changeDetectorRef.markForCheck();
      });
    };
    drawerHammer.on(drawer.position === 'end' ? 'swiperight' : 'swipeleft', controlPair.close
    );
  });
  this.oldNavContainerInit();
};
MatSidenavContainer.prototype['oldNavContainerDestroy'] = MatSidenavContainer.prototype.ngOnDestroy;
MatSidenavContainer.prototype.ngOnDestroy = function(): void {
  this._drawers._results.forEach((drawer, index) => {
    Hammer.off(this._element.nativeElement, drawer.position === 'end' ? 'swipeleft' : 'swiperight',
      this._swipeControls[index].open);
    Hammer.off(drawer._elementRef.nativeElement, drawer.position === 'end' ? 'swiperight' : 'swipeleft',
      this._swipeControls[index].close);
  });
  this.oldNavContainerDestroy();
};

MatTabGroup.prototype['oldGroupInit'] = MatTabGroup.prototype.ngAfterContentInit;
MatTabGroup.prototype.ngAfterContentInit = function(): void {
  this._swipeControls = {prev: null, next: null};
  const hammer = propagating(new Hammer(this._elementRef.nativeElement));
  this._swipeControls.next = (e: any) => {
    if (e.center.x - e.deltaX < this._elementRef.nativeElement.clientWidth - 10) {
      e.stopPropagation();
      let index = this.selectedIndex;
      while (index < this._tabs.length - 1 && this._tabs._results[++index]._disabled) {}
      if (!this._tabs._results[index]._disabled) {
        this.selectedIndex = index;
        this._changeDetectorRef.markForCheck();
      }
    }
  };
  this._swipeControls.prev = (e: any) => {
    if (e.center.x - e.deltaX > 10) {
      e.stopPropagation();
      let index = this.selectedIndex;
      while (index > 0 && this._tabs._results[--index]._disabled) {}
      if (!this._tabs._results[index]._disabled) {
        this.selectedIndex = index;
        this._changeDetectorRef.markForCheck();
      }
    }
  };
  hammer.on('swipeleft', this._swipeControls.next);
  hammer.on('swiperight', this._swipeControls.prev);
  this.oldGroupInit();
};
MatTabGroup.prototype['oldGroupDestroy'] = MatTabGroup.prototype.ngOnDestroy;
MatTabGroup.prototype.ngOnDestroy = function(): void {
  Hammer.off(this._elementRef.nativeElement, 'swipeleft', this._swipeControls.next);
  Hammer.off(this._elementRef.nativeElement, 'swiperight', this._swipeControls.prev);
  this.oldGroupDestroy();
};

function iosMouseoverHandler(e: Event): void {
  const el: HTMLElement = e.target as HTMLElement;
  setTimeout(() => {
    el.focus();
    el.click();
  }, 200);
}

export function mouseoverHandler(el: HTMLElement, off?: boolean): void {
  if (off) {
    el.onmouseover = null;
  } else {
    if (el.onmouseover != null) {
      console.warn('Element already has mouseover event bindings, skipping.');
      return;
    }
    el.onmouseover = iosMouseoverHandler.bind(this);
  }
}

export function loadScript(src: string, id: string, async: boolean = false): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    let script: HTMLScriptElement = document.head.querySelector(`#${id}`);
    if (!script) {
      // Create script element and set attributes
      script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = async;
      script.src = src;
      script.id = id;

      // Append the script to the DOM
      document.head.appendChild(script);

      // Resolve the promise once the script is loaded
      script.addEventListener('load', () => {
        resolve(script);
      });

      // Catch any errors while loading the script
      script.addEventListener('error', () => {
        reject(new Error(`${script.src} failed to load.`));
      });
    } else {
      resolve(script);
    }
  });
}

export function loadScripts(scripts: {src: string, id: string, async?: boolean}[]): Promise<HTMLScriptElement[]> {
  return Promise.all(scripts.map(script => loadScript(script.src, script.id)));
}
