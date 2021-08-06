#!/bin/bash

set -x

platform="$1"
config="$2"

ionic build "$config"

if [ "$platform" = "android" ]; then
  ionic cordova platform remove android
  ionic cordova platform remove android@8
  ionic cordova platform add android@8
else
  ionic cordova platform remove ios
  ionic cordova platform add ios --no-resources
fi
ionic cordova build "$platform" $3 --no-build
