import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const Activities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [filter, setFilter] = useState('all'); // all, coins, farm, product, service, order
    const { toast, showToast, closeToast } = useToast();

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/activities?page=${page}&size=20`);
                // Filter out login activities
                const filtered = response.data.filter(activity => {
                    const desc = activity.description.toLowerCase();
                    return !desc.includes('logged in') && !desc.includes('login');
                });
                setActivities(filtered);
                setHasMore(response.data.length === 20);
                setLoading(false);
            } catch (error) {
                showToast('Failed to fetch activities', 'error');
                setLoading(false);
            }
        };
        fetchActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const getActivityCategory = (description) => {
        const desc = description.toLowerCase();
        if (desc.includes('coin')) return 'Coins';
        if (desc.includes('farm')) return 'Farm';
        if (desc.includes('crop')) return 'Crop';
        if (desc.includes('product')) return 'Product';
        if (desc.includes('service') || desc.includes('irrigation')) return 'Service';
        if (desc.includes('order')) return 'Order';
        if (desc.includes('password')) return 'Security';
        if (desc.includes('registered') || desc.includes('profile')) return 'Account';
        return 'Other';
    };

    const getActivityType = (description) => {
        const desc = description.toLowerCase();
        if (desc.includes('created') || desc.includes('added') || desc.includes('listed') || desc.includes('registered')) return 'Created';
        if (desc.includes('updated') || desc.includes('changed') || desc.includes('edited')) return 'Updated';
        if (desc.includes('deleted') || desc.includes('removed')) return 'Deleted';
        if (desc.includes('placed') || desc.includes('ordered')) return 'Placed';
        if (desc.includes('confirmed')) return 'Confirmed';
        if (desc.includes('cancelled')) return 'Cancelled';
        if (desc.includes('earned') || desc.includes('received')) return 'Earned';
        if (desc.includes('spent') || desc.includes('used')) return 'Spent';
        return 'Action';
    };

    const getActivityIcon = (category) => {
        switch(category) {
            case 'Coins': return '🪙';
            case 'Farm': return '🌾';
            case 'Crop': return '🌱';
            case 'Product': return '📦';
            case 'Service': return '🚜';
            case 'Order': return '🛒';
            case 'Security': return '🔒';
            case 'Account': return '👤';
            default: return '📝';
        }
    };

    const getTypeColor = (type) => {
        switch(type) {
            case 'Created': return 'bg-green-900/50 text-green-400 border-green-700';
            case 'Updated': return 'bg-blue-900/50 text-blue-400 border-blue-700';
            case 'Deleted': return 'bg-red-900/50 text-red-400 border-red-700';
            case 'Placed': return 'bg-purple-900/50 text-purple-400 border-purple-700';
            case 'Confirmed': return 'bg-teal-900/50 text-teal-400 border-teal-700';
            case 'Cancelled': return 'bg-orange-900/50 text-orange-400 border-orange-700';
            case 'Earned': return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
            case 'Spent': return 'bg-pink-900/50 text-pink-400 border-pink-700';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    const getCategoryColor = (category) => {
        switch(category) {
            case 'Coins': return 'bg-yellow-900/40 text-yellow-400 border-yellow-700';
            case 'Farm': return 'bg-green-900/40 text-green-400 border-green-700';
            case 'Crop': return 'bg-lime-900/40 text-lime-400 border-lime-700';
            case 'Product': return 'bg-blue-900/40 text-blue-400 border-blue-700';
            case 'Service': return 'bg-purple-900/40 text-purple-400 border-purple-700';
            case 'Order': return 'bg-orange-900/40 text-orange-400 border-orange-700';
            case 'Security': return 'bg-red-900/40 text-red-400 border-red-700';
            case 'Account': return 'bg-indigo-900/40 text-indigo-400 border-indigo-700';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return {
            date: `${day}/${month}/${year}`,
            time: `${hours}:${minutes}:${seconds}`
        };
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => getActivityCategory(a.description).toLowerCase() === filter.toLowerCase());

    return (
        <>
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={closeToast} />
            )}
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <span className="text-5xl">📊</span>
                                Activity Timeline
                            </h1>
                            <p className="text-green-100 text-lg">Track your farming operations and transactions</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">{filteredActivities.length}</div>
                            <div className="text-green-100 text-sm">Total Activities</div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-md p-2 overflow-x-auto">
                    <div className="flex gap-2">
                        {['all', 'coins', 'farm', 'crop', 'product', 'service', 'order'].map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={`px-6 py-3 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                    filter === filterType
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-96 bg-slate-800 border border-slate-700 rounded-xl shadow-md">
                        <div className="text-center">
                            <div className="spinner text-green-500 mb-4">
                                <svg className="animate-spin w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-slate-400 text-lg">Loading your activities...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {filteredActivities.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden lg:block bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-700">
                                            <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Icon
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Category
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Activity Description
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Action Type
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                        Time
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-slate-800 divide-y divide-slate-700">
                                                {filteredActivities.map((activity, idx) => {
                                                    const category = getActivityCategory(activity.description);
                                                    const type = getActivityType(activity.description);
                                                    const dateTime = formatDateTime(activity.createdAt);

                                                    return (
                                                        <tr
                                                            key={activity.id}
                                                            className={`hover:bg-slate-700 transition-colors ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}`}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-900/50 to-green-800/50 shadow-sm">
                                                                    <span className="text-2xl">{getActivityIcon(category)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getCategoryColor(category)}`}>
                                                                    {category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-medium text-white">
                                                                    {activity.description}
                                                                </div>
                                                                {activity.details && (
                                                                    <div className="text-xs text-slate-400 mt-1">
                                                                        {activity.details}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getTypeColor(type)}`}>
                                                                    {type}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                    <span className="text-lg">📅</span>
                                                                    <span className="font-mono font-medium">{dateTime.date}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                    <span className="text-lg">⏰</span>
                                                                    <span className="font-mono font-medium">{dateTime.time}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden space-y-4">
                                    {filteredActivities.map((activity) => {
                                        const category = getActivityCategory(activity.description);
                                        const type = getActivityType(activity.description);
                                        const dateTime = formatDateTime(activity.createdAt);

                                        return (
                                            <div key={activity.id} className="bg-slate-800 border border-slate-700 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                                <div className="p-5 space-y-4">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-900/50 to-green-800/50 shadow-sm">
                                                                <span className="text-2xl">{getActivityIcon(category)}</span>
                                                            </div>
                                                            <div>
                                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(category)}`}>
                                                                    {category}
                                                                </span>
                                                                <div className="mt-1">
                                                                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-lg border ${getTypeColor(type)}`}>
                                                                        {type}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {activity.description}
                                                        </p>
                                                        {activity.details && (
                                                            <p className="text-xs text-slate-400 mt-1 bg-slate-700 p-2 rounded">
                                                                {activity.details}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Date & Time */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <span>📅</span>
                                                            <span className="font-mono font-medium">{dateTime.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <span>⏰</span>
                                                            <span className="font-mono font-medium">{dateTime.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-md p-6">
                                    <div className="flex justify-between items-center">
                                        <button
                                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 0}
                                        >
                                            <span>←</span>
                                            Previous
                                        </button>
                                        <div className="text-center">
                                            <div className="text-sm font-medium text-slate-300">Page {page + 1}</div>
                                            <div className="text-xs text-slate-500">{filteredActivities.length} activities</div>
                                        </div>
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            onClick={() => setPage(page + 1)}
                                            disabled={!hasMore}
                                        >
                                            Next
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-12 text-center">
                                <div className="text-8xl mb-6">📭</div>
                                <h3 className="text-2xl font-bold text-white mb-2">No Activities Found</h3>
                                <p className="text-slate-300 mb-1">
                                    {filter !== 'all'
                                        ? `No ${filter} activities to display.`
                                        : 'Start using FarmEazy to see your activities here!'}
                                </p>
                                <p className="text-slate-400 text-sm">
                                    Activities like creating farms, adding crops, or placing orders will appear here.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Activities;
