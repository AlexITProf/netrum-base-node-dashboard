'use client';
import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const BASE_SPEED = 0.00004293; // rewards per second (ideal node)
const PAGE_SIZE = 20;

/**
 * Tooltip text for estimated rewards
 */
const ESTIMATE_TOOLTIP_TEXT = `Approximate value.
Calculated from the last claim, node restart,
binary update, or network update.
Actual mined amount may differ.`;

type Freshness = 'Fresh' | 'Delayed' | 'Stale';

function getFreshness(ts?: number): Freshness | 'N/A' {
  if (!ts) return 'N/A';
  const age = Date.now() / 1000 - ts;
  if (age < 3600) return 'Fresh';
  if (age < 86400) return 'Delayed';
  return 'Stale';
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

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatDate(ts?: string) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleString();
}

/**
 * Simple tooltip component
 */
function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1">
      <span className="text-yellow-400 cursor-help font-bold">!</span>
      <span
        className="absolute bottom-full mb-2 w-64 p-2 text-[11px] leading-snug
        bg-neutral-900 border border-neutral-700 rounded
        opacity-0 group-hover:opacity-100 transition
        pointer-events-none z-10"
      >
        {text}
      </span>
    </span>
  );
}

export default function RewardsPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // ✅ ONLY CACHE, NO API
  useEffect(() => {
    const cached = (window as any).__ACTIVE_NODES__;
    if (cached && Array.isArray(cached)) {
      setNodes(cached.filter(n => n.nodeStatus === 'Active'));
    }
  }, []);

  const enriched = useMemo(() => {
    const now = Date.now() / 1000;

    return nodes.map(node => {
      /**
       * ⚠️ APPROXIMATE REWARD CALCULATION
       *
       * Rewards are estimated using the last known mining start point.
       * Calculation may start from:
       *  - the last claim time
       *  - node restart
       *  - binary update
       *  - or network update
       *
       * Backend does not provide exact mining uptime.
       * Actual mined amount may differ from this value.
       */
      const startTs = node.lastClaimTime
        ? new Date(node.lastClaimTime).getTime() / 1000
        : new Date(node.lastMiningStart).getTime() / 1000;

      const miningSeconds = Math.max(0, now - startTs);

      const totalReward = BASE_SPEED * miningSeconds;
      const rewardPerDay = BASE_SPEED * 86400;

      return {
        ...node,
        freshness: getFreshness(node.nodeMetrics?.lastSeen),
        miningSeconds,
        totalReward,
        rewardPerDay,
      };
    });
  }, [nodes]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(n =>
      n.nodeId?.toLowerCase().includes(q) ||
      n.wallet?.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered
    .sort((a, b) => b.rewardPerDay - a.rewardPerDay)
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto p-6 text-white">
        <h1 className="text-2xl font-bold mb-6">Rewards</h1>

        {/* SEARCH */}
        <input
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by nodeId or wallet…"
          className="w-full mb-6 px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-sm"
        />

        {/* LIST */}
        <ul className="space-y-4">
          {visible.map(node => (
            <Link key={node._id} href={`/nodes/${node._id}`}>
              <li className="bg-neutral-900 p-5 rounded-lg border border-neutral-800 hover:border-neutral-600 transition">
                <div className="flex justify-between mb-2">
                  <div>
                    <div className="font-mono text-sm">{node.nodeId}</div>
                    <div className="text-xs text-neutral-500">
                      {node.wallet.slice(0, 6)}…{node.wallet.slice(-4)}
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded ${freshnessStyle(
                      node.freshness
                    )}`}
                  >
                    {node.freshness}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                  <div className="bg-neutral-800 p-2 rounded">
                    Mining Time
                    <div className="font-semibold">
                      {formatDuration(node.miningSeconds)}
                    </div>
                  </div>

                  <div className="bg-neutral-800 p-2 rounded">
                    Est. Reward
                    <Tooltip text={ESTIMATE_TOOLTIP_TEXT} />
                    <div className="font-semibold">
                      {node.totalReward.toFixed(4)}
                    </div>
                  </div>

                  <div className="bg-neutral-800 p-2 rounded">
                    Rate / Day
                    <div className="font-semibold">
                      {node.rewardPerDay.toFixed(4)}
                    </div>
                  </div>

                  <div className="bg-neutral-800 p-2 rounded">
                    Speed
                    <div className="font-semibold">
                      {node.nodeMetrics?.speed ?? 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-neutral-400 flex justify-between">
                  <span>Last Claim: {formatDate(node.lastClaimTime)}</span>
                  <span>
                    Mining Since:{' '}
                    {formatDate(node.lastClaimTime || node.lastMiningStart)}
                  </span>
                </div>
              </li>
            </Link>
          ))}
        </ul>

        {/* PAGINATION */}
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
