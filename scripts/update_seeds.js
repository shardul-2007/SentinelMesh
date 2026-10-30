const fs = require('fs');

function updateClientStore() {
  let file = fs.readFileSync('frontend/src/lib/clientStore.ts', 'utf8');
  file = file.replace(/\r\n/g, '\n');

  const oldBlock = `const SEED_TXS: BlockchainTransaction[] = [
  {
    transaction_hash: '0x9c4266191dbbe1ad6fc3e62551ecdf63303cb5d8ef4f58c70f6153ae2985862d',
    event_id: 'evt_eval_e2e_001',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 1428590,
    status: 'SIMULATED',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    explorer_url: undefined,
    canonical_hash: '0x7b58c7d8122345598118dcf7760971b3e7bc8885b512e07198bb602c382f7678'
  },
  {
    transaction_hash: '0x9d4e5f2a1b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    event_id: 'evt_mst_001',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 1428589,
    status: 'SIMULATED',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    explorer_url: undefined,
    canonical_hash: 'c87f91894a8f98d5754cb58797f1abdc5b2f2771f28b492b45070fcf14729f2e'
  }
];`;

  const newBlock = `const SEED_TXS: BlockchainTransaction[] = [
  {
    transaction_hash: '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6',
    event_id: 'evt_contract_deploy_mst',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 6688112,
    status: 'CONFIRMED',
    timestamp: '2026-10-30T03:12:00.000Z',
    explorer_url: \`\${MST_EXPLORER_URL}/tx/0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6\`,
    canonical_hash: '0x0539fc70ee18fa936395c8dd6db623af6b43ceca'
  },
  {
    transaction_hash: '0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008',
    event_id: 'evt_eval_e2e_001',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 6688105,
    status: 'CONFIRMED',
    timestamp: '2026-10-30T03:08:00.000Z',
    explorer_url: \`\${MST_EXPLORER_URL}/tx/0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008\`,
    canonical_hash: '0xcc95344e2a223897f18fd346d3aba38392817be5'
  }
];`;

  if (file.includes(oldBlock)) {
    file = file.replace(oldBlock, newBlock);
    fs.writeFileSync('frontend/src/lib/clientStore.ts', file);
    console.log('clientStore.ts updated successfully');
  } else {
    console.log('Could not find oldBlock in clientStore.ts');
  }
}

function updateBackendEngine() {
  let file = fs.readFileSync('frontend/src/lib/server/backendEngine.ts', 'utf8');
  file = file.replace(/\r\n/g, '\n');

  const oldBlock = `  {
    transaction_hash: '0x9c4266191dbbe1ad6fc3e62551ecdf63303cb5d8ef4f58c70f6153ae2985862d',
    event_id: 'evt_eval_e2e_001',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_TESTNET_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 6688110,
    status: 'CONFIRMED',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    explorer_url: \`\${MST_EXPLORER_URL}/tx/0x9c4266191dbbe1ad6fc3e62551ecdf63303cb5d8ef4f58c70f6153ae2985862d\`,
    canonical_hash: '0x7b58c7d8122345598118dcf7760971b3e7bc8885b512e07198bb602c382f7678'
  }`;

  const newBlock = `  {
    transaction_hash: '0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008',
    event_id: 'evt_eval_e2e_001',
    contract_address: MST_CONTRACT_ADDRESS,
    chain_id: MST_TESTNET_CHAIN_ID,
    network_name: 'MST Testnet',
    block_number: 6688105,
    status: 'CONFIRMED',
    timestamp: '2026-10-30T03:08:00.000Z',
    explorer_url: \`\${MST_EXPLORER_URL}/tx/0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008\`,
    canonical_hash: '0xcc95344e2a223897f18fd346d3aba38392817be5'
  }`;

  if (file.includes(oldBlock)) {
    file = file.replace(oldBlock, newBlock);
    fs.writeFileSync('frontend/src/lib/server/backendEngine.ts', file);
    console.log('backendEngine.ts updated successfully');
  } else {
    console.log('Could not find oldBlock in backendEngine.ts');
  }
}

updateClientStore();
updateBackendEngine();

function updateRemainingFiles() {
  const files = [
    'README.md',
    'frontend/src/components/JudgeDemoTour.tsx',
    'frontend/src/lib/clientStore.ts'
  ];

  const fakeTx = '0x9c4266191dbbe1ad6fc3e62551ecdf63303cb5d8ef4f58c70f6153ae2985862d';
  const realTx = '0xbb3072b6bd98f17f34f161d404cfdb9d557b56356ce1ddddc3a441907e9f8008';

  for (const f of files) {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      if (content.includes(fakeTx)) {
        content = content.replaceAll(fakeTx, realTx);
        fs.writeFileSync(f, content);
        console.log(`Updated fakeTx in ${f}`);
      }
    }
  }
}

updateRemainingFiles();

function update9a8Files() {
  const files = [
    'frontend/src/app/integrity/page.tsx',
    'frontend/src/components/TrustTimeline.tsx'
  ];

  const fakeTx = '0x9a8f273b5c104e8d3f6291a847291a03e18f8b39487c6e5a01948372615a9b8c';
  const realTx = '0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6';

  for (const f of files) {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      if (content.includes(fakeTx)) {
        content = content.replaceAll(fakeTx, realTx);
        fs.writeFileSync(f, content);
        console.log(`Updated 0x9a8f in ${f}`);
      }
    }
  }
}

update9a8Files();
