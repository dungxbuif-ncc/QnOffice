#!/bin/bash
set -e
echo "Building libs..."
cd libs
yarn
yarn build
