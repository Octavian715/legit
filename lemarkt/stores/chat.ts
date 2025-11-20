import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import type {
    Chat,
    ChatMessage,
    ChatFilters,
    ChatPaginationParams,
    SendMessagePayload,
    ChatUser,
} from '~/types/chat'
import { useChatService } from '~/services/chatService'

export const useChatStore = defineStore('chat', () => {
    const chats = ref<Chat[]>([])
    const activeChat = ref<Chat | null>(null)
    const messages = reactive<Record<number, ChatMessage[]>>({})
    const loadingChats = ref(false)
    const loadingMessages = ref(false)
    const sendingMessage = ref(false)
    const initializing = ref(false)

    const hasMoreMessages = reactive<Record<number, boolean>>({})
    const typingUsers = reactive<Record<number, number[]>>({})
    const filters = ref<ChatFilters>({})
    const profileOpen = ref(false)
    const selectedUser = ref<ChatUser | null>(null)
    const currentUserId = ref<number | null>(null)

    const getChatService = () => {
        try {
            return useChatService()
        } catch (error) {
            console.error('[Chat Store] Failed to get chat service:', error)
            throw new Error('Chat service unavailable')
        }
    }

    const filteredChats = computed((): Chat[] => {
        let filtered = [...chats.value]

        if (filters.value.search) {
            const search = filters.value.search.toLowerCase()
            filtered = filtered.filter((chat) => {
                const participants = chat.participants.map((p) => p.name.toLowerCase()).join(' ')
                const lastMessage = chat.last_message?.content?.toLowerCase() || ''
                return (
                    participants.includes(search) ||
                    lastMessage.includes(search) ||
                    chat.name?.toLowerCase().includes(search)
                )
            })
        }

        if (filters.value.unread) {
            filtered = filtered.filter((chat) => chat.unread_count > 0)
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.last_message_at || a.created_at).getTime()
            const dateB = new Date(b.last_message_at || b.created_at).getTime()
            return dateB - dateA
        })
    })

    const activeChatMessages = computed((): ChatMessage[] => {
        if (!activeChat.value) return []
        return messages[activeChat.value.id] || []
    })

    const activeChatParticipant = computed((): ChatUser | null => {
        if (!activeChat.value || !activeChat.value.is_direct) return null
        const userStore = useUserStore()
        const participant = activeChat.value.participants.find((p) => p.id !== userStore.user?.id)
        return participant
            ? {
                  id: participant.id,
                  name: participant.name,
                  avatar: participant.avatar_url,
                  company: participant.company,
                  online: participant.online,
              }
            : null
    })

    const isTyping = computed(() => (chatId: number): boolean => {
        return (typingUsers[chatId] || []).length > 0
    })

    const typingUsersList = computed(() => (chatId: number): string[] => {
        const userIds = typingUsers[chatId] || []
        const chat = chats.value.find((c) => c.id === chatId)
        if (!chat) return []

        return userIds.map((userId) => {
            const participant = chat.participants.find((p) => p.id === userId)
            return participant?.name || 'Unknown'
        })
    })

    const pinnedMessages = computed((): ChatMessage[] => {
        if (!activeChat.value) return []
        const chatMessages = messages[activeChat.value.id] || []
        return chatMessages.filter((m) => m.pinned && !m.is_deleted)
    })

    const totalUnreadCount = computed((): number => {
        return chats.value.reduce((sum, chat) => sum + chat.unread_count, 0)
    })

    const setCurrentUserId = (userId: number) => {
        currentUserId.value = userId
    }

    const fetchChats = async (force = false): Promise<Chat[]> => {
        if (loadingChats.value && !force) return chats.value

        loadingChats.value = true

        if (chats.value.length === 0) {
            initializing.value = true
        }

        try {
            const chatService = getChatService()
            const fetchedChats = await chatService.getChats()
            chats.value = fetchedChats

            return fetchedChats
        } catch (error: any) {
            console.error('Failed to fetch chats:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to load conversations')
            throw error
        } finally {
            loadingChats.value = false
            initializing.value = false
        }
    }

    const fetchOrCreateDirectChat = async (userId: number): Promise<Chat> => {
        try {
            const chatService = getChatService()
            const chat = await chatService.getOrCreateDirectChat(userId)
            const existingIndex = chats.value.findIndex((c) => c.id === chat.id)

            if (existingIndex === -1) {
                chats.value.unshift(chat)
            } else {
                chats.value[existingIndex] = { ...chats.value[existingIndex], ...chat }
            }

            await setActiveChat(chat)

            if (!messages[chat.id]) {
                await fetchMessages(chat.id)
            }

            return chat
        } catch (error: any) {
            console.error('Failed to create/fetch direct chat:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to create conversation')
            throw error
        }
    }

    const fetchMessages = async (
        chatId: number,
        params?: ChatPaginationParams
    ): Promise<ChatMessage[]> => {
        if (!messages[chatId]) {
            messages[chatId] = []
        }

        if (loadingMessages.value && !params?.before) return messages[chatId]

        loadingMessages.value = true

        try {
            const chatService = getChatService()
            const fetchedMessages = await chatService.getMessages(chatId, params)

            const userStore = useUserStore()
            fetchedMessages.forEach((message) => {
                message.liked_by_current_user =
                    message.likes?.some((like) => like.id === userStore.user?.id) || false
            })

            if (params?.before) {
                const existingIds = new Set(messages[chatId].map((m) => m.id))
                const newMessages = fetchedMessages.filter((m) => !existingIds.has(m.id))
                messages[chatId] = [...newMessages, ...messages[chatId]]
            } else {
                messages[chatId] = fetchedMessages
            }

            hasMoreMessages[chatId] = fetchedMessages.length === (params?.limit || 50)

            return fetchedMessages
        } catch (error: any) {
            console.error('Failed to fetch messages:', error)
            const toast = useToastNotification()
            toast?.error('Failed to load messages. Please try again.')
            throw error
        } finally {
            loadingMessages.value = false
        }
    }

    const sendMessage = async (payload: SendMessagePayload): Promise<ChatMessage> => {
        const userStore = useUserStore()
        if (!userStore.user) {
            throw new Error('User not authenticated')
        }

        const chatId = payload.chat_id || activeChat.value?.id

        if (!chatId && !payload.recipient_id) {
            throw new Error('No chat or recipient specified')
        }

        sendingMessage.value = true

        try {
            const chatService = getChatService()
            const message = await chatService.sendMessage(payload)

            updateChatLastMessage(message)

            return message
        } catch (error: any) {
            console.error('Failed to send message:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to send message')
            throw error
        } finally {
            sendingMessage.value = false
        }
    }

    const findReplyMessage = (chatId: number, messageId: number): ChatMessage['reply_to'] => {
        const chatMessages = messages[chatId] || []
        const replyMessage = chatMessages.find((m) => m.id === messageId)
        if (replyMessage) {
            return {
                id: replyMessage.id,
                content: replyMessage.content || '',
                created_at: replyMessage.created_at,
                sender: replyMessage.sender,
            }
        }
        return undefined
    }

    const findMessageById = (messageId: number): ChatMessage | null => {
        for (const chatId in messages) {
            const chatMessages = messages[chatId]
            const message = chatMessages.find((m) => m.id === messageId)
            if (message) {
                return message
            }
        }
        return null
    }

    const editMessage = async (messageId: number, content: string): Promise<ChatMessage> => {
        if (!content.trim()) {
            throw new Error('Message content cannot be empty')
        }

        try {
            const chatService = getChatService()
            const editedMessage = await chatService.editMessage(messageId, content)

            return editedMessage
        } catch (error: any) {
            console.error('[Chat Store] Failed to edit message:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to edit message')
            throw error
        }
    }

    const deleteMessage = async (messageId: number): Promise<ChatMessage> => {
        try {
            const chatService = getChatService()
            const message = await chatService.deleteMessage(messageId)
            updateMessage(message)

            return message
        } catch (error: any) {
            console.error('Failed to delete message:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to delete message')
            throw error
        }
    }

    const togglePin = async (messageId: number, pinned: boolean): Promise<ChatMessage> => {
        try {
            const chatService = getChatService()
            const message = await chatService.togglePin(messageId, pinned)
            updateMessage(message)

            return message
        } catch (error: any) {
            console.error('Failed to toggle pin:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to update pin status')
            throw error
        }
    }

    const toggleLike = async (messageId: number): Promise<{ success: boolean; liked: boolean }> => {
        try {
            const chatService = getChatService()
            const result = await chatService.toggleLike(messageId)

            for (const chatId in messages) {
                const chatMessages = messages[chatId]
                const messageIndex = chatMessages.findIndex((m) => m.id === messageId)

                if (messageIndex !== -1) {
                    const message = chatMessages[messageIndex]
                    const userStore = useUserStore()

                    if (result.liked) {
                        if (!message.likes.some((like) => like.id === userStore.user?.id)) {
                            message.likes.push({
                                id: userStore.user!.id,
                                name: userStore.userDisplayName,
                                avatar: userStore.user!.avatar,
                            })
                        }
                    } else {
                        message.likes = message.likes.filter(
                            (like) => like.id !== userStore.user?.id
                        )
                    }

                    message.liked_by_current_user = result.liked
                    messages[chatId][messageIndex] = { ...message }
                    break
                }
            }

            return result
        } catch (error: any) {
            console.error('Failed to toggle like:', error)
            const toast = useToastNotification()
            toast?.error(error.message || 'Failed to update like status')
            throw error
        }
    }

    const markChatAsRead = async (chatId: number): Promise<void> => {
        try {
            const chatService = getChatService()
            await chatService.markAsRead(chatId)
            const chatIndex = chats.value.findIndex((c) => c.id === chatId)
            if (chatIndex !== -1) {
                chats.value[chatIndex] = {
                    ...chats.value[chatIndex],
                    unread_count: 0,
                }
            }
        } catch (error: any) {
            console.error('Failed to mark chat as read:', error)
        }
    }

    const setActiveChat = async (chat: Chat | null): Promise<void> => {
        try {
            const previousChat = activeChat.value
            activeChat.value = chat

            if (chat) {
                if (chat.unread_count > 0) {
                    await markChatAsRead(chat.id)
                }

                if (!messages[chat.id] || messages[chat.id].length === 0) {
                    await fetchMessages(chat.id)
                }
            }
        } catch (error: any) {
            console.error('Failed to set active chat:', error)
        }
    }

    const setFilters = (newFilters: ChatFilters) => {
        filters.value = { ...filters.value, ...newFilters }
    }

    const clearFilters = () => {
        filters.value = {}
    }

    const toggleProfile = () => {
        profileOpen.value = !profileOpen.value
    }

    const setSelectedUser = (user: ChatUser | null) => {
        selectedUser.value = user
        if (user) {
            profileOpen.value = true
        }
    }

    const addTypingUser = (chatId: number, userId: number) => {
        if (!typingUsers[chatId]) {
            typingUsers[chatId] = []
        }
        if (!typingUsers[chatId].includes(userId)) {
            typingUsers[chatId].push(userId)
        }

        setTimeout(() => {
            removeTypingUser(chatId, userId)
        }, 3000)
    }

    const removeTypingUser = (chatId: number, userId: number) => {
        if (typingUsers[chatId]) {
            typingUsers[chatId] = typingUsers[chatId].filter((id) => id !== userId)
        }
    }

    const updateMessageById = (messageId: number, updates: Partial<ChatMessage>): boolean => {
        for (const chatId in messages) {
            const chatMessages = messages[chatId]
            const index = chatMessages.findIndex((m) => m.id === messageId)

            if (index !== -1) {
                const existingMessage = chatMessages[index]
                const userStore = useUserStore()

                if (updates.likes) {
                    updates.liked_by_current_user = updates.likes.some(
                        (like) => like.id === userStore.user?.id
                    )
                }

                const updatedMessage = {
                    ...existingMessage,
                    ...updates,
                    chat_id: parseInt(chatId),
                    edited: true,
                    is_edited: true,
                }

                messages[chatId][index] = updatedMessage

                if (index === chatMessages.length - 1) {
                    updateChatLastMessage(updatedMessage)
                }

                return true
            }
        }

        console.error('[Chat Store] Message not found:', messageId)
        return false
    }

    const updateMessage = (message: ChatMessage) => {
        if (!message.chat_id) {
            console.warn('[Chat Store] updateMessage called without chat_id, searching by ID...')
            const success = updateMessageById(message.id, message)
            if (success) {
                return
            }
            console.error('[Chat Store] Cannot update message without chat_id and not found by ID')
            return
        }

        const chatMessages = messages[message.chat_id]
        if (!chatMessages) {
            console.warn('[Chat Store] No messages found for chat:', message.chat_id)
            updateMessageById(message.id, message)
            return
        }

        const index = chatMessages.findIndex((m) => m.id === message.id)
        if (index !== -1) {
            const userStore = useUserStore()
            const existingMessage = chatMessages[index]

            if (message.likes) {
                message.liked_by_current_user = message.likes.some(
                    (like) => like.id === userStore.user?.id
                )
            }

            const updatedMessage = {
                ...existingMessage,
                ...message,
                edited: message.edited || message.is_edited || existingMessage.edited,
                is_edited: message.is_edited || message.edited || existingMessage.is_edited,
            }

            messages[message.chat_id][index] = updatedMessage

            const isLastMessage = index === chatMessages.length - 1
            if (isLastMessage && !message.is_deleted) {
                updateChatLastMessage(updatedMessage)
            }
        } else {
            console.warn('[Chat Store] Message not found in specified chat, trying all chats...')
            updateMessageById(message.id, message)
        }
    }

    const addMessage = (message: ChatMessage) => {
        if (!messages[message.chat_id]) {
            messages[message.chat_id] = []
        }

        const existingIndex = messages[message.chat_id].findIndex((m) => m.id === message.id)

        if (existingIndex !== -1) {
            return
        }

        const userStore = useUserStore()

        message.liked_by_current_user =
            message.likes?.some((like) => like.id === userStore.user?.id) || false

        messages[message.chat_id].push(message)

        messages[message.chat_id].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        updateChatLastMessage(message)
    }

    const updateChatLastMessage = (message: ChatMessage) => {
        const chatIndex = chats.value.findIndex((c) => c.id === message.chat_id)
        if (chatIndex !== -1) {
            const userStore = useUserStore()
            const isOwnMessage = message.sender.id === userStore.user?.id
            const isActiveChat = activeChat.value?.id === message.chat_id

            let newUnreadCount = chats.value[chatIndex].unread_count

            if (!isOwnMessage && !isActiveChat) {
                newUnreadCount += 1
            }

            chats.value[chatIndex] = {
                ...chats.value[chatIndex],
                last_message: {
                    id: message.id,
                    content: message.content || '',
                    created_at: message.created_at,
                    sender: message.sender,
                },
                last_message_at: message.created_at,
                unread_count: newUnreadCount,
            }

            const chat = chats.value.splice(chatIndex, 1)[0]
            chats.value.unshift(chat)
        }
    }

    const incrementUnreadCount = (chatId: number) => {
        const chatIndex = chats.value.findIndex((c) => c.id === chatId)
        if (chatIndex !== -1) {
            chats.value[chatIndex] = {
                ...chats.value[chatIndex],
                unread_count: chats.value[chatIndex].unread_count + 1,
            }
        }
    }

    const updateMessageLike = (messageId: number, user: ChatUser, liked: boolean) => {
        for (const chatId in messages) {
            const chatMessages = messages[chatId]
            const messageIndex = chatMessages.findIndex((m) => m.id === messageId)

            if (messageIndex !== -1) {
                const message = chatMessages[messageIndex]

                if (liked) {
                    if (!message.likes.some((like) => like.id === user.id)) {
                        message.likes.push(user)
                    }
                } else {
                    message.likes = message.likes.filter((like) => like.id !== user.id)
                }

                const userStore = useUserStore()
                if (user.id === userStore.user?.id) {
                    message.liked_by_current_user = liked
                }

                messages[chatId][messageIndex] = { ...message }
                break
            }
        }
    }

    const updateMessagePin = (messageId: number, pinned: boolean) => {
        for (const chatId in messages) {
            const chatMessages = messages[chatId]
            const messageIndex = chatMessages.findIndex((m) => m.id === messageId)

            if (messageIndex !== -1) {
                messages[chatId][messageIndex] = {
                    ...messages[chatId][messageIndex],
                    pinned,
                }
                break
            }
        }
    }

    const updateChatReadStatus = (chatId: number, userId: number, lastReadAt: string) => {
        const chatIndex = chats.value.findIndex((c) => c.id === chatId)
        if (chatIndex !== -1) {
            const chat = chats.value[chatIndex]
            const participantIndex = chat.participants.findIndex((p) => p.id === userId)
            if (participantIndex !== -1) {
                chat.participants[participantIndex] = {
                    ...chat.participants[participantIndex],
                    last_read_at: lastReadAt,
                }
                chats.value[chatIndex] = { ...chat }
            }
        }
    }

    const addOrUpdateChat = (chatData: Chat) => {
        const existingIndex = chats.value.findIndex((c) => c.id === chatData.id)

        if (existingIndex !== -1) {
            chats.value[existingIndex] = {
                ...chats.value[existingIndex],
                ...chatData,
            }
        } else {
            chats.value.unshift(chatData)
        }
    }

    const removeMessage = (chatId: number, messageId: number) => {
        if (!messages[chatId]) return

        const index = messages[chatId].findIndex((m) => m.id === messageId)
        if (index !== -1) {
            messages[chatId][index] = {
                ...messages[chatId][index],
                is_deleted: true,
                content: null,
            }
        }
    }

    const updateUserOnlineStatus = (userId: number, online: boolean) => {
        chats.value.forEach((chat, chatIndex) => {
            const participantIndex = chat.participants.findIndex((p) => p.id === userId)
            if (participantIndex !== -1) {
                chat.participants[participantIndex] = {
                    ...chat.participants[participantIndex],
                    online,
                }
                chats.value[chatIndex] = { ...chat }
            }
        })
    }

    const retryFailedMessage = async (tempId: string): Promise<void> => {
        for (const chatId in messages) {
            const chatMessages = messages[chatId]
            const messageIndex = chatMessages.findIndex((m) => m.temp_id === tempId && m.error)

            if (messageIndex !== -1) {
                const failedMessage = chatMessages[messageIndex]

                try {
                    failedMessage.sending = true
                    failedMessage.error = false

                    const payload: SendMessagePayload = {
                        chat_id: parseInt(chatId),
                        content: failedMessage.content || undefined,
                    }

                    const chatService = getChatService()
                    const sentMessage = await chatService.sendMessage(payload)
                    messages[chatId][messageIndex] = {
                        ...sentMessage,
                        sending: false,
                        error: false,
                    }
                } catch (error) {
                    failedMessage.sending = false
                    failedMessage.error = true
                    throw error
                }
                break
            }
        }
    }

    const searchMessages = (query: string, chatId?: number): ChatMessage[] => {
        if (!query.trim()) return []

        const searchIn = chatId ? [chatId] : Object.keys(messages).map(Number)
        const results: ChatMessage[] = []

        searchIn.forEach((id) => {
            const chatMessages = messages[id] || []
            const matches = chatMessages.filter(
                (message) =>
                    message.content?.toLowerCase().includes(query.toLowerCase()) &&
                    !message.is_deleted
            )
            results.push(...matches)
        })

        return results.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }

    const clear = () => {
        chats.value = []
        activeChat.value = null
        Object.keys(messages).forEach((key) => delete messages[parseInt(key)])
        Object.keys(typingUsers).forEach((key) => delete typingUsers[parseInt(key)])
        Object.keys(hasMoreMessages).forEach((key) => delete hasMoreMessages[parseInt(key)])
        filters.value = {}
        profileOpen.value = false
        selectedUser.value = null
        currentUserId.value = null
        loadingChats.value = false
        loadingMessages.value = false
        sendingMessage.value = false
    }

    // Auto-update selectedUser when activeChat changes and profile sidebar is open
    watch(
        () => activeChat.value,
        (newChat) => {
            if (profileOpen.value && newChat && newChat.is_direct) {
                const userStore = useUserStore()
                const participant = newChat.participants.find((p) => p.id !== userStore.user?.id)

                if (participant) {
                    selectedUser.value = {
                        id: participant.id,
                        name: participant.name,
                        avatar: participant.avatar_url,
                        company: participant.company,
                        online: participant.online,
                    }
                }
            }
        }
    )

    return {
        chats: computed(() => chats.value),
        activeChat: computed(() => activeChat.value),
        messages: computed(() => messages),
        loadingChats: computed(() => loadingChats.value),
        loadingMessages: computed(() => loadingMessages.value),
        sendingMessage: computed(() => sendingMessage.value),
        hasMoreMessages: computed(() => hasMoreMessages),
        typingUsers: computed(() => typingUsers),
        filters: computed(() => filters.value),
        profileOpen: computed(() => profileOpen.value),
        selectedUser: computed(() => selectedUser.value),
        currentUserId: computed(() => currentUserId.value),
        initializing: computed(() => initializing.value),

        filteredChats,
        activeChatMessages,
        activeChatParticipant,
        isTyping,
        typingUsersList,
        pinnedMessages,
        totalUnreadCount,

        setCurrentUserId,
        fetchChats,
        fetchOrCreateDirectChat,
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        togglePin,
        toggleLike,
        markChatAsRead,
        setActiveChat,
        setFilters,
        clearFilters,
        toggleProfile,
        setSelectedUser,
        addTypingUser,
        removeTypingUser,
        updateMessage,
        addMessage,
        incrementUnreadCount,
        updateMessageLike,
        updateMessagePin,
        updateChatReadStatus,
        addOrUpdateChat,
        removeMessage,
        updateUserOnlineStatus,
        retryFailedMessage,
        searchMessages,
        updateMessageById,
        findMessageById,
        clear,
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot))
}
