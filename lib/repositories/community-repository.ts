// ABOUTME: Community repository - database operations for communities
// ABOUTME: CRUD operations, membership, events, search

// @ts-nocheck
import { createClient } from '@/lib/auth/supabase-client'
import type {
  Community,
  CommunityMember,
  CommunityPost,
  CommunityEvent,
  CommunityFilters,
  CreateCommunityInput,
  UpdateCommunityInput,
} from '@/lib/types/community'

export const communityRepository = {
  // ============== Communities ==============

  async getAll(filters: CommunityFilters = {}) {
    const supabase = createClient()
    let query = supabase
      .from('communities')
      .select(`
        *,
        createdBy:profiles!communities_created_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)

    // Filter by type
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    // Search
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Sort
    if (filters.sort === 'popular') {
      query = query.order('post_count', { ascending: false })
    } else if (filters.sort === 'members') {
      query = query.order('member_count', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        createdBy:profiles!communities_created_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async getBySlug(slug: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        createdBy:profiles!communities_created_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data
  },

  async create(userId: string, input: CreateCommunityInput) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        type: input.type,
        cover_image: input.coverImage,
        avatar_url: input.avatarUrl,
        created_by_id: userId,
        allow_member_posts: input.allowMemberPosts ?? true,
        require_approval: input.requireApproval ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, input: UpdateCommunityInput) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('communities')
      .update({
        name: input.name,
        description: input.description,
        type: input.type,
        cover_image: input.coverImage,
        avatar_url: input.avatarUrl,
        allow_member_posts: input.allowMemberPosts,
        require_approval: input.requireApproval,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('communities').delete().eq('id', id)

    if (error) throw error
  },

  async getUserCommunities(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        *,
        community:communities(
          *,
          createdBy:profiles!communities_created_by_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (error) throw error
    return (data || []).map((m) => m.community)
  },

  // ============== Membership ==============

  async getMembers(communityId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        *,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getMemberRole(communityId: string, userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_members')
      .select('role, status')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  async joinCommunity(communityId: string, userId: string) {
    const supabase = createClient()

    // Check if community requires approval
    const { data: community } = await supabase
      .from('communities')
      .select('require_approval')
      .eq('id', communityId)
      .single()

    const status = community?.require_approval ? 'pending' : 'active'

    const { data, error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        status,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async leaveCommunity(communityId: string, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async updateMemberRole(
    communityId: string,
    userId: string,
    role: 'admin' | 'moderator' | 'member'
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeMember(communityId: string, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async banMember(communityId: string, userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_members')
      .update({ status: 'banned' })
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ============== Posts ==============

  async getPosts(communityId: string, limit = 20, offset = 0) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        community:communities(
          id,
          name,
          slug
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  },

  async createPost(communityId: string, userId: string, content: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: communityId,
        author_id: userId,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deletePost(postId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('community_posts').delete().eq('id', postId)

    if (error) throw error
  },

  // ============== Events ==============

  async getEvents(communityId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_events')
      .select(`
        *,
        community:communities(
          id,
          name,
          slug
        ),
        createdBy:profiles!community_events_created_by_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (error) throw error
    return data || []
  },

  async createEvent(
    communityId: string,
    userId: string,
    input: {
      title: string
      description: string
      startTime: string
      endTime?: string
      location?: string
      isOnline: boolean
      maxAttendees?: number
    }
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_events')
      .insert({
        community_id: communityId,
        created_by_id: userId,
        title: input.title,
        description: input.description,
        start_time: input.startTime,
        end_time: input.endTime,
        location: input.location,
        is_online: input.isOnline,
        max_attendees: input.maxAttendees,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async attendEvent(eventId: string, userId: string, status: 'going' | 'maybe' | 'not_going') {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('community_event_attendees')
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          status,
        },
        { onConflict: 'event_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },
}
