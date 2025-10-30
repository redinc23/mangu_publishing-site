'use client';

import Nav from '@/components/Nav';
import { useState } from 'react';
import Link from 'next/link';

type Section = 'profile' | 'preferences' | 'security' | 'notifications' | 'privacy' | 'billing';

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [notifications, setNotifications] = useState({
    newReleases: true,
    readingReminders: true,
    recommendations: false,
    socialActivity: true,
    downloadComplete: true,
    readingGoals: true
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    readingActivity: true,
    bookReviews: false,
    usageAnalytics: true,
    personalizedAds: false
  });
  const [showNotification, setShowNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setShowNotification({ message: 'Settings updated successfully', type: 'success' });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
    setShowNotification({ message: 'Privacy settings updated', type: 'success' });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const sections = [
    { id: 'profile' as Section, icon: '👤', label: 'Profile' },
    { id: 'preferences' as Section, icon: '⚙️', label: 'Preferences' },
    { id: 'security' as Section, icon: '🛡️', label: 'Security' },
    { id: 'notifications' as Section, icon: '🔔', label: 'Notifications' },
    { id: 'privacy' as Section, icon: '👁️', label: 'Privacy' },
    { id: 'billing' as Section, icon: '💳', label: 'Billing' }
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/8 py-4">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-[22px] font-black tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent no-underline">
            MANGU
          </Link>
          <nav className="hidden md:flex items-center gap-2 text-sm text-[#b8b8b8] font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-xs opacity-70">›</span>
            <span>Profile & Settings</span>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-[#b8b8b8] text-base cursor-pointer p-2 rounded-full transition-colors hover:text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center">
              🔔
            </button>
            <button className="text-[#b8b8b8] text-base cursor-pointer p-2 rounded-full transition-colors hover:text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center">
              🔍
            </button>
            <button className="text-[#b8b8b8] text-base cursor-pointer p-2 rounded-full transition-colors hover:text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center">
              🛒
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="bg-[#1e1e1e]/60 backdrop-blur-xl border border-white/8 rounded-xl p-6 h-fit lg:sticky lg:top-[100px]">
          <div className="text-center mb-6 pb-6 border-b border-white/8">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center text-2xl font-bold text-white relative overflow-hidden">
                A
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-orange-500 border-2 border-[#0a0a0a] flex items-center justify-center cursor-pointer text-xs text-white transition-all hover:scale-110 hover:bg-orange-600">
                ✚
              </button>
            </div>
            <h3 className="text-lg font-bold mb-1">Alex Chen</h3>
            <p className="text-sm text-[#b8b8b8] font-medium">alex.chen@email.com</p>
          </div>

          <nav>
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-[15px] ${
                      activeSection === section.id
                        ? 'bg-orange-500/15 text-white'
                        : 'text-[#b8b8b8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="w-5 text-center text-sm">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="bg-[#1e1e1e]/60 backdrop-blur-xl border border-white/8 rounded-xl overflow-hidden">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Profile</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Manage your personal information and reading preferences</p>
              </div>
              <div className="p-7">
                {/* Reading Stats */}
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Reading Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { number: '127', label: 'Books Read' },
                      { number: '2.4k', label: 'Hours Listened' },
                      { number: '89', label: 'Reading Streak' },
                      { number: '15', label: 'Genres Explored' }
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/5 border border-white/8 rounded-xl p-4 text-center transition-all hover:bg-white/8 hover:-translate-y-0.5">
                        <div className="text-[28px] font-extrabold mb-1 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
                          {stat.number}
                        </div>
                        <div className="text-[13px] text-[#b8b8b8] font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">First Name</label>
                      <input type="text" defaultValue="Alex" className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Last Name</label>
                      <input type="text" defaultValue="Chen" className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email Address</label>
                      <input type="email" defaultValue="alex.chen@email.com" className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phone Number</label>
                      <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea
                      defaultValue="Avid reader and book enthusiast. Love discovering new authors and sharing great stories with friends."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)] resize-y"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,119,0,0.3)]">
                    💾 Save Changes
                  </button>
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-white/10 hover:border-orange-500">
                    ↶ Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Preferences</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Customize your reading experience</p>
              </div>
              <div className="p-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      title: '📖 Reading Preferences',
                      fields: [
                        { label: 'Preferred Format', options: ['E-book', 'Audiobook', 'Both'], default: 'Audiobook' },
                        { label: 'Reading Speed', options: ['Slow (0.75x)', 'Normal (1x)', 'Fast (1.25x)', 'Very Fast (1.5x)'], default: 'Normal (1x)' }
                      ]
                    },
                    {
                      title: '🎨 Display Settings',
                      fields: [
                        { label: 'Theme', options: ['Dark', 'Light', 'Auto'], default: 'Dark' },
                        { label: 'Font Size', options: ['Small', 'Medium', 'Large', 'Extra Large'], default: 'Medium' }
                      ]
                    },
                    {
                      title: '🌍 Language & Region',
                      fields: [
                        { label: 'Language', options: ['English', 'Spanish', 'French', 'German'], default: 'English' },
                        { label: 'Time Zone', options: ['Pacific Time (PT)', 'Eastern Time (ET)', 'Central Time (CT)', 'Mountain Time (MT)'], default: 'Pacific Time (PT)' }
                      ]
                    },
                    {
                      title: '⬇️ Download Settings',
                      fields: [
                        { label: 'Auto-Download', options: ['Never', 'Wi-Fi Only', 'Always'], default: 'Wi-Fi Only' },
                        { label: 'Download Quality', options: ['Standard', 'High', 'Ultra'], default: 'High' }
                      ]
                    }
                  ].map((card) => (
                    <div key={card.title} className="bg-white/5 border border-white/8 rounded-xl p-4 transition-all hover:bg-white/8 hover:border-orange-500">
                      <div className="font-bold mb-3 flex items-center gap-2 text-[15px]">
                        <span>{card.title.split(' ')[0]}</span>
                        <span>{card.title.split(' ').slice(1).join(' ')}</span>
                      </div>
                      {card.fields.map((field) => (
                        <div key={field.label} className="mb-4 last:mb-0">
                          <label className="block text-sm font-semibold mb-2">{field.label}</label>
                          <select className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-lg text-white text-sm transition-all focus:outline-none focus:border-orange-500 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(255,119,0,0.1)]">
                            {field.options.map((opt) => (
                              <option key={opt} value={opt} selected={opt === field.default}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,119,0,0.3)]">
                  💾 Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Security</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Manage your account security and access</p>
              </div>
              <div className="p-7">
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Account Security</h2>
                  <div className="space-y-0">
                    {[
                      { title: 'Password', desc: 'Last updated 2 months ago', action: 'Change Password' },
                      { title: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account', action: 'Enable', status: 'Disabled' },
                      { title: 'Login Alerts', desc: 'Get notified when someone logs into your account', status: 'Enabled', enabled: true },
                      { title: 'Active Sessions', desc: 'Manage devices that are signed into your account', action: 'View Sessions' }
                    ].map((item) => (
                      <div key={item.title} className="flex justify-between items-center py-4 border-b border-white/8 last:border-b-0">
                        <div className="flex-1 pr-4">
                          <div className="font-semibold text-sm mb-1">{item.title}</div>
                          <div className="text-[13px] text-[#b8b8b8] leading-relaxed">{item.desc}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.status && (
                            <div className={`flex items-center gap-1.5 text-[13px] font-medium ${item.enabled ? 'text-orange-500' : 'text-gray-400'}`}>
                              {item.enabled ? '✅' : '❌'}
                              {item.status}
                            </div>
                          )}
                          {item.action && (
                            <button className="px-4 py-2 bg-white/5 border border-white/8 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-white/10 hover:border-orange-500">
                              {item.action}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase text-red-400">Danger Zone</h2>
                  <div className="flex justify-between items-center py-4 border-b border-white/8">
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-sm mb-1">Delete Account</div>
                      <div className="text-[13px] text-[#b8b8b8] leading-relaxed">Permanently delete your account and all data</div>
                    </div>
                    <button className="px-4 py-2 bg-[#ef4444] rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-[#dc2626] hover:-translate-y-0.5">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Notifications</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Choose what notifications you want to receive</p>
              </div>
              <div className="p-7">
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Email Notifications</h2>
                  {[
                    { key: 'newReleases' as const, title: 'New Book Releases', desc: 'Get notified about new books from your favorite authors' },
                    { key: 'readingReminders' as const, title: 'Reading Reminders', desc: 'Daily reminders to continue your reading streak' },
                    { key: 'recommendations' as const, title: 'Recommendations', desc: 'Personalized book recommendations based on your reading history' },
                    { key: 'socialActivity' as const, title: 'Social Activity', desc: 'When friends add new books or write reviews' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-3.5 border-b border-white/8">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-sm mb-1">{item.title}</div>
                        <div className="text-[13px] text-[#b8b8b8] leading-relaxed">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          notifications[item.key] ? 'bg-orange-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Push Notifications</h2>
                  {[
                    { key: 'downloadComplete' as const, title: 'Download Complete', desc: 'When your book downloads are finished' },
                    { key: 'readingGoals' as const, title: 'Reading Goals', desc: 'Progress updates on your reading goals' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-3.5 border-b border-white/8">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-sm mb-1">{item.title}</div>
                        <div className="text-[13px] text-[#b8b8b8] leading-relaxed">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          notifications[item.key] ? 'bg-orange-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Privacy</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Control your privacy and data sharing preferences</p>
              </div>
              <div className="p-7">
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Profile Visibility</h2>
                  {[
                    { key: 'publicProfile' as const, title: 'Public Profile', desc: 'Allow others to find and view your profile' },
                    { key: 'readingActivity' as const, title: 'Reading Activity', desc: 'Show your reading activity to friends' },
                    { key: 'bookReviews' as const, title: 'Book Reviews', desc: 'Make your book reviews visible to other users' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-3.5 border-b border-white/8">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-sm mb-1">{item.title}</div>
                        <div className="text-[13px] text-[#b8b8b8] leading-relaxed">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => togglePrivacy(item.key)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          privacy[item.key] ? 'bg-orange-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            privacy[item.key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Data & Analytics</h2>
                  {[
                    { key: 'usageAnalytics' as const, title: 'Usage Analytics', desc: 'Help improve MANGU by sharing anonymous usage data' },
                    { key: 'personalizedAds' as const, title: 'Personalized Ads', desc: 'Show ads based on your reading preferences' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-3.5 border-b border-white/8">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-sm mb-1">{item.title}</div>
                        <div className="text-[13px] text-[#b8b8b8] leading-relaxed">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => togglePrivacy(item.key)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          privacy[item.key] ? 'bg-orange-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            privacy[item.key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <div className="animate-fadeIn">
              <div className="p-7 border-b border-white/8 mb-0">
                <h1 className="text-2xl font-bold mb-2">Billing & Subscription</h1>
                <p className="text-sm text-[#b8b8b8] font-medium mb-6">Manage your subscription and payment methods</p>
              </div>
              <div className="p-7">
                <div className="mb-8">
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Current Plan</h2>
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 max-w-[400px]">
                    <div className="font-bold mb-4 flex items-center gap-2 text-[15px]">
                      <span>👑</span>
                      <span>MANGU Premium</span>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm text-[#b8b8b8] mb-2">Billing Cycle</div>
                      <div className="text-lg font-bold">$9.99/month</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm text-[#b8b8b8] mb-2">Next Billing Date</div>
                      <div className="text-sm font-semibold">March 15, 2024</div>
                    </div>
                    <button className="w-full px-4 py-2 bg-white/5 border border-white/8 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-white/10 hover:border-orange-500">
                      Manage Subscription
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold mb-4 tracking-wider uppercase">Payment Methods</h2>
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm mb-1">•••• •••• •••• 4242</div>
                        <div className="text-[13px] text-[#b8b8b8]">Expires 12/25</div>
                      </div>
                      <button className="px-4 py-2 bg-white/5 border border-white/8 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-white/10 hover:border-orange-500">
                        Edit
                      </button>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/8 rounded-lg text-white text-sm font-semibold cursor-pointer transition-all hover:bg-white/10 hover:border-orange-500">
                    ➕ Add Payment Method
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed top-6 right-6 z-[1000] px-5 py-3.5 rounded-xl font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2.5 max-w-[320px] transition-transform duration-300 ${
            showNotification.type === 'error'
              ? 'bg-[#ef4444]'
              : showNotification.type === 'warning'
              ? 'bg-[#f59e0b]'
              : 'bg-orange-500'
          }`}
          style={{ transform: 'translateX(0)' }}
        >
          <span className="text-lg">{showNotification.type === 'error' ? '❌' : showNotification.type === 'warning' ? '⚠️' : '✅'}</span>
          <span>{showNotification.message}</span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}
