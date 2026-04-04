import React from 'react';

export default function PublicHome() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-900 dark:to-slate-950">
      {/* HEADER */}
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white dark:bg-slate-900 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="FarmEazy Logo" className="h-12 drop-shadow" />
          <span className="text-3xl font-extrabold tracking-tight text-blue-700 dark:text-green-400">FarmEazy</span>
        </div>
        <nav className="flex gap-8">
          <a href="/support" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">FAQ & Support</a>
          <a href="/ask-question" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">Ask a Question</a>
          <a href="/register" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">Register</a>
          <a href="/login" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">Login</a>
          <a href="/about" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">About</a>
          <a href="/contact" className="font-semibold text-blue-700 dark:text-green-400 hover:underline text-lg">Contact</a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
        <h1 className="text-4xl font-extrabold text-blue-700 dark:text-green-400 mb-6">Welcome to FarmEazy</h1>
        <p className="text-lg text-gray-700 dark:text-slate-300 mb-8 max-w-xl text-center">
          Manage your farm, crops, and irrigation with ease. Register or login to access full features. Explore our FAQ, ask questions, or contact us for support.
        </p>
        <div className="flex gap-6">
          <a href="/register" className="px-6 py-3 rounded-lg bg-blue-700 text-white font-bold text-lg shadow hover:bg-blue-800 transition">Register</a>
          <a href="/login" className="px-6 py-3 rounded-lg bg-green-500 text-white font-bold text-lg shadow hover:bg-green-600 transition">Login</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-4 px-8 bg-white dark:bg-slate-900 text-center text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700">
        &copy; {new Date().getFullYear()} FarmEazy. All rights reserved.
      </footer>
    </div>
  );
}
