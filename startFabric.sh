#!/bin/bash
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CCG_NAME=${1:-"identity"}
CC_NAME=${2:-"identity"}
CC_SRC_LANGUAGE=${3:-"javascript"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`
CC_VERSION=${4:-"1"}

if [ "$CC_SRC_LANGUAGE" != "go" -a "$CC_SRC_LANGUAGE" != "golang" -a "$CC_SRC_LANGUAGE" != "java" \
 -a  "$CC_SRC_LANGUAGE" != "javascript"  -a "$CC_SRC_LANGUAGE" != "typescript" ] ; then

	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
 	echo Supported chaincode languages are: go, java, javascript, and typescript
 	exit 1

fi

if [ "$CC_SRC_LANGUAGE" = "go" -o "$CC_SRC_LANGUAGE" = "golang" ] ; then
	CC_SRC_PATH="../organs/"$CCG_NAME"/chaincode/"$CC_NAME"/go/"
elif [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
	CC_SRC_PATH="../organs/"$CCG_NAME"/chaincode/"$CC_NAME"/javascript/"
elif [ "$CC_SRC_LANGUAGE" = "java" ]; then
	CC_SRC_PATH="../organs/"$CCG_NAME"/chaincode/"$CC_NAME"/java"
elif [ "$CC_SRC_LANGUAGE" = "typescript" ]; then
	CC_SRC_PATH="../organs/"$CCG_NAME"/chaincode/"$CC_NAME"/typescript/"
else
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
	echo Supported chaincode languages are: go, java, javascript, and typescript
	exit 1
fi

pushd ../network
./network.sh deployCC -ccn ${CCG_NAME} -ccv ${CC_VERSION} -ccs ${CC_VERSION} -cci initLedger -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH}

popd

cat <<EOF

Contract deployment total setup execution time : $(($(date +%s) - starttime)) secs ...

EOF
