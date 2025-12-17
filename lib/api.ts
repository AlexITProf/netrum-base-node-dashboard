const BASE_URL = 'https://node.netrumlabs.dev';

export async function fetchActiveNodes() {
  const res = await fetch(`${BASE_URL}/lite/nodes/active`, {
    cache: 'no-store',
  });

  const json = await res.json();

  const nodes =
    json?.data?.nodes ||
    json?.result?.nodes ||
    json?.nodes ||
    [];

  if (!Array.isArray(nodes)) {
    throw new Error('Invalid API response');
  }

  return nodes;
}

export async function fetchNodeById(nodeId: string) {
  const res = await fetch(
    `${BASE_URL}/lite/nodes/id/${nodeId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch node');
  }

  const json = await res.json();

  const node =
    json?.data ||
    json?.result ||
    json;

  if (!node || typeof node !== 'object') {
    throw new Error('Invalid node response');
  }

  return node;
}

export async function getNodeTaskStats(nodeId: string) {
  const res = await fetch(
    `https://node.netrumlabs.dev/polling/node-stats/${nodeId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch node task stats");
  }

  return res.json();
}
