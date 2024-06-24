#!/bin/sh

set -e

rm -rf ./dist;

tsc;

cp -r ./certs ./dist;
node --env-file=./.env ./dist/index.mjs
