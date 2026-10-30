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
  // Check blocks around 6688112 to 6688200
  console.log('Searching for nonce 1 transaction from deployer...');
  for (let b = 6688113; b <= 6688160; b++) {
    const block = await callRpc('eth_getBlockByNumber', ['0x' + b.toString(16), true]);
    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (tx.from && tx.from.toLowerCase() === deployer.toLowerCase()) {
          console.log(`Found tx in block ${b}:`, tx.hash, 'to:', tx.to, 'input:', tx.input.slice(0, 30));
          return;
        }
      }
    }
  }
  console.log('Not in immediate blocks 6688113-6688160');
}

main().catch(console.error);
