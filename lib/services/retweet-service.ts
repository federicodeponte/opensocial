// ABOUTME: Retweet service implementing business logic for retweet operations
// ABOUTME: Acts as intermediary between API routes and repository layer

import { DbClient, retweetRepository } from '@/lib/repositories/retweet-repository'
import { postRepository } from '@/lib/repositories/post-repository'
import { ValidationError, NotFoundError } from '@/lib/errors/app-error'
import { logger } from '@/lib/utils/logger'
import { Database } from '@/lib/types/database'

type RetweetRow = Database['public']['Tables']['retweets']['Row']

export interface CreateRetweetInput {
  postId: string
  quoteContent?: string | null
}

export class RetweetService {
  /**
   * Create a retweet (pure retweet or quote tweet)
   */
  async createRetweet(
    client: DbClient,
    userId: string,
    input: CreateRetweetInput
  ): Promise<RetweetRow> {
    const { postId, quoteContent } = input

    // Business logic validation
    if (quoteContent && quoteContent.trim().length === 0) {
      throw new ValidationError('Quote content cannot be empty if provided')
    }

    if (quoteContent && quoteContent.length > 280) {
      throw new ValidationError('Quote content must be 280 characters or less')
    }

    // Check if post exists
    const post = await postRepository.getPostById(client, postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    // Check if user is trying to retweet their own post
    if (post.user_id === userId) {
      throw new ValidationError('You cannot retweet your own post')
    }

    // Check if already retweeted
    const hasRetweeted = await retweetRepository.hasRetweeted(client, userId, postId)
    if (hasRetweeted) {
      throw new ValidationError('You have already retweeted this post')
    }

    logger.info('Creating retweet', {
      userId,
      postId,
      isQuote: !!quoteContent,
    })

    const retweet = await retweetRepository.createRetweet(client, {
      user_id: userId,
      post_id: postId,
      quote_content: quoteContent || null,
    })

    logger.info('Retweet created successfully', { retweetId: retweet.id })

    return retweet
  }

  /**
   * Delete a retweet (unretweet)
   */
  async deleteRetweet(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<void> {
    // Check if retweet exists
    const retweet = await retweetRepository.getUserRetweet(client, userId, postId)
    if (!retweet) {
      throw new ValidationError('You have not retweeted this post')
    }

    logger.info('Deleting retweet', { userId, postId })

    await retweetRepository.deleteRetweet(client, userId, postId)

    logger.info('Retweet deleted successfully', { userId, postId })
  }

  /**
   * Toggle retweet (retweet if not retweeted, unretweet if already retweeted)
   * Only for pure retweets (no quote content)
   */
  async toggleRetweet(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<{ retweeted: boolean; retweet?: RetweetRow }> {
    const hasRetweeted = await retweetRepository.hasRetweeted(client, userId, postId)

    if (hasRetweeted) {
      await this.deleteRetweet(client, userId, postId)
      return { retweeted: false }
    } else {
      const retweet = await this.createRetweet(client, userId, { postId })
      return { retweeted: true, retweet }
    }
  }

  /**
   * Check if user has retweeted a post
   */
  async hasRetweeted(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<boolean> {
    return await retweetRepository.hasRetweeted(client, userId, postId)
  }

  /**
   * Get user's retweet of a post (if exists)
   */
  async getUserRetweet(
    client: DbClient,
    userId: string,
    postId: string
  ): Promise<RetweetRow | null> {
    return await retweetRepository.getUserRetweet(client, userId, postId)
  }

  /**
   * Get all retweets by a user
   */
  async getUserRetweets(
    client: DbClient,
    userId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<RetweetRow[]> {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching user retweets', { userId, limit, offset })

    const retweets = await retweetRepository.getUserRetweets(client, userId, {
      limit,
      offset,
    })

    logger.debug('User retweets fetched', { count: retweets.length })

    return retweets
  }

  /**
   * Get all users who retweeted a post
   */
  async getPostRetweets(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<RetweetRow[]> {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching post retweets', { postId, limit, offset })

    const retweets = await retweetRepository.getPostRetweets(client, postId, {
      limit,
      offset,
    })

    logger.debug('Post retweets fetched', { count: retweets.length })

    return retweets
  }
}

// Export singleton instance
export const retweetService = new RetweetService()
