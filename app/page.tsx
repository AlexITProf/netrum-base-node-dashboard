'use client';

import Header from '@/components/Header';
import { useEffect, useRef, useState, useMemo } from 'react';
import { fetchActiveNodes } from '@/lib/api';
import Link from 'next/link';

const PAGE_SIZE = 20;
const REFRESH_INTERVAL = 30_000;

type Freshness = 'Fresh' | 'Delayed' | 'Stale';

function getFreshness(ts?: number): Freshness | 'N/A' {
  if (!ts) return 'N/A';
  const age = Date.now() / 1000 - ts;
  if (age < 3600) return 'Fresh';
  if (age < 86400) return 'Delayed';
  return 'Stale';
}

function freshnessWeight(f: Freshness | 'N/A') {
  switch (f) {
    case 'Fresh':
      return 0;
    case 'Delayed':
      return 1;
    case 'Stale':
      return 2;
    default:
      return 3;
  }
}

function freshnessStyle(f: Freshness | 'N/A') {
  switch (f) {
    case 'Fresh':
      return 'bg-green-600/20 text-green-400';
    case 'Delayed':
      return 'bg-yellow-600/20 text-yellow-400';
    case 'Stale':
      return 'bg-red-600/20 text-red-400';
    default:
      return 'bg-neutral-700 text-neutral-400';
  }
}

function formatLastMetrics(ts?: number) {
  if (!ts) return 'N/A';
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

type SortKey = 'freshness' | 'cpu' | 'ram' | 'disk';

export default function Home() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [remaining, setRemaining] = useState(REFRESH_INTERVAL);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('freshness');

  const isFetching = useRef(false);

  const loadNodes = async (isBackground = false) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (isBackground) setRefreshing(true);

      const data = await fetchActiveNodes();
      setNodes(data);
      (window as any).__ACTIVE_NODES__ = data;

      setLastUpdatedAt(Date.now());
      setRemaining(REFRESH_INTERVAL);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load nodes');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    const cached = (window as any).__ACTIVE_NODES__;
    if (cached && Array.isArray(cached)) {
      setNodes(cached);
      setInitialLoading(false);
    } else {
      loadNodes(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1000) {
          if (!isFetching.current) loadNodes(true);
          return REFRESH_INTERVAL;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredNodes = nodes.filter(node => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      node.nodeId?.toLowerCase().includes(q) ||
      node.wallet?.toLowerCase().includes(q)
    );
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    const ma = a.nodeMetrics || {};
    const mb = b.nodeMetrics || {};

    if (sortKey === 'freshness') {
      return (
        freshnessWeight(getFreshness(ma.lastSeen)) -
        freshnessWeight(getFreshness(mb.lastSeen))
      );
    }

    const va = Number(ma[sortKey] ?? 0);
    const vb = Number(mb[sortKey] ?? 0);

    return vb - va;
  });

  const totalPages = Math.ceil(sortedNodes.length / PAGE_SIZE);

  const visibleNodes = sortedNodes.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortKey]);

  /* ================= NETWORK SUMMARY ================= */
  const networkSummary = useMemo(() => {
    if (!nodes.length) return null;

    let fresh = 0;
    let delayed = 0;
    let stale = 0;

    let cpuSum = 0;
    let ramSum = 0;
    let diskSum = 0;
    let metricsCount = 0;

    nodes.forEach(node => {
      const m = node.nodeMetrics || {};
      const f = getFreshness(m.lastSeen);

      if (f === 'Fresh') fresh++;
      else if (f === 'Delayed') delayed++;
      else if (f === 'Stale') stale++;

      if (m.cpu || m.ram || m.disk) {
        cpuSum += m.cpu ?? 0;
        ramSum += m.ram ?? 0;
        diskSum += m.disk ?? 0;
        metricsCount++;
      }
    });

    const total = nodes.length;

    return {
      total,
      fresh,
      delayed,
      stale,
      freshPct: Math.round((fresh / total) * 100),
      delayedPct: Math.round((delayed / total) * 100),
      stalePct: Math.round((stale / total) * 100),
      avgCpu: metricsCount ? (cpuSum / metricsCount).toFixed(1) : 'N/A',
      avgRam: metricsCount ? Math.round(ramSum / metricsCount) : 'N/A',
      avgDisk: metricsCount ? Math.round(diskSum / metricsCount) : 'N/A',
    };
  }, [nodes]);
  /* =================================================== */

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Active Nodes</h1>

        {/* NETWORK SUMMARY */}
        {networkSummary && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold">Network Summary</h2>
              <span className="text-xs text-neutral-500">
                Public API · 30s refresh
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-neutral-400">Active Nodes</div>
                <div className="text-xl font-semibold">
                  {networkSummary.total}
                </div>
              </div>
              <div className="text-green-400 font-semibold">
                Fresh {networkSummary.fresh} ({networkSummary.freshPct}%)
              </div>
              <div className="text-yellow-400 font-semibold">
                Delayed {networkSummary.delayed} ({networkSummary.delayedPct}%)
              </div>
              <div className="text-red-400 font-semibold">
                Stale {networkSummary.stale} ({networkSummary.stalePct}%)
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
              <div className="bg-neutral-800 rounded p-2">
                Avg CPU
                <div className="font-semibold">{networkSummary.avgCpu}</div>
              </div>
              <div className="bg-neutral-800 rounded p-2">
                Avg RAM
                <div className="font-semibold">{networkSummary.avgRam}</div>
              </div>
              <div className="bg-neutral-800 rounded p-2">
                Avg Disk
                <div className="font-semibold">{networkSummary.avgDisk}</div>
              </div>
            </div>
          </div>
        )}

        {/* STATUS */}
        <div className="text-sm text-neutral-400 mb-4 space-y-1">
          {initialLoading && <p>📥 Initial loading…</p>}
          {refreshing && <p className="text-yellow-400">🟡 Updating in background…</p>}
          {!initialLoading && !refreshing && (
            <p>⏱ Next refresh in {Math.ceil(remaining / 1000)}s</p>
          )}
          {lastUpdatedAt && (
            <p>✅ Last update: {new Date(lastUpdatedAt).toLocaleTimeString()}</p>
          )}
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by nodeId or wallet…"
          className="w-full mb-4 px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
        />

        <div className="flex gap-2 mb-4 text-xs">
          {[
            ['freshness', 'Status'],
            ['cpu', 'CPU'],
            ['ram', 'RAM'],
            ['disk', 'Disk'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key as SortKey)}
              className={`px-3 py-1 rounded border ${
                sortKey === key
                  ? 'bg-neutral-700 border-neutral-500'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <ul className="space-y-4">
          {visibleNodes.map(node => {
            const m = node.nodeMetrics || {};
            const freshness = getFreshness(m.lastSeen);

            return (
              <Link key={node._id} href={`/nodes/${node._id}`}>
                <li className="group bg-neutral-900 p-5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-mono text-sm">{node.nodeId}</div>
                      <div className="text-xs text-neutral-500">
                        Node ID: {node._id}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400">
                        Active
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${freshnessStyle(freshness)}`}>
                        {freshness}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-neutral-800 rounded p-2 text-xs">
                      CPU
                      <div className="font-semibold">{m.cpu ?? 'N/A'}</div>
                    </div>
                    <div className="bg-neutral-800 rounded p-2 text-xs">
                      RAM
                      <div className="font-semibold">{m.ram ?? 'N/A'}</div>
                    </div>
                    <div className="bg-neutral-800 rounded p-2 text-xs">
                      Disk
                      <div className="font-semibold">{m.disk ?? 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>
                      Wallet: {node.wallet.slice(0, 6)}…{node.wallet.slice(-4)}
                    </span>
                    <span>
                      Last Metrics Update: {formatLastMetrics(m.lastSeen)}
                    </span>
                  </div>

                  <div className="mt-4 hidden group-hover:block text-xs text-neutral-400 space-y-2">
                    <div>
                      <span className="text-neutral-500">Wallet (full):</span>
                      <div className="font-mono break-all">{node.wallet}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-neutral-500">Type:</span>
                        <div>{node.type ?? 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Speed Tier:</span>
                        <div>{m.speed ?? 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Last Seen:</span>
                        <div>{formatLastMetrics(m.lastSeen)}</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Freshness:</span>
                        <div>{freshness}</div>
                      </div>
                    </div>
                  </div>
                </li>
              </Link>
            );
          })}
        </ul>

        <div className="flex justify-center items-center gap-4 mt-6 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-neutral-800 disabled:opacity-40"
          >
            ← Prev
          </button>

          <span className="text-neutral-400">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded bg-neutral-800 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </main>
    </>
  );
}
