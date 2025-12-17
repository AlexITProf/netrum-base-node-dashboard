import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b border-neutral-800 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-black/40 rounded p-1 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="NetrumLabs"
              width={40}
              height={40}
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
          <span className="font-bold text-lg">NetrumLabs</span>
        </Link>

        <nav className="flex gap-6 text-sm text-neutral-300">
          <Link href="/" className="hover:text-white">
            Dashboard
          </Link>
          <Link href="/rewards" className="hover:text-white">
            Rewards
          </Link>
        </nav>
      </div>
    </header>
  );
}
