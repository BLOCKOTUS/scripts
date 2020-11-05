#!/bin/bash
set -e

if [ "${PWD##*/}" == "scripts" ];
    then
        pushd ../
fi

mkdir -p wallet
pushd scripts
yarn
pushd ../network
bash scripts/downloadBinaries.sh -s
pushd ../nerves
yarn
pushd ../tools/admins
yarn
pushd ../../organs/helper
yarn
pushd ../helper
yarn
pushd ../job
yarn
pushd ../user
yarn
pushd ../../webapp
yarn