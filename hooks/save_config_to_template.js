#!/usr/bin/env node
var save = require("./util/save_file_to_file");
save('config.xml', 'config.tmpl.xml');

var fill = require('./fill_config_template');
fill();