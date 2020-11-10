import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { RSA, Crypt } from 'hybrid-crypto-js';
import axios from 'axios';
import crypto from 'crypto';

/**
 * Organs (chaincode) APIs.
 */
import * as user from '../organs/user/api/index.minified.js';
import * as identity from '../organs/identity/api/index.minified.js';
import * as job from '../organs/job/api/index.minified.js';

/**
 * __filename and __dirname are not defined in NPM modules on Node 15.
 * We construct them manually. We may use babel later, which populate those variables correclty.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Indexes to be created on the CouchDB database.
 */
const indexLastJobAttribution = {"index":{"fields":["lastJobAttribution"]},"ddoc":"indexLastJobAttributionDoc","name":"indexLastJobAttribution","type":"json"};
const indexRegistryDateString = {"index":{"fields":["registryDate"]},"ddoc":"indexRegistryDateStringDoc","name":"indexRegistryDateString","type":"json"};
const indexNextWorkers = {"index":{"fields":["lastJobAttribution","registryDate"]},"ddoc":"indexNextWorkersDoc","name":"indexNextWorkers","type":"json"};

/**
 * Arbitrary usernames, used to create a bunch of users.
 */
const rawUsers = ['dani', 'dani42', 'dani420', 'dani4200'];
const usersToCreate = rawUsers.map(u => `${(Math.random() * 420).toFixed(0)}-${u}`);

/**
 * A bunch of objects used to store values.
 */
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

/**
 * Identity object, used later in the code.
 */
const baseIdentity = {
    firstname: 'John',
    lastname: 'Smith',
    birthdate: '1990-10-23',
    nation: 'US',
    nationalId: 'jd8wljd9',
};

/**
 * Promisified rsa.generateKeyPair function.
 */
const generateKeyPair = () => {
    return new Promise((resolve) => {
        rsa.generateKeyPair(resolve);
    })
};

/**
 * Return a string md5 hash based on specific fields of an identity.
 */
const uniqueHashFromIdentity = identity =>
    crypto
        .createHash('md5')
        .update(`${identity.nation}-${identity.nationalId}-${identity.birthdate}`)
        .digest('hex');

/**
 * Send request to the CouchDB database.
 * It creates indexes, which allows us to sort by those indexes.
 */
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
};

/**
 * Send a request to the network.
 * Create users and receive wallets.
 */
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
};

/**
 * Send a request to the network.
 * Create identities.
 */
const createIdentities = async (users) => {
    console.log('##################################');
    console.log('createIdentities');
    console.log('##################################');

    let promises = [];
    users.forEach((u, i) => {
        promises.push(new Promise((r) => {
            var myIdentity = { ...baseIdentity, nationalId: `${baseIdentity.nationalId}${i}` };
            var encryptedIdentity = crypt.encrypt(sharedKeyPairs[u].publicKey, myIdentity);
            var uniqueHash = uniqueHashFromIdentity(myIdentity);
            encryptedIdentities[u] = encryptedIdentity;
            identity
                .create({
                    encryptedIdentity,
                    uniqueHash,
                    user: {username: u, wallet: wallets[u]}
                })
                .then(r)
                .catch(console.log)
        }))
    })

    return Promise.all(promises).catch(console.log);
};

/**
 * Send a request to the network.
 * Create jobs.
 * Those jobs are identity verification tasks.
 * They are attributed to an array of users.
 */
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
};

/**
 * Send a request to the network.
 * Create keypairs, and share them with a group of workers attributed to the same task.
 */
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
};

/**
 * Send a request to the network.
 * List jobs attributed to the user.
 */
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
};

/**
 * Send a request to the network.
 * Complete jobs, by sending a result.
 * In that case, we arbitrary `approve` all the jobs.
 */
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
};

/**
 * Send a request to the network.
 * Complete all the jobs using the function above.
 */
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
};

/**
 * Start the Bootstrap process.
 */
export const start = async () => {

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
};
