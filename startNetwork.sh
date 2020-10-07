#!/bin/bash
set -e

###### source variables
if [ "${PWD##*/}" == "scripts" ];
    then
        pushd ../
fi

source ./scripts/env.sh
pushd scripts
######

pushd ../network
./network.sh down
rm -rf ../wallet/*
./network.sh up createChannel -ca -s couchdb