#!/bin/bash

if [ "${PWD##*/}" != "scripts" ];
    then
        pushd scripts
fi

bash env.sh

# clean upgrade data
rm -rf ./versions/*

# start testnet network
./startNetwork.sh

# build and deploy chaincode contracts
./startFabric.sh helper javascript
./startFabric.sh user javascript
./startFabric.sh job javascript
./startFabric.sh identity javascript

# enroll admin
pushd ../organs/admins
node enrollAdmin

## create 3 users and wallets
pushd ../../scripts
node bootstrap 

# start nerves-server
# pushd ../nerves
# yarn start &

# # start webapp
# pushd ../webapp
# yarn dev

# give compliment
echo "You rock baby. Starting webapp."