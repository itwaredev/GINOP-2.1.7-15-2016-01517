var fs = require('fs');
var load = require('./util/load_env');
var format = require('./util/format');

module.exports = function() {
    let env = load();

    let content = format(fs.readFileSync('config.tmpl.xml', 'utf8'), env, !env.production);
    fs.writeFileSync('config.xml', content);
}