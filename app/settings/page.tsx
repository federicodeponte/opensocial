// ABOUTME: User settings page with account, privacy, and preferences
// ABOUTME: Comprehensive settings management interface

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentProfile, useUpdateProfile } from '@/lib/hooks/useProfile'
import { useReports } from '@/lib/hooks/useReports'
import { Bell, Lock, User, Shield, FileText, Mail } from 'lucide-react'

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'security' | 'reports'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const { data: profile, isLoading: profileLoading } = useCurrentProfile()
  const updateProfile = useUpdateProfile()
  const { data: reports } = useReports({ limit: 10 })

  // Form states
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [website, setWebsite] = useState(profile?.website || '')

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
      })
    } catch (error) {
      // Error is already displayed via updateProfile.isError
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <User className="h-5 w-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {activeTab === 'account' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Account Information</h2>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the name that will be displayed on your profile
                    </p>
                  </div>

                  {/* Username (read-only) */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Username</label>
                    <input
                      type="text"
                      value={profile?.username || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your username cannot be changed
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      maxLength={160}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Maximum 160 characters</span>
                      <span>{bio.length}/160</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where are you from?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Error Message */}
                  {updateProfile.isError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {updateProfile.error instanceof Error
                        ? updateProfile.error.message
                        : 'Failed to update profile'}
                    </div>
                  )}

                  {/* Success Message */}
                  {updateProfile.isSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      Profile updated successfully!
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="flex-1"
                    >
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Privacy Settings</h2>
                <div className="space-y-6">
                  <div className="flex items-start justify-between pb-6 border-b">
                    <div>
                      <h3 className="font-semibold">Private Account</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Only approved followers can see your posts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between pb-6 border-b">
                    <div>
                      <h3 className="font-semibold">Discoverable by Email</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Let people who have your email find your profile
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Show Activity Status</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Let others see when you're online
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                    </label>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> Privacy settings are currently view-only. Full privacy controls will be available in a future update.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-start justify-between pb-6 border-b">
                    <div className="flex gap-3">
                      <Mail className="h-5 w-5 text-gray-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">Email Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive email updates about your activity
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                    </label>
                  </div>

                  <div className="flex items-start justify-between pb-6 border-b">
                    <div className="flex gap-3">
                      <Bell className="h-5 w-5 text-gray-600 mt-1" />
                      <div>
                        <h3 className="font-semibold">Push Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Get push notifications on your devices
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" disabled />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-50 cursor-not-allowed"></div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700">Notify me when:</h3>
                    {[
                      'Someone likes my post',
                      'Someone replies to my post',
                      'Someone follows me',
                      'Someone mentions me',
                      'Someone retweets my post',
                    ].map((label) => (
                      <div key={label} className="flex items-center justify-between">
                        <label className="text-sm text-gray-700">{label}</label>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed"
                          disabled
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> Notification preferences are currently view-only. Customizable notifications will be available in a future update.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Security & Login</h2>
                <div className="space-y-6">
                  <div className="pb-6 border-b">
                    <h3 className="font-semibold mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline" disabled>
                      Change Password
                    </Button>
                  </div>

                  <div className="pb-6 border-b">
                    <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" disabled>
                      Enable 2FA
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Active Sessions</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage devices where you're currently logged in
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">Current Session</p>
                          <p className="text-xs text-gray-600 mt-1">Browser • Active now</p>
                        </div>
                        <span className="text-xs text-green-600 font-semibold">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> Security settings are currently view-only. Full security controls will be available in a future update.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'reports' && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Reports</h2>
                {reports && reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 rounded">
                              {report.reason.replace('_', ' ')}
                            </span>
                            <span
                              className={`ml-2 inline-block px-2 py-1 text-xs font-semibold rounded ${
                                report.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : report.status === 'reviewing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : report.status === 'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {report.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {report.reported_post && (
                          <p className="text-sm text-gray-600 mt-2">
                            Reported post by @{report.reported_post.profiles.username}
                          </p>
                        )}
                        {report.reported_user && (
                          <p className="text-sm text-gray-600 mt-2">
                            Reported user @{report.reported_user.username}
                          </p>
                        )}
                        {report.description && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{report.description}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">You haven't submitted any reports yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reports help keep our community safe
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
