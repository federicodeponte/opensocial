// ABOUTME: React Query hooks for community data management
// ABOUTME: Optimistic updates, caching, infinite scroll

'use client'

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { communityService } from '@/lib/services/community-service'
import type {
  Community,
  CommunityMember,
  CommunityPost,
  CommunityEvent,
  CommunityFilters,
  CreateCommunityInput,
  UpdateCommunityInput,
} from '@/lib/types/community'
import { toast } from 'sonner'

// ============== Query Keys ==============

export const communityKeys = {
  all: ['communities'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (filters: CommunityFilters) => [...communityKeys.lists(), filters] as const,
  details: () => [...communityKeys.all, 'detail'] as const,
  detail: (id: string) => [...communityKeys.details(), id] as const,
  slug: (slug: string) => [...communityKeys.details(), 'slug', slug] as const,
  members: (communityId: string) => [...communityKeys.all, 'members', communityId] as const,
  posts: (communityId: string) => [...communityKeys.all, 'posts', communityId] as const,
  events: (communityId: string) => [...communityKeys.all, 'events', communityId] as const,
  userCommunities: (userId: string) => [...communityKeys.all, 'user', userId] as const,
  stats: (communityId: string) => [...communityKeys.all, 'stats', communityId] as const,
}

// ============== Communities ==============

export function useCommunities(filters: CommunityFilters = {}) {
  return useQuery({
    queryKey: communityKeys.list(filters),
    queryFn: () => communityService.getCommunities(filters),
  })
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => communityService.getCommunity(id),
    enabled: !!id,
  })
}

export function useCommunityBySlug(slug: string) {
  return useQuery({
    queryKey: communityKeys.slug(slug),
    queryFn: () => communityService.getCommunityBySlug(slug),
    enabled: !!slug,
  })
}

export function useUserCommunities(userId: string) {
  return useQuery({
    queryKey: communityKeys.userCommunities(userId),
    queryFn: () => communityService.getUserCommunities(userId),
    enabled: !!userId,
  })
}

export function useCreateCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: CreateCommunityInput }) =>
      communityService.createCommunity(userId, input),
    onSuccess: (newCommunity) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities(newCommunity.created_by_id) })
      toast.success('Community created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create community')
    },
  })
}

export function useUpdateCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      userId,
      input,
    }: {
      communityId: string
      userId: string
      input: UpdateCommunityInput
    }) => communityService.updateCommunity(communityId, userId, input),
    onSuccess: (updatedCommunity) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(updatedCommunity.id) })
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() })
      toast.success('Community updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update community')
    },
  })
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communityService.deleteCommunity(communityId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all })
      toast.success('Community deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete community')
    },
  })
}

// ============== Membership ==============

export function useCommunityMembers(communityId: string) {
  return useQuery({
    queryKey: communityKeys.members(communityId),
    queryFn: () => communityService.getMembers(communityId),
    enabled: !!communityId,
  })
}

export function useMemberRole(communityId: string, userId: string) {
  return useQuery({
    queryKey: [...communityKeys.members(communityId), 'role', userId],
    queryFn: () => communityService.getMemberRole(communityId, userId),
    enabled: !!communityId && !!userId,
  })
}

export function useJoinCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communityService.joinCommunity(communityId, userId),
    onSuccess: (_, { communityId, userId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities(userId) })
      toast.success('Successfully joined community!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to join community')
    },
  })
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communityService.leaveCommunity(communityId, userId),
    onSuccess: (_, { communityId, userId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.userCommunities(userId) })
      toast.success('Left community')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to leave community')
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      targetUserId,
      newRole,
      requestingUserId,
    }: {
      communityId: string
      targetUserId: string
      newRole: 'admin' | 'moderator' | 'member'
      requestingUserId: string
    }) => communityService.updateMemberRole(communityId, targetUserId, newRole, requestingUserId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) })
      toast.success('Member role updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update member role')
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      targetUserId,
      requestingUserId,
    }: {
      communityId: string
      targetUserId: string
      requestingUserId: string
    }) => communityService.removeMember(communityId, targetUserId, requestingUserId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      toast.success('Member removed')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })
}

export function useBanMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      targetUserId,
      requestingUserId,
    }: {
      communityId: string
      targetUserId: string
      requestingUserId: string
    }) => communityService.banMember(communityId, targetUserId, requestingUserId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.members(communityId) })
      toast.success('Member banned')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to ban member')
    },
  })
}

// ============== Posts ==============

export function useCommunityPosts(communityId: string, userId?: string) {
  return useInfiniteQuery({
    queryKey: communityKeys.posts(communityId),
    queryFn: ({ pageParam = 0 }) =>
      communityService.getPosts(communityId, userId, 20, pageParam),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined
      return pages.length * 20
    },
    initialPageParam: 0,
    enabled: !!communityId,
  })
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      userId,
      content,
    }: {
      communityId: string
      userId: string
      content: string
    }) => communityService.createPost(communityId, userId, content),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.posts(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      toast.success('Post created!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create post')
    },
  })
}

export function useDeleteCommunityPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      communityId,
    }: {
      postId: string
      userId: string
      communityId: string
    }) => communityService.deletePost(postId, userId, communityId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.posts(communityId) })
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) })
      toast.success('Post deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete post')
    },
  })
}

// ============== Events ==============

export function useCommunityEvents(communityId: string) {
  return useQuery({
    queryKey: communityKeys.events(communityId),
    queryFn: () => communityService.getEvents(communityId),
    enabled: !!communityId,
  })
}

export function useCreateCommunityEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      userId,
      input,
    }: {
      communityId: string
      userId: string
      input: {
        title: string
        description: string
        startTime: string
        endTime?: string
        location?: string
        isOnline: boolean
        maxAttendees?: number
      }
    }) => communityService.createEvent(communityId, userId, input),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.events(communityId) })
      toast.success('Event created!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event')
    },
  })
}

export function useAttendEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      eventId,
      userId,
      status,
      communityId,
    }: {
      eventId: string
      userId: string
      status: 'going' | 'maybe' | 'not_going'
      communityId: string
    }) => communityService.attendEvent(eventId, userId, status),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.events(communityId) })
      toast.success('RSVP updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update RSVP')
    },
  })
}

// ============== Stats ==============

export function useCommunityStats(communityId: string) {
  return useQuery({
    queryKey: communityKeys.stats(communityId),
    queryFn: () => communityService.getCommunityStats(communityId),
    enabled: !!communityId,
  })
}
