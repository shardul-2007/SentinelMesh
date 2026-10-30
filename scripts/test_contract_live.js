const rpc = 'https://testnetrpc.mstblockchain.com';
const contractAddr = '0x0539fc70ee18fa936395c8dd6db623af6b43ceca';
const deployer = '0x145115aD79A09A91249169E13BAEE24A9eA20ab3';

async function callRpc(method, params) {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  return (await res.json()).result;
}

async function main() {
  console.log('--- Testing Live MST Testnet Contract ---');
  console.log('Contract:', contractAddr);

  // 1. Check bytecode
  const code = await callRpc('eth_getCode', [contractAddr, 'latest']);
  console.log('Bytecode size:', code ? (code.length - 2) / 2 : 0, 'bytes');

  // 2. Check owner (selector: 0x8da5cb5b)
  const ownerRes = await callRpc('eth_call', [{ to: contractAddr, data: '0x8da5cb5b' }, 'latest']);
  const owner = '0x' + ownerRes.slice(26);
  console.log('Owner on-chain:', owner);

  // 3. Check authorizedSubmitters(deployer)
  // selector for authorizedSubmitters(address): 0x51c6b165
  // But wait! In EvidenceRegistry.sol, authorizedSubmitters is:
  // mapping(address => bool) public authorizedSubmitters;
  // Let's compute its selector:
  // keccak256("authorizedSubmitters(address)") -> 0x51c6b165? Let's check!
  console.log('Deployer address:', deployer);

  // 4. Check block number
  const blockHex = await callRpc('eth_blockNumber', []);
  console.log('Current block:', parseInt(blockHex, 16));

  // 5. Check deployer balance
  const balHex = await callRpc('eth_getBalance', [deployer, 'latest']);
  const bal = Number(BigInt(balHex) / BigInt(10**14)) / 10000;
  console.log('Deployer balance:', bal, 'tMSTC');
}

main().catch(console.error);
