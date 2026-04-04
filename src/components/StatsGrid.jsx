export default function StatsGrid({ stats, statsLoading, coinsLoading, coins, onRefreshCoins }) {
  return (
    <section className="grid gap-6 md:grid-cols-4">
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Active Farms</p>
        <p className="mt-2 text-3xl font-bold">{statsLoading ? "..." : stats.totalFarms}</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Products Listed</p>
        <p className="mt-2 text-3xl font-bold">{statsLoading ? "..." : stats.totalProducts}</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Services</p>
        <p className="mt-2 text-3xl font-bold">{statsLoading ? "..." : stats.totalServices}</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-slate-500">Coins</p>
        <p className="mt-2 text-3xl font-bold">
          {coinsLoading ? "..." : coins?.totalCoins ?? 0}
        </p>
        <button
          className="mt-3 text-sm text-blue-600 hover:underline"
          onClick={onRefreshCoins}
        >
          Refresh
        </button>
      </div>
    </section>
  );
}
