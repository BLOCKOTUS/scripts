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

ORGAN=${1}

if [ $# -eq 0 ]
    then
        echo "No organ supplied."
        exit 0
fi

mkdir -p versions
path="./versions/$ORGAN"
touch $path 
VERSION=$(<$path)

if [ -z "$VERSION" ]
    then
        VERSION=2
    else
        VERSION=$(($VERSION+1))
fi

echo "$VERSION" > $path

echo $VERSION

./startFabric.sh $ORGAN javascript $VERSION
