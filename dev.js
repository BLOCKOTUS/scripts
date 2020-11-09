import child_process from 'child_process';
import arg from 'arg';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as enrollAdmin from '../tools/admins/dist/enrollAdmin.js';
import * as bootstrap from './bootstrap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = arg({
  // Types
  '--skip-network': Boolean,
  '--skip-contracts': Boolean,
  '--skip-bootstrap': Boolean,
  '--skip-nerves': Boolean,
  '--skip-webapp': Boolean,
  '--verbose': Boolean,   
  '--config-file': String,

  // Aliases
  '-v': '--verbose',
});

const CWD_SCRIPTS = __dirname;
const CWD_NERVES = path.join(__dirname, '../nerves');
const CWD_WEBAPP = path.join(__dirname, '../webapp');
const BLOCKOTUS = path.join(__dirname, '../');

const ENV = {
  BLOCKOTUS,
  PATH: `${BLOCKOTUS}network/bin:${process.env.PATH}`,
  FABRIC_CFG_PATH: `${BLOCKOTUS}network/config`,

  CORE_PEER_TLS_ENABLED: `true`,
  CORE_PEER_LOCALMSPID: `Org1MSP`,
  CORE_PEER_TLS_ROOTCERT_FILE: `${BLOCKOTUS}network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`,
  CORE_PEER_MSPCONFIGPATH: `${BLOCKOTUS}network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp`,
  CORE_PEER_ADDRESS: `localhost:7051`,
};

const STDIO = args['--verbose'] 
  ? ['inherit', 'inherit', 'inherit']
  : ['ignore', 'ignore', 'inherit'];

const STDIO_NETWORK_CONTRACTS = args['--verbose'] 
  ? ['inherit', 'inherit', 'inherit']
  : ['ignore', 'ignore', 'ignore'];

const verbose = log => args['--verbose'] && console.log(log);

const serial = funcs =>
  funcs.reduce((promise, func) =>
    typeof func === 'function'
      ? promise.then(result => func().then(Array.prototype.concat.bind(result)))
      : null
  , Promise.resolve([]));

const network = () => {
  console.log('***** starting network *****');
  child_process.execSync(
    './startNetwork.sh',
    { stdio: STDIO_NETWORK_CONTRACTS, cwd: CWD_SCRIPTS, env: ENV }
  );
  verbose('done.');
}

const contracts = async () => {
  console.log('***** deploying contracts *****');
  const CONFIG = await import(args['--config-file'] || '../.blockotus.js');
  child_process.execSync(
    'rm -rf ./versions/*',
    { stdio: STDIO, cwd: CWD_SCRIPTS, env: ENV }
  );

  const promisesContracts = CONFIG.default.organs.map(o => {
    return new Promise((resolve) => {
      try{
        o.lang === 'typescript' && child_process.execSync(
          `rm -rf ../organs/${o.name}/chaincode/typescript/dist/*`,
          { stdio: STDIO_NETWORK_CONTRACTS, cwd: CWD_SCRIPTS, env: ENV }
        );
      } catch (e) { console.log('ERROR deleting typescript dist', e) }               

      try{
        child_process.execSync(
          `./startFabric.sh ${o.name} ${o.lang}`,
          { stdio: STDIO_NETWORK_CONTRACTS, cwd: CWD_SCRIPTS, env: ENV }
        );
      } catch (e) { console.log('ERROR with ./startFabric', e) }      

      resolve();
    });
  });

  await serial(promisesContracts);
  verbose('done.');
}

const boot = async () => {
  try {
    await enrollAdmin.main();
  } catch (e) { }
  console.log('***** booting in 5 seconds... *****');
  return new Promise((resolve) => {
    setTimeout(async () => {
      await bootstrap.start();
      resolve();
    }, 5000);
  });
}

const nerves = () => {
  console.log('***** starting nerves *****');
  child_process.execSync(
    'yarn start &',
    { stdio: STDIO, cwd: CWD_NERVES, env: ENV }
  );
  verbose('done.');
}

const webapp = () => {
  console.log('***** starting webapp *****');
  child_process.exec(
    'yarn start',
    { stdio: STDIO, cwd: CWD_WEBAPP, env: ENV }
  );
  verbose('done.');
}

const dev = async () => {
  !args['--skip-network'] && network();
  !args['--skip-contracts'] && await contracts();
  !args['--skip-bootstrap'] && await boot();
  !args['--skip-nerves'] && nerves();
  !args['--skip-webapp'] && webapp();
  console.log('Organism running.');
  verbose('You rock baby.');
}

dev();
