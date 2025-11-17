// ABOUTME: Application-level types for posts, profiles, and other entities

import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']

export type PostWithProfile = Post & {
  profiles: Profile
  hasLiked?: boolean
  hasRetweeted?: boolean
}

export type CreatePostInput = {
  content: string
  replyToId?: string
  imageUrls?: string[]
}

export type UpdateProfileInput = {
  display_name?: string
  bio?: string
  location?: string
  website?: string
}
