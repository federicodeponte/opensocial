// ABOUTME: Like service implementing business logic for like operations
// ABOUTME: Acts as intermediary between API routes and repository layer

import { DbClient, likeRepository } from '@/lib/repositories/like-repository'
import { postRepository } from '@/lib/repositories/post-repository'
import { ValidationError, NotFoundError } from '@/lib/errors/app-error'
import { logger } from '@/lib/utils/logger'

export class LikeService {
  /**
   * Like a post
   */
  async likePost(client: DbClient, userId: string, postId: string): Promise<void> {
    // Check if post exists
    const post = await postRepository.getPostById(client, postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    // Check if already liked
    const hasLiked = await likeRepository.hasLikedPost(client, userId, postId)
    if (hasLiked) {
      throw new ValidationError('You have already liked this post')
    }

    logger.info('Liking post', { userId, postId })

    await likeRepository.likePost(client, userId, postId)

    logger.info('Successfully liked post', { userId, postId })
  }

  /**
   * Unlike a post
   */
  async unlikePost(client: DbClient, userId: string, postId: string): Promise<void> {
    // Check if actually liked
    const hasLiked = await likeRepository.hasLikedPost(client, userId, postId)
    if (!hasLiked) {
      throw new ValidationError('You have not liked this post')
    }

    logger.info('Unliking post', { userId, postId })

    await likeRepository.unlikePost(client, userId, postId)

    logger.info('Successfully unliked post', { userId, postId })
  }

  /**
   * Toggle like on a post (like if not liked, unlike if liked)
   */
  async toggleLike(client: DbClient, userId: string, postId: string): Promise<{ liked: boolean }> {
    const hasLiked = await likeRepository.hasLikedPost(client, userId, postId)

    if (hasLiked) {
      await this.unlikePost(client, userId, postId)
      return { liked: false }
    } else {
      await this.likePost(client, userId, postId)
      return { liked: true }
    }
  }

  /**
   * Check if user has liked a post
   */
  async hasLikedPost(client: DbClient, userId: string, postId: string): Promise<boolean> {
    return await likeRepository.hasLikedPost(client, userId, postId)
  }

  /**
   * Get users who liked a post
   */
  async getPostLikes(
    client: DbClient,
    postId: string,
    options?: {
      limit?: number
      offset?: number
    }
  ) {
    const limit = Math.min(options?.limit ?? 20, 100)
    const offset = options?.offset ?? 0

    logger.debug('Fetching post likes', { postId, limit, offset })

    const likes = await likeRepository.getPostLikes(client, postId, { limit, offset })

    logger.debug('Post likes fetched', { postId, count: likes.length })

    return likes
  }
}

// Export singleton instance
export const likeService = new LikeService()
