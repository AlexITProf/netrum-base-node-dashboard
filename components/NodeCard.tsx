'use client';

import Link from 'next/link';

type NodeCardProps = {
  node: any;
};

export default function NodeCard({ node }: NodeCardProps) {
  const isActive = node.nodeStatus === 'Active';

  return (
    <Link href={`/nodes/${node._id}`} className="block">
      <div
        className="
          group relative rounded-2xl
          border border-neutral-800 bg-neutral-900
          p-5 transition
          hover:border-neutral-600 hover:shadow-lg
        "
      >
        {/* STATUS STRIP */}
        <div
          className={`
            absolute left-0 top-0 h-full w-1 rounded-l-2xl
            ${isActive ? 'bg-emerald-500' : 'bg-red-500'}
          `}
        />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/* Base Node Name */}
            <span className="font-mono text-sm font-medium text-neutral-200 break-all">
              {node.nodeId}
            </span>

            {/* Internal Node ID */}
            <span className="text-xs text-neutral-500 break-all">
              Node ID: {node._id}
            </span>
          </div>

          {/* STATUS BADGE */}
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap
              ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'bg-red-600/20 text-red-400'
              }
            `}
          >
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* METRICS */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="CPU" value={node.cpu} />
          <Metric label="RAM" value={node.ram} />
          <Metric label="DISK" value={node.disk} />
        </div>

        {/* WALLET */}
        <div className="mt-3 text-xs text-neutral-400 break-all">
          Wallet: {shorten(node.wallet)}
        </div>

        {/* FOOTER */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Uptime: N/A</span>

          <span className="opacity-0 transition group-hover:opacity-100">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ================= helpers ================= */

function shorten(str?: string, chars = 6) {
  if (!str) return '—';
  return `${str.slice(0, chars)}…${str.slice(-chars)}`;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  if (value == null) {
    return (
      <div className="rounded-lg bg-neutral-800 p-2 text-xs text-neutral-500">
        <div>{label}</div>
        <div className="italic">N/A</div>
      </div>
    );
  }

  const level =
    value > 85 ? 'danger' : value > 70 ? 'warning' : 'ok';

  const color = {
    ok: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  }[level];

  return (
    <div className="rounded-lg bg-neutral-800 p-2 text-xs">
      <div className="text-neutral-500">{label}</div>
      <div className={`text-sm font-semibold ${color}`}>
        {value}%
      </div>
    </div>
  );
}
