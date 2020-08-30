#!/bin/bash


bash env.sh
pushd network
bash scripts/downloadBinaries.sh -d -s
pushd ../nerves
yarn
pushd ../organs/admins
yarn
pushd ../identity
yarn
pushd ../../webapp
yarn