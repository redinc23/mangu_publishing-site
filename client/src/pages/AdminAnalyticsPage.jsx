import React, { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/admin/analytics');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040404] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#040404] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Analytics</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentOrders, topBooks } = analytics || {};

  return (
    <div className="min-h-screen bg-[#040404] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-white/60">Monitor your platform's performance and metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-blue-400 text-3xl">👥</div>
              <div className="text-xs uppercase tracking-wider text-blue-300/60">Users</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalUsers?.toLocaleString() || 0}</div>
            <div className="text-sm text-white/60">Total registered users</div>
          </div>

          {/* Total Books */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-purple-400 text-3xl">📚</div>
              <div className="text-xs uppercase tracking-wider text-purple-300/60">Books</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalBooks?.toLocaleString() || 0}</div>
            <div className="text-sm text-white/60">Books in catalog</div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-green-400 text-3xl">🛒</div>
              <div className="text-xs uppercase tracking-wider text-green-300/60">Orders</div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.totalOrders?.toLocaleString() || 0}</div>
            <div className="text-sm text-white/60">Completed orders</div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-yellow-400 text-3xl">💰</div>
              <div className="text-xs uppercase tracking-wider text-yellow-300/60">Revenue</div>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <div className="text-sm text-white/60">Total earnings</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>
            
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold">{order.userName || order.userEmail || 'Unknown User'}</div>
                        <div className="text-sm text-white/60">{order.userEmail}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">{formatCurrency(order.totalCents)}</div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            order.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {order.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">{formatDate(order.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <div className="text-4xl mb-3">📭</div>
                <p>No orders yet</p>
              </div>
            )}
          </div>

          {/* Top Selling Books */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Top Selling Books</h2>
            
            {topBooks && topBooks.length > 0 ? (
              <div className="space-y-4">
                {topBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate mb-1">{book.title}</div>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>{formatCurrency(book.priceCents)}</span>
                          <span>•</span>
                          <span>{book.totalSold} sold</span>
                          <span>•</span>
                          <span>{book.orderCount} orders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/40">
                <div className="text-4xl mb-3">📚</div>
                <p>No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition font-semibold"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
