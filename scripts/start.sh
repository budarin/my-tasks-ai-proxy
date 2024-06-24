#!/bin/sh

set -e

rm -rf ./dist;

tsc;

node --env-file=./.env ./dist/index.mjs
