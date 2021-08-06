var fs = require('fs');

module.exports = function() {
    var mainResults = fs.readdirSync('www/').filter(item => item.match(/main\..*js/));
    var mainName = mainResults[0];

    var mainPath = mainName ? 'www/' + mainName : 'src/environments/environment.ts';
    var mainData = fs.readFileSync(mainPath, 'utf8');
    var match = mainData.match(/environment =(.|\s)+?;/gm);
    if (!match) {
        match = [mainData.match(/=({baseUrl:(.|\s)+?)(;|},)/)[0].replace(/({|,)/g, '$1\n').replace('!1', false).replace('!0', true)];
    }
    var jsonTxt = match[0].match(/\{(.|(\n|\r)*)+\}/gm)[0].replace(/\'/gm, '"').replace(/(\n|\r)\s*([\S]+?):/gm, ' "$2":');
    var env = JSON.parse(jsonTxt);
    return env;
}