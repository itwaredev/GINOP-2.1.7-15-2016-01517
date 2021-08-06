module.exports = function(str, values, checkUnclosed) {
    if (typeof str !== 'string' || typeof values !== 'object') {
      return str;
    }
    let outstr = []
    let start = 0;
    let possiblyUnclosed = 0;
    for (let i = -1; i < str.length;) {
        while (++i < str.length - 1 && str[i] !== '$' && str[i + 1] !== '{') {}
  
        outstr.push(str.slice(start, i + (i === str.length - 1 ? 1 : 0)));
        start = i + 2;
  
        while (++i < str.length && str[i] !== '}') { 
            if (checkUnclosed && str[i] === '$' && str[i + 1] === '{') {
                possiblyUnclosed = start - 1;
            }
        }

        if (possiblyUnclosed) {
            console.warn('Format warning: Possibly unclosed template expression at char ' + possiblyUnclosed);
            possiblyUnclosed = 0;
        }

        let key = str.slice(start, i).trim();
        if (values[key]) {
            outstr.push(values[key]);
        }
        start = i + 1;
    }
    return outstr.join('');
}