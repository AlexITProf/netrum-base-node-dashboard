type RewardDetailProps = {
  speed?: number;
  miningSeconds: number;
};

const BASE_SPEED = 0.00004293;
const REWARD_NORMALIZER = 10;

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function RewardDetailBlock({
  speed,
  miningSeconds,
}: RewardDetailProps) {
  const speedMult = (speed ?? 0) / 5;
  const rewardPerSecond =
    (BASE_SPEED * speedMult) / REWARD_NORMALIZER;

  const totalReward = rewardPerSecond * miningSeconds;
  const rewardPerDay = rewardPerSecond * 86400;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold">Rewards</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-neutral-400">Speed</div>
          <div className="font-semibold">{speed ?? '—'}</div>
        </div>

        <div>
          <div className="text-neutral-400">Mining Time</div>
          <div className="font-semibold">
            {formatDuration(miningSeconds)}
          </div>
        </div>

        <div>
          <div className="text-neutral-400">
            Estimated Reward (calc.)
          </div>
          <div className="font-semibold">
            {totalReward.toFixed(4)}
          </div>
        </div>

        <div>
          <div className="text-neutral-400">
            Rate / Day (calc.)
          </div>
          <div className="font-semibold">
            {rewardPerDay.toFixed(4)}
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Calculated value based on current network rewards.
        Actual claimable amount may differ.
      </p>
    </div>
  );
}
