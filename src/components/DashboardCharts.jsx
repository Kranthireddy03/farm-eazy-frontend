import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function DashboardCharts({ stats }) {
  // Example data, replace with real stats
  const barData = {
    labels: ['Farms', 'Crops', 'Irrigations', 'Products'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalFarms, stats.totalCrops, stats.totalIrrigations, stats.totalProducts],
        backgroundColor: ['#34d399', '#60a5fa', '#06b6d4', '#fbbf24'],
      },
    ],
  };

  const pieData = {
    labels: ['Farms', 'Crops', 'Irrigations', 'Products'],
    datasets: [
      {
        data: [stats.totalFarms, stats.totalCrops, stats.totalIrrigations, stats.totalProducts],
        backgroundColor: ['#34d399', '#60a5fa', '#06b6d4', '#fbbf24'],
      },
    ],
  };

  return (
    <div className="my-8">
      <h3 className="text-xl font-bold mb-4 text-white">Farm Overview Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow p-4">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} aria-label="Farm stats bar chart" />
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow p-4">
          <Pie data={pieData} options={{ responsive: true }} aria-label="Farm stats pie chart" />
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
