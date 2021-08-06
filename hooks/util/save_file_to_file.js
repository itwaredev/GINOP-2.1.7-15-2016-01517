var fs = require('fs');
var path = require('path');

module.exports = function (src, dest) {
    if (src && dest) {
        let ROOT_DIR = './';
        let srcFileFull = path.join(ROOT_DIR, src);
        let destFileFull = path.join(ROOT_DIR, dest);

        let templateData = fs.readFileSync(srcFileFull, 'utf8');
        fs.writeFileSync(destFileFull, templateData);
    }
}