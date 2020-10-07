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
pushd ../organs/admins
yarn
pushd ../identity
yarn
pushd ../helper
yarn
pushd ../../webapp
yarn