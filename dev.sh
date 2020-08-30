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
./startFabric.sh user user javascript
./startFabric.sh identity identity javascript
# ./startFabric.sh notification notification javascript
./startFabric.sh job job javascript

# enroll admin
pushd ../organs/admins
node enrollAdmin

## create 3 users and wallets
pushd ../../scripts
node bootstrap 

# create and approve identities for the first tribe
# TODO: node approveFirstTribe

# # start nerves-server
# pushd ../../nerves
# yarn start &

# # start webapp
# pushd ../webapp
# yarn dev

# give compliment
echo "You rock baby. Starting webapp."