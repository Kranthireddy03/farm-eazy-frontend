export default function SupportModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-bold">Contact Support</h2>
        <p className="mt-2 text-sm text-slate-600">
          Call or email us and we’ll help you get going.
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold">Phone</p>
            <p className="text-sm">6301630368</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold">Email</p>
            <p className="text-sm">support@farm-eazy.com</p>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-white"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
