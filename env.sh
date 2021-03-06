#!/bin/bash

export BLOCKOTUS=$PWD
export PATH=$BLOCKOTUS/network/bin:$PATH
export FABRIC_CFG_PATH=$BLOCKOTUS/network/config/

# Environment variables for Org1

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$BLOCKOTUS/network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$BLOCKOTUS/network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Environment variables for Org2

# export CORE_PEER_TLS_ENABLED=true
# export CORE_PEER_LOCALMSPID="Org2MSP"
# export CORE_PEER_TLS_ROOTCERT_FILE=$BLOCKOTUS/network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
# export CORE_PEER_MSPCONFIGPATH=$BLOCKOTUS/network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
# export CORE_PEER_ADDRESS=localhost:9051
