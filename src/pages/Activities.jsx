import React, { useEffect, useState } from 'react';
import { api } from '../config/api';
import Layout from '../components/Layout';
import { useToast } from '../hooks/useToast';

const Activities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/activities?page=${page}&size=5`);
                setActivities(response.data);
                setHasMore(response.data.length === 5);
                setLoading(false);
            } catch (error) {
                showToast('Failed to fetch activities', 'error');
                setLoading(false);
            }
        };
        fetchActivities();
    }, [page, showToast]);

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">My Activities</h1>
                {loading ? (
                    <p>Loading activities...</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg p-6">
                        {activities.length > 0 ? (
                            <>
                                <ul className="divide-y divide-gray-200">
                                    {activities.map((activity) => (
                                        <li key={activity.id} className="py-4">
                                            <div className="flex space-x-3">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-medium">{activity.description}</h3>
                                                        <p className="text-sm text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{activity.details}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between mt-6">
                                    <button
                                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 0}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                                        onClick={() => setPage(page + 1)}
                                        disabled={!hasMore}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p>No activities found.</p>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Activities;
