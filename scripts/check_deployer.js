const rpc = 'https://testnetrpc.mstblockchain.com';
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
  const nonce = await callRpc('eth_getTransactionCount', [deployer, 'latest']);
  console.log('Deployer current nonce:', nonce);
}

main().catch(console.error);
