var fs = require('fs');
var load = require('./util/load_env');
var format = require('./util/format');

var resources = [
    { 
        src: '${CONF_EXT}google-services.json', 
        targets: [
            'google-services.json',
            'app/google-services.json'
        ], 
        platform: 'android'},
    { 
        src: '${CONF_EXT}GoogleService-Info.plist', 
        targetss: [
            '${APP_NAME}/Resources/GoogleService-Info.plist',
            '${APP_NAME}/Resources/Resources/GoogleService-Info.plist'
        ],
        platform: 'ios'}
];

module.exports = function(context) {
    let env = load();
    let platforms = context.opts.platforms;
    if (env['CONF_EXT']) {
        resources.forEach(resource => {
            let src = format(resource.src, env, false);
            try {
                if (platforms.indexOf(resource.platform) > -1 && fs.statSync(`platforms/${resource.platform}`).isDirectory()) {
                    let data = fs.readFileSync(`${src}`, 'utf8');
                    resource.targets.forEach(tar => {
                        let target = format(tar, env);
                        fs.writeFileSync(`platforms/${resource.platform}/${target}`, data);
                    });
                }
              } catch (e) {
                console.log(e.message);
                return;
              }
        });
    }
}