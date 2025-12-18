'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const COOLDOWN_SECONDS = 30;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

function formatMiningSpeedRaw(speedWei?: string) {
  if (!speedWei) return '—';
  const v = Number(speedWei) / 1e18;
  if (!v || isNaN(v)) return '—';

  // без округления, обрезаем хвост
  const str = v.toString();
  const [int, dec = ''] = str.split('.');
  return `${int}.${dec.slice(0, 8)} NPT/s`;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown(v => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function checkMining() {
    if (cooldown > 0 || loading) return;

    setError('');
    setData(null);

    if (!WALLET_REGEX.test(wallet)) {
      setError('Invalid wallet address format');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `https://node.netrumlabs.dev/mining/debug/contract/${wallet}`
      );
      const json = await res.json();

      if (!json?.success) {
        setError('Mining data not found for this wallet');
        return;
      }

      setData(json);
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  const miningInfo = data?.contract?.miningInfo;
  const miningActive = miningInfo?.isActive;
  const canClaim = data?.wallet?.hasMinBalance;

  return (
    <>
      <header className="border-b border-neutral-800 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-black/40 rounded p-1">
              <Image src="/logo.png" alt="NetrumLabs" width={40} height={40} />
            </div>
            <span className="font-bold text-lg">NetrumLabs</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm text-neutral-300">
            <Link href="/" className="hover:text-white">Dashboard</Link>
            <Link href="/rewards" className="hover:text-white">Rewards</Link>
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded bg-[#FF7A00] hover:bg-[#F17630] text-black font-medium"
            >
              Mining Status Checker
            </button>
          </nav>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div
            ref={modalRef}
            className="bg-black text-white rounded-lg p-6 w-full max-w-lg border border-neutral-800"
          >
            <h2 className="text-lg font-bold mb-4">Mining Status</h2>

            <input
              value={wallet}
              onChange={e => setWallet(e.target.value.trim())}
              onKeyDown={e => e.key === 'Enter' && checkMining()}
              placeholder="Wallet address (0x...)"
              className="w-full px-3 py-2 rounded mb-3 bg-black border border-neutral-700"
            />

            <button
              onClick={checkMining}
              disabled={cooldown > 0 || loading}
              className="w-full bg-[#FF7A00] hover:bg-[#F17630] text-black py-2 rounded mb-3 disabled:opacity-40 font-medium"
            >
              {cooldown > 0
                ? `Cooldown ${cooldown}s`
                : loading
                ? 'Checking…'
                : 'Check Mining Status'}
            </button>

            {error && (
              <div className="text-red-400 text-sm mb-3">{error}</div>
            )}

            {data && (
              <div className="text-sm space-y-2">
                <div><b>Network:</b> {data.network.networkName}</div>
                <div><b>Block Number:</b> {data.network.blockNumber}</div>
                <div><b>Gas Price:</b> {data.network.gasPriceGwei} Gwei</div>

                <div>
                  <b>Contract:</b>
                  <div className="break-all text-xs">{data.contract.address}</div>
                </div>

                <div className="flex items-center gap-2">
                  <b>Mining:</b>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    miningActive
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-red-600/20 text-red-400'
                  }`}>
                    {miningActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <b>Mining Speed:</b>{' '}
                  {formatMiningSpeedRaw(miningInfo?.speedPerSec)}
                </div>

                <div>
                  <b>Time Remaining:</b>{' '}
                  {miningInfo?.timeRemainingHours > 0
                    ? `${miningInfo.timeRemainingHours.toFixed(2)} h`
                    : 'Completed'}
                </div>

                <div>
                  <b>Progress:</b>{' '}
                  {miningInfo?.percentCompleteNumber / 100}%
                </div>

                <div>
                  <b>Mined Tokens:</b>{' '}
                  {Number(miningInfo?.minedTokensFormatted).toFixed(2)} NPT
                </div>

                <div>
                  <b>Wallet Balance:</b> {data.wallet.currentBalance}
                </div>

                <div>
                  <b>ETH Balance:</b>{' '}
                  <span className={canClaim ? 'text-green-400' : 'text-yellow-400'}>
                    {canClaim ? 'OK for claim' : 'Not enough for claim'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
