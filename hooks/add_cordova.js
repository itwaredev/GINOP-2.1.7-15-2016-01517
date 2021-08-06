var fs = require('fs');

module.exports = function() {
    let mainData = fs.readFileSync('www/index.html', 'utf8');
    if (!mainData.match(/src="cordova\.js"/)) {
        fs.writeFileSync('www/index.html', mainData.replace('</body>', '<script type="text/javascript" src="cordova.js"></script></body>'));
    }
}