// ABOUTME: Post service implementing business logic for post operations
// ABOUTME: Acts as intermediary between API routes and repository layer

import { DbClient, postRepository } from '@/lib/repositories/post-repository'
import { ValidationError } from '@/lib/errors/app-error'
import { PostWithProfile, CreatePostInput } from '@/lib/types/types'
import { logger } from '@/lib/utils/logger'

export class PostService {
  /**
   * Create a new post
   */
  async createPost(
    client: DbClient,
    userId: string,
    input: CreatePostInput
  ): Promise<PostWithProfile> {
    // Business logic validation
    const trimmedContent = input.content.trim()

    if (!trimmedContent) {
      throw new ValidationError('Post content cannot be empty')
    }

    if (trimmedContent.length > 280) {
      throw new ValidationError('Post content must be 280 characters or less')
    }

    logger.info('Creating post', {
      userId,
      contentLength: trimmedContent.length,
      isReply: !!input.replyToId,
    })

    const post = await postRepository.createPost(client, {
      userId,
      content: trimmedContent,
      replyToId: input.replyToId,
    })

    logger.info('Post created successfully', {
      postId: post.id,
      userId,
    })

    return post
  }

  /**
   * Get feed posts
   */
  async getFeedPosts(
    client: DbClient,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    }
  ): Promise<PostWithProfile[]> {
    const limit = Math.min(options?.limit ?? 20, 100) // Max 100 posts per request
    const offset = options?.offset ?? 0

    logger.debug('Fetching feed posts', {
      userId: options?.userId,
      limit,
      offset,
    })

    const posts = await postRepository.getFeedPosts(client, {
      userId: options?.userId,
      limit,
      offset,
    })

    logger.debug('Feed posts fetched', {
      count: posts.length,
    })

    return posts
  }

  /**
   * Get a single post by ID
   */
  async getPostById(client: DbClient, postId: string): Promise<PostWithProfile | null> {
    logger.debug('Fetching post by ID', { postId })

    const post = await postRepository.getPostById(client, postId)

    if (!post) {
      logger.debug('Post not found', { postId })
    }

    return post
  }

  /**
   * Get replies to a post
   */
  async getReplies(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<PostWithProfile[]> {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching replies', {
      postId,
      limit,
      offset,
    })

    const replies = await postRepository.getReplies(client, postId, {
      limit,
      offset,
    })

    logger.debug('Replies fetched', {
      postId,
      count: replies.length,
    })

    return replies
  }

  /**
   * Delete a post (must be owner)
   */
  async deletePost(client: DbClient, postId: string, userId: string): Promise<void> {
    logger.info('Deleting post', {
      postId,
      userId,
    })

    // Verify ownership (RLS will also enforce this)
    const post = await postRepository.getPostById(client, postId)

    if (!post) {
      throw new ValidationError('Post not found')
    }

    if (post.user_id !== userId) {
      throw new ValidationError('You can only delete your own posts')
    }

    await postRepository.deletePost(client, postId)

    logger.info('Post deleted successfully', {
      postId,
      userId,
    })
  }

  /**
   * Get post statistics for a user
   */
  async getUserPostStats(
    client: DbClient,
    userId: string
  ): Promise<{ totalPosts: number }> {
    const totalPosts = await postRepository.getUserPostCount(client, userId)

    return { totalPosts }
  }
}

// Export singleton instance
export const postService = new PostService()
