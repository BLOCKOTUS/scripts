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

SKIP_NERVES=0
SKIP_CONTRACTS=0
SKIP_WEBAPP=0
SKIP_BOOTSTRAP=0
SKIP_NETWORK=0

# parse flags
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -sn )
    SKIP_NERVES=1
    ;;
  -sc )
    SKIP_CONTRACTS=1
    ;;
  -swa )
    SKIP_WEBAPP=1
    ;;
  -sb )
    SKIP_BOOTSTRAP=1
    ;;
  -snet )
    SKIP_NETWORK=1
    ;;
  * )
    echo
    echo "Unknown flag: $key"
    echo
    exit 1
    ;;
  esac
  shift
done

if [ $SKIP_NETWORK == 0 ];
    then
        # start testnet network
        ./startNetwork.sh
fi

if [ $SKIP_CONTRACTS == 0 ];
    then
        echo "Compiling and deploying contracts"
        # clean upgrade data
        rm -rf ./versions/*
        # build and deploy chaincode contracts
        ./startFabric.sh helper javascript
        ./startFabric.sh user javascript
        ./startFabric.sh job javascript
        ./startFabric.sh identity javascript
        
        # enroll admin
        pushd ../organs/admins
        node enrollAdmin
fi

if [ $SKIP_BOOTSTRAP == 0 ];
    then
        echo "Bootstraping..."
        ## create 3 users and wallets
        pushd ../../scripts
        node bootstrap 
fi

if [ $SKIP_NERVES == 0 ];
    then
        echo "Starting nerves..."
        # start nerves-server
        pushd ../nerves
        yarn start &
fi

if [ $SKIP_WEBAPP == 0 ];
    then
        echo "Starting webapp..."
        # start webapp
        pushd ../webapp
        yarn dev
fi

# give compliment
echo "You rock baby. Starting webapp."