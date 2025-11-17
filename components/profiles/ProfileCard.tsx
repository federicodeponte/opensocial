// ABOUTME: Profile card component displaying user information
// ABOUTME: Shows avatar, bio, stats, and follow button

'use client'

import { Card } from '@/components/ui/card'
import { FollowButton } from './FollowButton'
import { ProfileWithFollowStatus } from '@/lib/hooks/useProfile'
import Link from 'next/link'

interface ProfileCardProps {
  profile: ProfileWithFollowStatus
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="p-6">
      {/* Header Image */}
      {profile.header_url && (
        <div className="h-32 -m-6 mb-0 rounded-t-lg overflow-hidden">
          <img
            src={profile.header_url}
            alt="Profile header"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Profile Info */}
      <div className="flex items-start justify-between mt-4">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-600">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name and Username */}
          <div>
            <h2 className="text-2xl font-bold">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>

        {/* Follow Button */}
        <FollowButton
          username={profile.username}
          isFollowing={profile.isFollowing || false}
          isOwnProfile={profile.isOwnProfile}
        />
      </div>

      {/* Bio */}
      {profile.bio && <p className="mt-4 text-gray-800">{profile.bio}</p>}

      {/* Location and Website */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        {profile.location && (
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>{profile.location}</span>
          </div>
        )}
        {profile.website && (
          <div className="flex items-center gap-1">
            <span>🔗</span>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-6 text-sm">
        <Link
          href={`/${profile.username}/following`}
          className="hover:underline"
        >
          <span className="font-bold">{profile.following_count}</span>
          <span className="text-gray-600"> Following</span>
        </Link>
        <Link
          href={`/${profile.username}/followers`}
          className="hover:underline"
        >
          <span className="font-bold">{profile.followers_count}</span>
          <span className="text-gray-600"> Followers</span>
        </Link>
      </div>

      {/* Join Date */}
      <div className="mt-4 text-sm text-gray-500">
        Joined {new Date(profile.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })}
      </div>
    </Card>
  )
}
