const fs = require('fs');
const path = require('path');
var RSA = require('hybrid-crypto-js').RSA;
var Crypt = require('hybrid-crypto-js').Crypt;
const axios = require('axios');

const user = require('../organs/user/api');
const identity = require('../organs/identity/api');
const job = require('../organs/job/api');

const indexLastJobAttribution = {"index":{"fields":["lastJobAttribution"]},"ddoc":"indexLastJobAttributionDoc","name":"indexLastJobAttribution","type":"json"};
const indexRegistryDateString = {"index":{"fields":["registryDate"]},"ddoc":"indexRegistryDateStringDoc","name":"indexRegistryDateString","type":"json"};
const indexNextWorkers = {"index":{"fields":["lastJobAttribution","registryDate"]},"ddoc":"indexNextWorkersDoc","name":"indexNextWorkers","type":"json"};

const rawUsers = ['dani', 'dani42', 'dani420', 'dani4200'];
const usersToCreate = rawUsers.map(u => `${(Math.random() * 420).toFixed(0)}-${u}`);

var crypt = new Crypt();
var rsa = new RSA();
var sharedKeyPairs = {};
var keypairs = {};
var wallets = {};
var ids = {};
var encryptedIdentities = {};
var workersByUsername = {};
var groupIds = {};
var jobs = {};

const myIdentity = {
    firstname: 'John',
    lastname: 'Smith',
    anotherfield: 'Anotherfield'
}

const generateKeyPair = () => {
    return new Promise((resolve) => {
        rsa.generateKeyPair(resolve);
    })
}

const createIndexes = async () => {
    console.log('##################################');
    console.log('createIndexes');
    console.log('##################################');

    const promises = [];
    promises.push(axios.post('http://admin:adminpw@localhost:5984/mychannel_user/_index', indexLastJobAttribution))
    promises.push(axios.post('http://admin:adminpw@localhost:7984/mychannel_user/_index', indexLastJobAttribution))
    promises.push(axios.post('http://admin:adminpw@localhost:5984/mychannel_user/_index', indexRegistryDateString))
    promises.push(axios.post('http://admin:adminpw@localhost:7984/mychannel_user/_index', indexRegistryDateString))
    promises.push(axios.post('http://admin:adminpw@localhost:5984/mychannel_user/_index', indexNextWorkers))
    promises.push(axios.post('http://admin:adminpw@localhost:7984/mychannel_user/_index', indexNextWorkers))

    return Promise.all(promises).catch(console.log);
}

const createWalletsAndRegister = async (users) => {
    console.log('##################################');
    console.log('createWalletsAndRegister');
    console.log('##################################');

    let promises = [];
    users.forEach(username => {
        console.log(' ::: ', username);
        promises.push(new Promise(async (r) => {
            keypairs[username] = await generateKeyPair();
            sharedKeyPairs[username] = await generateKeyPair();
            user
                .create({username, publicKey: keypairs[username].publicKey})
                .then(({wallet, id}) => {
                    wallets[username] = wallet;
                    ids[username] = id;

                    r();
                })
                .catch(console.log)
        }))

    })

    return Promise.all(promises).catch(console.log);
}

const createIdentities = async (users) => {
    console.log('##################################');
    console.log('createIdentities');
    console.log('##################################');

    let promises = [];
    users.forEach(u => {
        promises.push(new Promise((r) => {
            const encryptedIdentity = crypt.encrypt(sharedKeyPairs[u].publicKey, myIdentity);
            encryptedIdentities[u] = encryptedIdentity;
            identity
                .create({
                    encryptedIdentity,
                    user: {username: u, wallet: wallets[u]}
                })
                .then(r)
                .catch(console.log)
        }))
    })

    return Promise.all(promises).catch(console.log);
}

const createVerificationJobs = async (users) => {
    console.log('##################################');
    console.log('createVerificationJobs');
    console.log('##################################');

    let promises = [];
    users.forEach((u, i) => {
        promises.push(new Promise((r) => {
            setTimeout(() => {
                job.create({
                    type: 'confirmation',
                    data: encryptedIdentities[u],
                    chaincode: 'identity',
                    key: ids[u],
                    user: {username: u, wallet: wallets[u]}
                })
                .then(({workersIds, jobId}) => {
                    console.log('Workers count: ', workersIds.length)
                    workersByUsername[u] = workersIds;
                    groupIds[u] = jobId;
                    r()
                })
            }, i * 4000)
        }))
    })

    return Promise.all(promises).catch(console.log);
}

const createSharedKeypairs = async (users) => {
    console.log('##################################');
    console.log('createSharedKeypairs');
    console.log('##################################');

    let promises = [];
    users.forEach(u => {
        promises.push(new Promise((r) => {
            let sharedWith = {};
            let groupId = groupIds[u];
            let myEncryptedKeyPair = crypt.encrypt(keypairs[u].publicKey, sharedKeyPairs[u]);

            workersByUsername[u].forEach(worker => {
                if(worker._id === u) return;
                sharedWith[worker._id] = {keypair: crypt.encrypt(worker.publicKey, sharedKeyPairs[u])}
            })

            console.log('sharedWith count', Object.keys(sharedWith).length)

            user.shareKeypair({
                sharedWith,
                groupId,
                myEncryptedKeyPair,
                type: 'job',
                user: {username: u, wallet: wallets[u]}
            })
            .then(r)
        }))
    })

    return Promise.all(promises).catch(console.log);
}

const listJobs = async (users) => {
    console.log('##################################');
    console.log('listJobs');
    console.log('##################################');

    let promises = [];
    users.forEach(u => {
        promises.push(new Promise((r) => {
            job.list({
                status: 'pending',
                user: {username: u, wallet: wallets[u]}
            })
            .then(result => {
                console.log(result);
                jobs[u] = result;
                r();
            })
        }))
    })

    return Promise.all(promises).catch(console.log);
}

const completeJobs = async (user, jobs) => {
    console.log('##################################');
    console.log('completeJobs');
    console.log('##################################');

    let promises = [];
    jobs.forEach(j => {
        promises.push(
            new Promise((r) => {
                console.log({j})
                job.complete({
                    jobId: j.jobId,
                    result: 1,
                    user
                })
                .then(r)
            })
        )   
    })

    return Promise.all(promises).catch(console.log);
}

const completeAllJobs = async (users) => {
    console.log('##################################');
    console.log('completeAllJobs');
    console.log('##################################');

    let promises = [];
    users.forEach(u => {
        promises.push(new Promise((r) => {
            completeJobs({username: u, wallet: wallets[u]}, jobs[u])
                .then(r)
        }))
    })

    return Promise.all(promises).catch(console.log);
}

const start = async () => {

    // create indexes
    await createIndexes();

    // create wallets and users
    await createWalletsAndRegister(usersToCreate);

    // create identities
    await createIdentities(usersToCreate);

    // Create a job for each user
    await createVerificationJobs(usersToCreate);

    // Create a shared key for each user
    await createSharedKeypairs(usersToCreate);

    // List jobs
    await listJobs(usersToCreate);

    // Approve and complete the verification job
    await completeAllJobs(usersToCreate);

    // List jobs
    await listJobs(usersToCreate);
}

module.exports = { start };