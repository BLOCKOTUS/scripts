#!/bin/bash
set -e

if [ "${PWD##*/}" == "scripts" ];
    then
        pushd ../
fi

echo "Creating wallet..."
mkdir -p wallet

echo "Installing scripts..."
pushd scripts
source /usr/local/opt/nvm/nvm.sh
nvm use 15
yarn

if [[ "$*" == "--skip-binaries" ]]
then
    disableBinaries=true
fi

if [ "$disableBinaries" != true ]; then
    echo "Downloading binaries..."
    pushd ../network
    bash scripts/bootstrap.sh -s 2.3.0 1.4.9
fi

echo "Installing nerves..."
pushd ../nerves
nvm use 14
yarn

echo "Installing admin tools..."
pushd ../tools/admins
yarn

echo "Installing helper libraries..."
pushd ../../organs/helper
yarn

echo "Installing did libraries..."
pushd ../did
nvm use 15
yarn

echo "Installing job libraries..."
pushd ../job
yarn

echo "Installing keypair libraries..."
pushd ../keypair
yarn

echo "Installing identity libraries..."
pushd ../job
yarn

echo "Installing user libraries..."
pushd ../user
yarn

echo "Installing webapp..."
pushd ../../webapps/webapp-react
npm install

echo "Done."
