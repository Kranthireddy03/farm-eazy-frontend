import React from 'react';
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

export default function LandingHome() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-100 dark:from-slate-900 dark:to-slate-950">
      {/* NAVBAR */}
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white dark:bg-slate-900 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/farm-eazy.png" alt="FarmEazy Logo" className="h-10 drop-shadow" />
          <span className="text-2xl font-extrabold tracking-tight text-green-700 dark:text-green-400">FarmEazy</span>
        </div>
        <nav className="flex gap-6">
          <Link to="/" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Home</Link>
          <Link to="/about" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">About</Link>
          <Link to="/public-services" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Platform Overview</Link>
          <Link to="/blog" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Blog</Link>
          <Link to="/support" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">FAQ / Support</Link>
          <Link to="/contact" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Contact</Link>
          <Link to="/login" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Login</Link>
          <Link to="/register" className="font-semibold text-green-700 dark:text-green-400 hover:underline text-lg">Register</Link>
        </nav>
      </header>
      <DarkModeToggle floating />

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center py-20 bg-gradient-to-r from-green-100 to-blue-50 dark:from-slate-900 dark:to-slate-950">
        <h1 className="text-5xl font-extrabold text-green-700 dark:text-green-400 mb-4">FarmEazy</h1>
        <h2 className="text-2xl font-semibold text-blue-700 dark:text-blue-300 mb-6">Smart Farm Management for Everyone</h2>
        <p className="text-lg text-gray-700 dark:text-slate-300 mb-8 max-w-xl text-center">
          FarmEazy empowers farmers and agri-businesses to manage their farms, crops, irrigation, and marketplace with ease. Explore features, connect with the community, and grow your farm smarter.
        </p>
        <div className="flex gap-6 mb-8">
          <Link to="/register" className="px-6 py-3 rounded-lg bg-green-700 text-white font-bold text-lg shadow hover:bg-green-800 transition">Register</Link>
          <Link to="/login" className="px-6 py-3 rounded-lg bg-blue-500 text-white font-bold text-lg shadow hover:bg-blue-600 transition">Login</Link>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h3 className="text-3xl font-bold text-center text-green-700 dark:text-green-400 mb-8">Platform Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition">
            <span className="text-4xl mb-3">🌱</span>
            <h4 className="text-xl font-semibold mb-2">Crop Tracking</h4>
            <p className="text-gray-600 dark:text-slate-300 text-center">Monitor crop growth, health, and yield with smart analytics.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition">
            <span className="text-4xl mb-3">💧</span>
            <h4 className="text-xl font-semibold mb-2">Irrigation Scheduling</h4>
            <p className="text-gray-600 dark:text-slate-300 text-center">Automate and optimize irrigation for maximum efficiency.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition">
            <span className="text-4xl mb-3">🛒</span>
            <h4 className="text-xl font-semibold mb-2">Marketplace</h4>
            <p className="text-gray-600 dark:text-slate-300 text-center">Buy and sell products, connect with buyers and sellers.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition">
            <span className="text-4xl mb-3">📊</span>
            <h4 className="text-xl font-semibold mb-2">Farm Analytics Dashboard</h4>
            <p className="text-gray-600 dark:text-slate-300 text-center">Visualize farm performance and make data-driven decisions.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center hover:shadow-lg transition">
            <span className="text-4xl mb-3">🤝</span>
            <h4 className="text-xl font-semibold mb-2">Farmer Support & Community</h4>
            <p className="text-gray-600 dark:text-slate-300 text-center">Get help, share knowledge, and connect with other farmers.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-center text-blue-700 dark:text-blue-300 mb-8">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">📝</span>
            <h4 className="font-semibold mb-1">Register an account</h4>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">🏡</span>
            <h4 className="font-semibold mb-1">Add your farm and crops</h4>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">💧</span>
            <h4 className="font-semibold mb-1">Manage irrigation and products</h4>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-3xl mb-2">🌾</span>
            <h4 className="font-semibold mb-1">Buy, sell, and grow your farm</h4>
          </div>
        </div>
      </section>

      {/* EXPLORE WITHOUT LOGIN SECTION */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-center text-green-700 dark:text-green-400 mb-6">Explore Without Login</h3>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/about" className="px-5 py-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold shadow hover:bg-green-200 dark:hover:bg-green-800 transition">About</Link>
          <Link to="/blog" className="px-5 py-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold shadow hover:bg-blue-200 dark:hover:bg-blue-800 transition">Blog</Link>
          <Link to="/support" className="px-5 py-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-semibold shadow hover:bg-yellow-200 dark:hover:bg-yellow-800 transition">FAQ</Link>
          <Link to="/contact" className="px-5 py-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-semibold shadow hover:bg-gray-200 dark:hover:bg-gray-800 transition">Contact</Link>
          <Link to="/support" className="px-5 py-3 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-semibold shadow hover:bg-orange-200 dark:hover:bg-orange-800 transition">Support</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-6 px-8 bg-white dark:bg-slate-900 text-center text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto gap-4">
          <div>
            <span>Contact: </span>
            <a href="mailto:support@farm-eazy.com" className="hover:underline text-green-700 dark:text-green-400">support@farm-eazy.com</a>
            <span className="mx-2">|</span>
            <span>+91-9876543210</span>
          </div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
            <Link to="/shipping-policy" className="hover:underline">Shipping Policy</Link>
            <Link to="/marketplace-disclosure" className="hover:underline">Marketplace Disclosure</Link>
          </div>
        </div>
        <div className="mt-4 text-xs">&copy; {new Date().getFullYear()} FarmEazy. All rights reserved.</div>
      </footer>
    </div>
  );
}
