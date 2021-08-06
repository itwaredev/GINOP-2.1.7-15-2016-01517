#!/usr/bin/env bash

echo "{\"frontendVersion\":\"$(git rev-parse --verify --short HEAD)\",\"frontendDate\":\"$(date +"%Y-%m-%d %H:%M:%S")\",\"appVersion\":\"$(str=$(grep -Eo '<widget(\s|.)+?version="([^"]+)' config.xml) && grep -Eo '[^"]+$' <<< $str)\",\"package\":\"$(str=$(grep -Eo '<widget(\s|.)+? id="([^"]+)' config.xml) && grep -Eo '[^"]+$' <<< $str)\",\"appleAppId\":\"$(str=$(grep -Eo '<widget(\s|.)+? appleAppId="([^"]+)' config.xml) && grep -Eo '[^"]+$' <<< $str)\"}" > ./src/assets/version.json
