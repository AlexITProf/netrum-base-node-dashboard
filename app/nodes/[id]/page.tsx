'use client';

import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';

/**
 * ⚠️ External RPC Notice
 *
 * The token balance displayed on this page is fetched via a
 * third-party read-only RPC endpoint.
 *
 * This RPC is NOT part of NetrumLabs Public Endpoints and is used
 * исключительно для улучшения пользовательского опыта (UX).
 *
 * All core dashboard functionality (node status, metrics,
 * rewards estimation, refresh logic) relies ONLY on
 * NetrumLabs Public API endpoints.
 */
import { getTokenBalance } from '@/lib/rpc';

const BASE_SPEED = 0.00004293;

type NodeDetails = {
  _id: string;
  nodeId: string;
  wallet: string;
  nodeStatus: string;
  type: string;
  createdAt?: string;
  lastClaimTime?: string;
  lastMiningStart?: string;
  txHash?: string;
  signature?: string;
  nodeMetrics?: {
    cpu?: number;
    ram?: number;
    disk?: number;
    speed?: number;
    lastSeen?: number;
  };
};

function formatDate(ts?: number | string) {
  if (!ts) return 'N/A';
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function NodeDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [node, setNode] = useState<NodeDetails | null>(null);
  const [error, setError] = useState('');

  const [balance, setBalance] = useState<number | null>(null);
  const [symbol, setSymbol] = useState('NPT');

  useEffect(() => {
    const cached = (window as any).__ACTIVE_NODES__;

    if (!Array.isArray(cached)) {
      setError('Nodes cache not found');
      return;
    }

    const found = cached.find((n: any) => n._id === id);
    if (!found) {
      setError('Node not found or no longer active');
      return;
    }

    setNode(found);
  }, [id]);

  useEffect(() => {
    if (!node?.wallet) return;

    // External RPC (read-only, optional, UX enhancement only)
    getTokenBalance(node.wallet)
      .then(res => {
        setBalance(res.balance);
        setSymbol(res.symbol);
      })
      .catch(() => {
        setBalance(null);
      });
  }, [node?.wallet]);

  if (error) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  if (!node) {
    return <div className="p-8 text-neutral-400">Loading node…</div>;
  }

  const m = node.nodeMetrics || {};

  const startTs = node.lastClaimTime
    ? new Date(node.lastClaimTime).getTime() / 1000
    : node.lastMiningStart
    ? new Date(node.lastMiningStart).getTime() / 1000
    : null;

  const now = Date.now() / 1000;
  const miningSeconds = startTs ? Math.max(0, now - startTs) : 0;

  const speed = m.speed ?? 0;
  const estimatedMined = BASE_SPEED * speed * miningSeconds;

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto p-6 text-white space-y-6">
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← Back to Main
        </Link>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex justify-between items-start">
          <div>
            <div className="font-mono text-lg">{node.nodeId}</div>
            <div className="text-xs text-neutral-500 mt-1">
              Node ID: {node._id}
            </div>
            <div className="text-xs text-neutral-500">
              Wallet: {node.wallet}
            </div>
          </div>

          <span className="px-3 py-1 text-xs rounded bg-green-600/20 text-green-400">
            {node.nodeStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['CPU', m.cpu],
            ['RAM', m.ram],
            ['Disk', m.disk],
            ['Speed', m.speed],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="bg-neutral-900 border border-neutral-800 rounded p-4"
            >
              <div className="text-xs text-neutral-400">{label}</div>
              <div className="text-xl font-semibold">{value ?? 'N/A'}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-2 text-sm">
            <div>
              <span className="text-neutral-400">Created:</span>{' '}
              {formatDate(node.createdAt)}
            </div>
            <div>
              <span className="text-neutral-400">Last claim:</span>{' '}
              {formatDate(node.lastClaimTime)}
            </div>
            <div>
              <span className="text-neutral-400">Last metrics:</span>{' '}
              {formatDate(m.lastSeen)}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3 text-sm">
            <div className="text-neutral-400">Rewards</div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>Claimed balance</span>
                <span className="text-xs text-yellow-400">(External RPC)</span>

                <div className="relative group">
                  <span className="cursor-help text-neutral-400">ⓘ</span>
                  <div className="absolute z-10 hidden group-hover:block w-72 text-xs text-neutral-200 bg-neutral-800 border border-neutral-700 rounded p-2 -left-1/2 top-5">
                    Balance is fetched via a third-party read-only RPC endpoint.
                    This data is not part of NetrumLabs Public Endpoints and is
                    shown only for convenience.
                  </div>
                </div>
              </div>

              <span className="font-semibold">
                {balance !== null
                  ? `${balance.toFixed(4)} ${symbol}`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span>Estimated mining potential</span>

                <div className="relative group">
                  <span className="cursor-help text-neutral-400">ⓘ</span>
                  <div className="absolute z-10 hidden group-hover:block w-72 text-xs text-neutral-200 bg-neutral-800 border border-neutral-700 rounded p-2 -left-1/2 top-5">
                    Approximate value. Calculated from the last claim, node
                    restart, binary update, or network update. Actual mined
                    amount may differ.
                  </div>
                </div>
              </div>

              <span className="font-semibold">
                {estimatedMined.toFixed(4)} {symbol}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Mining time</span>
              <span>{formatDuration(miningSeconds)}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
