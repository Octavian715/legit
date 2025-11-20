export interface ChatUser {
    id: number
    name: string
    email?: string
    avatar?: string
    company?: string
    online?: boolean
    lastSeen?: string
}

export interface ChatAttachment {
    id: number
    original_name: string
    mime_type: string
    file_size: number
    file_type: 'image' | 'document' | 'video' | 'audio' | 'other'
    stream_url: string
    download_url: string
    created_at: string
}

export interface ChatMessage {
    id: number
    chat_id: number
    content: string | null
    pinned: boolean
    is_deleted: boolean
    is_edited: boolean
    liked_by_current_user: boolean
    likes: ChatUser[]
    attachments: ChatAttachment[]
    created_at: string
    updated_at: string
    sender: ChatUser
    reply_to?: {
        id: number
        content: string
        created_at: string
        sender: ChatUser
    } | null
    temp_id?: string
    sending?: boolean
    error?: boolean
    edited?: boolean
}

export interface ChatParticipant {
    id: number
    name: string
    joined_at: string
    last_read_at?: string | null
    unread_count: number
    avatar?: string
    company?: string
    online?: boolean
}

export interface Chat {
    id: number
    name?: string | null
    last_message_at?: string | null
    unread_count: number
    created_at: string
    updated_at: string
    last_message?: {
        id: number
        content: string | null
        created_at: string
        sender: ChatUser
        attachments?: ChatAttachment[]
    } | null
    participants: ChatParticipant[]
    is_direct?: boolean
    typing_users?: number[]
}

export interface MessageActionType {
    id: 'like' | 'edit' | 'reply' | 'pin' | 'copy' | 'delete'
    label: string
    icon: string
    color?: string
    requiresOwnership?: boolean
}

export interface SendMessagePayload {
    chat_id?: number
    recipient_id?: number
    content?: string
    reply_to_id?: number
    files?: File[]
}

export interface EditMessagePayload {
    message_id: number
    content: string
}

export interface ChatFilters {
    search?: string
    unread?: boolean
    archived?: boolean
}

export interface ChatSocketEvents {
    'chat:message': ChatMessage
    'chat:messageEdited': ChatMessage
    'chat:messageDeleted': { message_id: number; chat_id: number }
    'chat:messageLiked': { message_id: number; user: ChatUser; liked: boolean }
    'chat:messagePinned': { message_id: number; pinned: boolean }
    'chat:typing': { chat_id: number; user_id: number; typing: boolean }
    'chat:read': { chat_id: number; user_id: number; last_read_at: string }
    'chat:userOnline': { user_id: number; online: boolean }
}

export interface ChatState {
    chats: Chat[]
    activeChat: Chat | null
    messages: Record<number, ChatMessage[]>
    loadingChats: boolean
    loadingMessages: boolean
    sendingMessage: boolean
    hasMoreMessages: Record<number, boolean>
    typingUsers: Record<number, number[]>
    filters: ChatFilters
    profileOpen: boolean
    selectedUser: ChatUser | null
    currentUserId: number | null // Add this
}

export interface ChatPaginationParams {
    limit?: number
    before?: number
}

export type MessageAction = 'like' | 'edit' | 'reply' | 'pin' | 'copy' | 'delete'
