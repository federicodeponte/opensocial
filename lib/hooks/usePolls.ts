// ABOUTME: React Query hooks for poll operations
// ABOUTME: Fetching poll data, voting, and optimistic updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query-config'
import type { PollData } from '@/app/api/polls/[pollId]/route'

/**
 * Fetch poll data with options and vote counts
 */
export function usePoll(pollId: string | null) {
  return useQuery<PollData>({
    queryKey: queryKeys.polls.byId(pollId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/polls/${pollId}`)
      const { data } = await response.json()
      return data
    },
    enabled: !!pollId,
  })
}

/**
 * Fetch poll data by post ID
 */
export function usePollByPostId(postId: string | null) {
  return useQuery<PollData | null>({
    queryKey: queryKeys.polls.byPost(postId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/poll`)
      if (response.status === 404) {
        return null // No poll for this post
      }
      const { data } = await response.json()
      return data
    },
    enabled: !!postId,
  })
}

/**
 * Vote on a poll option
 */
export function useVotePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
    }: {
      pollId: string
      optionId: string
    }) => {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      const { data } = await response.json()
      return data
    },
    onMutate: async ({ pollId, optionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.polls.byId(pollId) })

      // Snapshot previous value
      const previousPoll = queryClient.getQueryData<PollData>(
        queryKeys.polls.byId(pollId)
      )

      // Optimistically update poll
      if (previousPoll) {
        queryClient.setQueryData<PollData>(queryKeys.polls.byId(pollId), {
          ...previousPoll,
          user_voted_option_id: optionId,
          options: previousPoll.options.map((opt) => ({
            ...opt,
            vote_count:
              opt.id === optionId
                ? opt.vote_count + 1
                : opt.id === previousPoll.user_voted_option_id
                  ? opt.vote_count - 1
                  : opt.vote_count,
          })),
          total_votes:
            previousPoll.user_voted_option_id === null
              ? previousPoll.total_votes + 1
              : previousPoll.total_votes,
        })
      }

      return { previousPoll }
    },
    onError: (_err, { pollId }, context) => {
      // Rollback on error
      if (context?.previousPoll) {
        queryClient.setQueryData(queryKeys.polls.byId(pollId), context.previousPoll)
      }
    },
    onSettled: (_data, _error, { pollId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.byId(pollId) })
    },
  })
}

/**
 * Remove vote from poll
 */
export function useRemoveVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pollId: string) => {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove vote')
      }

      return response.json()
    },
    onMutate: async (pollId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.polls.byId(pollId) })

      const previousPoll = queryClient.getQueryData<PollData>(
        queryKeys.polls.byId(pollId)
      )

      // Optimistically remove vote
      if (previousPoll && previousPoll.user_voted_option_id) {
        queryClient.setQueryData<PollData>(queryKeys.polls.byId(pollId), {
          ...previousPoll,
          user_voted_option_id: null,
          options: previousPoll.options.map((opt) => ({
            ...opt,
            vote_count:
              opt.id === previousPoll.user_voted_option_id
                ? opt.vote_count - 1
                : opt.vote_count,
          })),
          total_votes: previousPoll.total_votes - 1,
        })
      }

      return { previousPoll }
    },
    onError: (_err, pollId, context) => {
      if (context?.previousPoll) {
        queryClient.setQueryData(queryKeys.polls.byId(pollId), context.previousPoll)
      }
    },
    onSettled: (_data, _error, pollId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.byId(pollId) })
    },
  })
}

/**
 * Create a poll for a post
 */
export function useCreatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      postId,
      options,
      expiresInHours,
    }: {
      postId: string
      options: string[]
      expiresInHours?: number
    }) => {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, options, expiresInHours }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create poll')
      }

      const { data } = await response.json()
      return data
    },
    onSuccess: (data) => {
      // Invalidate post queries to refetch with poll data
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.polls.byPost(data.poll.post_id),
      })
    },
  })
}
