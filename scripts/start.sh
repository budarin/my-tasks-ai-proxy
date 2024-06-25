#!/bin/sh

set -e

rm -rf ./dist;

tsc;

cp -r ./certs ./dist;
node ./dist/index.mjs
