# BLOCKOTUS Scripts

## Abstract

This repository is part of the BLOCKOTUS Organism (https://github.com/BLOCKOTUS/organism).

## Scripts

### dev.js
Execute all the commands needed to start developing, after having run the installation script.

### env.sh
Environment variables.

### install.sh
Install HyperLedger Fabric binaries, pull docker images, and install npm packages.

### startFabric.sh
Compile Chaincode Contracts, and deploy Chaincodes to the network.

### startNetwork.sh
Start and stop the network.

### upgrade.sh
Deploy a new version of a Chaincode Contract to the network.

## Usage

You can use the scripts directly from the scripts folder, doing:

```bash
$ bash anyscript.dev <args>
```

Or, they are used by the package.json file of the Organism repository. For example, from the Organism repository, run: 

```bash
$ yarn dev
```

### How to contribute
Fork and submit a pull-request.

### How to use it for your own project
Clone or download the repository. Modify at your convenience.

In an ideal world, you will conserve the same license, and give credits to the author [@danielfebrero](https://github.com/danielfebrero).