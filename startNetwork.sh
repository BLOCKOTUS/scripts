#!/bin/bash

pushd ../network
./network.sh down
rm -rf ../wallet/*
./network.sh up createChannel -ca -s couchdb