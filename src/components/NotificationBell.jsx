import React, { useState } from 'react';

function NotificationBell({ notifications = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full bg-slate-700 shadow hover:bg-slate-600 focus:outline-none border border-slate-600"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50">
          <div className="p-4 border-b border-slate-700 font-bold text-white">Notifications</div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-slate-400 text-center">No notifications</li>
            ) : (
              notifications.map((n, idx) => (
                <li key={idx} className="p-4 border-b border-slate-700 last:border-b-0 text-sm text-slate-300">
                  {n.message}
                  <div className="text-xs text-slate-500 mt-1">{n.time}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
