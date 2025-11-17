// ABOUTME: React Query hooks for posts with Realtime updates
// ABOUTME: Handles optimistic updates and automatic cache invalidation

'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/auth/supabase-client'
import type { PostWithProfile, CreatePostInput } from '@/lib/types/types'
import { useCurrentProfile } from './useProfile'
import { toast } from 'sonner'

export function usePosts(userId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const params = userId ? `?userId=${userId}` : ''
      const response = await fetch(`/api/posts${params}`)
      if (!response.ok) throw new Error('Failed to fetch posts')
      const { data } = await response.json()
      return data as PostWithProfile[]
    },
  })

  // Subscribe to real-time post updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('posts-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        () => {
          // Invalidate posts query when new post is created
          queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        () => {
          // Invalidate when post is updated (edited, pinned, etc.)
          queryClient.invalidateQueries({ queryKey: ['posts'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export function useInfinitePosts(userId?: string) {
  const queryClient = useQueryClient()

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['posts', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: '20',
        offset: pageParam.toString(),
      })
      if (userId) {
        params.set('userId', userId)
      }

      const response = await fetch(`/api/posts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch posts')
      const { data } = await response.json()
      return data as PostWithProfile[]
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has less than 20 posts, we've reached the end
      if (lastPage.length < 20) return undefined
      // Return the offset for the next page
      return allPages.length * 20
    },
    initialPageParam: 0,
  })

  // Subscribe to real-time post updates for infinite queries
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('posts-updates-infinite')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        () => {
          // Invalidate infinite posts query when new post is created
          queryClient.invalidateQueries({ queryKey: ['posts', 'infinite'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        () => {
          // Invalidate when post is updated
          queryClient.invalidateQueries({ queryKey: ['posts', 'infinite'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return infiniteQuery
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content, replyToId }: CreatePostInput) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, replyToId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }
      const { data } = await response.json()
      return data as PostWithProfile
    },
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['posts', 'infinite'] })

      // Snapshot previous values
      const previousPosts = queryClient.getQueryData<PostWithProfile[]>(['posts'])
      const previousInfinitePosts = queryClient.getQueryData<InfiniteData<PostWithProfile[]>>(['posts', 'infinite'])

      // Get current user profile for optimistic post
      const currentProfile = queryClient.getQueryData<any>(['profile', 'me'])

      // Only create optimistic post if we have current user profile
      if (currentProfile) {
        // Create optimistic post with complete data
        const optimisticPost = {
          id: `temp-${Date.now()}`,
          user_id: currentProfile.id,
          content: newPost.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 0,
          retweets_count: 0,
          replies_count: 0,
          views_count: 0,
          hasLiked: false,
          image_urls: [],
          reply_to_id: newPost.replyToId || null,
          quote_of_id: null,
          thread_id: null,
          profiles: {
            id: currentProfile.id,
            username: currentProfile.username,
            display_name: currentProfile.display_name,
            bio: currentProfile.bio,
            avatar_url: currentProfile.avatar_url,
            header_url: currentProfile.header_url,
            location: currentProfile.location,
            website: currentProfile.website,
            created_at: currentProfile.created_at,
            updated_at: currentProfile.updated_at,
            followers_count: currentProfile.followers_count,
            following_count: currentProfile.following_count,
            pinned_post_id: currentProfile.pinned_post_id || null,
            search_vector: currentProfile.search_vector || null,
            verified: currentProfile.verified || false,
          },
        } as PostWithProfile

        // Optimistically update regular posts (prepend new post)
        queryClient.setQueryData<PostWithProfile[]>(['posts'], (old) => {
          if (!old) return [optimisticPost]
          return [optimisticPost, ...old]
        })

        // Optimistically update infinite posts (prepend to first page)
        queryClient.setQueryData<InfiniteData<PostWithProfile[]>>(['posts', 'infinite'], (old) => {
          if (!old || !old.pages || old.pages.length === 0) {
            return {
              pages: [[optimisticPost]],
              pageParams: [0],
            }
          }

          const firstPage = old.pages[0] || []
          return {
            ...old,
            pages: [[optimisticPost, ...firstPage], ...old.pages.slice(1)],
          }
        })
      }

      return { previousPosts, previousInfinitePosts }
    },
    onError: (err, _newPost, context) => {
      // Show error notification
      toast.error('Failed to create post', {
        description: err instanceof Error ? err.message : 'Please try again',
      })

      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts)
      }
      if (context?.previousInfinitePosts) {
        queryClient.setQueryData(['posts', 'infinite'], context.previousInfinitePosts)
      }
    },
    onSettled: () => {
      // Refetch to get the real post with proper ID and profile data
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to toggle like')
      }
      const { data } = await response.json()
      return data
    },
    onMutate: async (postId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['posts', 'infinite'] })
      await queryClient.cancelQueries({ queryKey: ['post', postId] })

      // Snapshot previous values
      const previousPosts = queryClient.getQueryData(['posts'])
      const previousInfinitePosts = queryClient.getQueryData(['posts', 'infinite'])
      const previousPost = queryClient.getQueryData(['post', postId])

      // Optimistically update posts
      queryClient.setQueryData<PostWithProfile[]>(['posts'], (old) => {
        return old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasLiked: !post.hasLiked,
                likes_count: post.hasLiked ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post
        )
      })

      // Optimistically update infinite posts
      queryClient.setQueryData<InfiniteData<PostWithProfile[]>>(['posts', 'infinite'], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    hasLiked: !post.hasLiked,
                    likes_count: post.hasLiked ? post.likes_count - 1 : post.likes_count + 1,
                  }
                : post
            )
          ),
        }
      })

      // Optimistically update single post
      queryClient.setQueryData<PostWithProfile>(['post', postId], (old) => {
        if (!old) return old
        return {
          ...old,
          hasLiked: !old.hasLiked,
          likes_count: old.hasLiked ? old.likes_count - 1 : old.likes_count + 1,
        }
      })

      return { previousPosts, previousInfinitePosts, previousPost }
    },
    onError: (err, _postId, context) => {
      // Show error notification
      toast.error('Failed to update like', {
        description: err instanceof Error ? err.message : 'Please try again',
      })

      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts)
      }
      if (context?.previousInfinitePosts) {
        queryClient.setQueryData(['posts', 'infinite'], context.previousInfinitePosts)
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', _postId], context.previousPost)
      }
    },
    onSettled: () => {
      // Refetch to ensure data is correct
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function usePost(postId: string | null) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required')

      const response = await fetch(`/api/posts/${postId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch post')
      }
      const { data } = await response.json()
      return data as PostWithProfile
    },
    enabled: !!postId,
  })
}

export function useReplies(postId: string | null, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['replies', postId, options?.limit, options?.offset],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required')

      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.offset) params.set('offset', options.offset.toString())

      const response = await fetch(`/api/posts/${postId}/replies?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to fetch replies')
      }
      const { data } = await response.json()
      return data as PostWithProfile[]
    },
    enabled: !!postId,
  })
}

export function usePinPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pin post')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate profile to update pinned post
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUnpinPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unpin post')
      }
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      // Invalidate profile to update pinned post
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
