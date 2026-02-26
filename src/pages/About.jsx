import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  const stats = [
    { label: 'Active Farmers', value: '10,000+', icon: '👨‍🌾' },
    { label: 'Farms Managed', value: '25,000+', icon: '🌾' },
    { label: 'States Covered', value: '15+', icon: '📍' },
    { label: 'Products Sold', value: '100,000+', icon: '📦' }
  ];

  const team = [
    { name: 'Innovation', icon: '💡', description: 'Cutting-edge technology for modern farming' },
    { name: 'Sustainability', icon: '🌿', description: 'Eco-friendly practices for a greener future' },
    { name: 'Community', icon: '🤝', description: 'Building strong farmer networks' },
    { name: 'Quality', icon: '⭐', description: 'Premium products and services' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About FarmEazy</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Empowering farmers with smart technology for crop management, irrigation, and online agricultural marketplace.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Mission Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-8 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-slate-300 mb-4">
                At FarmEazy, we believe every farmer deserves access to technology that can transform their farming operations. Our platform bridges the gap between traditional farming and modern agricultural practices.
              </p>
              <p className="text-slate-300">
                From crop planning to marketplace selling, we provide end-to-end solutions that help farmers increase productivity, reduce waste, and maximize profits.
              </p>
            </div>
            <div className="text-center">
              <span className="text-9xl">🌱</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
              <span className="text-4xl mb-2 block">{stat.icon}</span>
              <p className="text-2xl font-bold text-green-400">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((value, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                <span className="text-5xl mb-4 block">{value.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{value.name}</h3>
                <p className="text-slate-400 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Join Our Growing Community</h2>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            Start your journey towards smarter farming today.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-slate-800 text-green-400 rounded-lg font-semibold hover:bg-slate-700 transition-colors border border-slate-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
