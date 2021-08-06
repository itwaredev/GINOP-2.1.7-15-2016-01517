import { unAccent } from './utils';

export class StringNumberComparator {
  constructor() { }

  compare(a, b, propertyName?: string, direction?: string,
    caseSensitive?: boolean, removeAccents?: boolean,
    skipInternalNegations?: boolean): number {
    return (!direction || direction === 'asc' ?
      this.innerCompare(propertyName ? a[propertyName] : a, propertyName ? b[propertyName] : b,
        caseSensitive, removeAccents,
        skipInternalNegations) :
      -this.innerCompare(propertyName ? a[propertyName] : a, propertyName ? b[propertyName] : b,
        caseSensitive, removeAccents,
        skipInternalNegations));
  }

  innerCompare(a: string, b: string, caseSensitive?: boolean, removeAccents?: boolean, skipInternalNegations?: boolean): number {
    if (a === b) {
      return 0;
    }
    if (a == null) {
      return -1;
    }
    if (b == null) {
      return 1;
    }

    let localA = (caseSensitive) ? a : a.toLowerCase(), localB = (caseSensitive) ? b : b.toLowerCase();
    if (removeAccents) {
      localA = (removeAccents ? unAccent(localA) : localA);
      localB = (removeAccents ? unAccent(localB) : localB);
    }
    const maxLen = Math.max(localA.length, localB.length);

    let aNum, bNum, semiResult = null, negate = 1;
    for (let i = 0; i < maxLen; i++) {
      if (localA.length <= i) {
        return (localB[i].match(/\d/) && bNum) ? (-1 * negate) : semiResult || -1;
      }
      if (localB.length <= i) {
        return (localA[i].match(/\d/) && aNum) ? (1 * negate) : semiResult || 1;
      }

      aNum = localA[i].match(/\d/);
      bNum = localB[i].match(/\d/);

      if (aNum && bNum) {
        if (!semiResult) {
          if (localA[i] < localB[i]) {
            semiResult = -1 * negate;
          } else if (localB[i] < localA[i]) {
            semiResult = 1 * negate;
          }
        }
      } else if ((aNum || bNum) && semiResult) {
        if (bNum) {
          return -1;
        }
        if (aNum) {
          return 1;
        }
      } else if (semiResult) {
        return semiResult;
      } else {
        if (localA[i] < localB[i]) {
          return -1;
        }
        if (localB[i] < localA[i]) {
          return 1;
        }
        semiResult = null;
        negate = localA[i] === '-' && (!skipInternalNegations || i === 0) ? -1 : 1;
      }
    }
    return semiResult || 0;
  }
}
