import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const Activities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const { toast, showToast, closeToast } = useToast();

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/activities?page=${page}&size=10`);
                setActivities(response.data);
                setHasMore(response.data.length === 10);
                setLoading(false);
            } catch (error) {
                showToast('Failed to fetch activities', 'error');
                setLoading(false);
            }
        };
        fetchActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const getActivityIcon = (description) => {
        const desc = description.toLowerCase()

        // Coins activities
        if (desc.includes('coin') && desc.includes('earned')) return '🪙'
        if (desc.includes('coin') && desc.includes('spent')) return '💰'
        if (desc.includes('coin')) return '🪙'

        // Farm activities
        if (desc.includes('farm') && (desc.includes('created') || desc.includes('added'))) return '🌾'
        if (desc.includes('farm') && desc.includes('updated')) return '✏️'
        if (desc.includes('farm') && desc.includes('deleted')) return '🗑️'
        if (desc.includes('farm')) return '🌾'

        // Crop activities
        if (desc.includes('crop') && (desc.includes('created') || desc.includes('added'))) return '🌱'
        if (desc.includes('crop') && desc.includes('updated')) return '✏️'
        if (desc.includes('crop') && desc.includes('deleted')) return '🗑️'
        if (desc.includes('crop')) return '🌱'

        // Product activities
        if (desc.includes('product') && desc.includes('listed')) return '📦'
        if (desc.includes('product') && desc.includes('updated')) return '✏️'
        if (desc.includes('product') && desc.includes('deleted')) return '🗑️'
        if (desc.includes('product')) return '📦'

        // Service activities
        if (desc.includes('service') && (desc.includes('created') || desc.includes('listed'))) return '🚜'
        if (desc.includes('service') && desc.includes('updated')) return '✏️'
        if (desc.includes('service') && desc.includes('deleted')) return '🗑️'
        if (desc.includes('service')) return '🔧'

        // Order activities
        if (desc.includes('order') && desc.includes('placed')) return '🛒'
        if (desc.includes('order') && desc.includes('confirmed')) return '✅'
        if (desc.includes('order') && desc.includes('cancelled')) return '❌'
        if (desc.includes('order')) return '🛒'

        // Irrigation activities
        if (desc.includes('irrigation') && (desc.includes('created') || desc.includes('scheduled'))) return '💧'
        if (desc.includes('irrigation') && desc.includes('updated')) return '✏️'
        if (desc.includes('irrigation') && desc.includes('deleted')) return '🗑️'
        if (desc.includes('irrigation')) return '💧'

        // Account activities
        if (desc.includes('password') && desc.includes('changed')) return '🔒'
        if (desc.includes('registered') || desc.includes('signed up')) return '👤'
        if (desc.includes('profile') && desc.includes('updated')) return '👤'

        // Default
        return '📝'
    }

    const getActivityColor = (description) => {
        const desc = description.toLowerCase()

        if (desc.includes('deleted') || desc.includes('cancelled')) return 'bg-red-100 text-red-600'
        if (desc.includes('updated') || desc.includes('changed')) return 'bg-yellow-100 text-yellow-600'
        if (desc.includes('created') || desc.includes('added') || desc.includes('listed') || desc.includes('earned')) return 'bg-green-100 text-green-600'
        if (desc.includes('confirmed') || desc.includes('placed')) return 'bg-blue-100 text-blue-600'

        return 'bg-gray-100 text-gray-600'
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now - date
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
        return 'Just now'
    }

    return (
        <>
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={closeToast} />
            )}
            <div className="space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Activities</h1>
                    <p className="text-gray-600 mt-1">Track all your recent actions and updates</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="spinner text-green-600 mb-4">
                                <svg className="animate-spin w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-600">Loading activities...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {activities.length > 0 ? (
                            <>
                                <div className="card">
                                    <div className="flow-root">
                                        <ul className="-mb-8">
                                            {activities.map((activity, idx) => (
                                                <li key={activity.id}>
                                                    <div className="relative pb-8">
                                                        {idx !== activities.length - 1 && (
                                                            <span
                                                                className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <div className="relative flex items-start space-x-3">
                                                            <div className="relative">
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.description)}`}>
                                                                    <span className="text-xl">{getActivityIcon(activity.description)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div>
                                                                    <div className="text-sm">
                                                                        <p className="font-semibold text-gray-900">{activity.description}</p>
                                                                    </div>
                                                                    <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                                                                        <span>🕒</span>
                                                                        {formatDate(activity.createdAt)}
                                                                    </p>
                                                                </div>
                                                                {activity.details && (
                                                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                                                        <p>{activity.details}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <button
                                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 0}
                                    >
                                        ← Previous
                                    </button>
                                    <span className="text-sm text-gray-600">Page {page + 1}</span>
                                    <button
                                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setPage(page + 1)}
                                        disabled={!hasMore}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="card text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-gray-600 text-lg">No activities yet.</p>
                                <p className="text-gray-500 text-sm mt-2">Start by creating farms, crops, or products!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default Activities;
