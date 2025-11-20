import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Socket } from 'socket.io-client'
import type { ChatSocketEvents, ChatMessage } from '~/types/chat'
import { useChatStore } from '~/stores/chat'
import { useUserStore } from '~/stores/user'

export const useChat = () => {
    const { $socket } = useNuxtApp()
    const chatStore = useChatStore()
    const userStore = useUserStore()
    const toast = useToastNotification()

    const socket = ref<Socket | null>(null)
    const isConnected = ref(false)
    const connectionInitialized = ref(false)
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5

    // Socket event handlers
    const setupSocketListeners = (socketInstance: Socket) => {
        // Connection events
        socketInstance.on('connect', () => {
            isConnected.value = true
            reconnectAttempts.value = 0
        })

        socketInstance.on('disconnect', (reason) => {
            isConnected.value = false
        })

        socketInstance.on('connect_error', (error) => {
            isConnected.value = false
            console.error('[Chat Socket] Connection error:', error.message)

            if (error.message.includes('Authentication') || error.message.includes('token')) {
                console.error('[Chat Socket] Authentication failed - clearing connection')
                connectionInitialized.value = false
            }
        })

        socketInstance.on('reconnect', (attemptNumber) => {
            isConnected.value = true
            reconnectAttempts.value = 0
        })

        socketInstance.on('reconnect_error', (error) => {
            console.error('[Chat Socket] Reconnection error:', error.message)
            reconnectAttempts.value++
        })

        socketInstance.on('reconnect_failed', () => {
            console.error('[Chat Socket] Reconnection failed after all attempts')
            connectionInitialized.value = false
        })

        // Chat message events
        socketInstance.on('chat:message', (message: ChatMessage) => {
            chatStore.addMessage(message)

            // Show notification for messages not from current user and not in active chat
            if (
                message.sender.id !== userStore.user?.id &&
                (!chatStore.activeChat || chatStore.activeChat.id !== message.chat_id)
            ) {
                showMessageNotification(message)
            }

            // Update chat in the list or move to top
            updateChatPosition(message.chat_id)
        })

        socketInstance.on('chat:messageEdited', (message: ChatMessage) => {
            chatStore.updateMessage(message)
        })

        socketInstance.on(
            'chat:messageDeleted',
            (data: { message_id: number; chat_id: number }) => {
                chatStore.removeMessage(data.chat_id, data.message_id)
            }
        )

        socketInstance.on(
            'chat:messageLiked',
            (data: { message_id: number; user: any; liked: boolean }) => {
                chatStore.updateMessageLike(data.message_id, data.user, data.liked)
            }
        )

        socketInstance.on('chat:messagePinned', (data: { message_id: number; pinned: boolean }) => {
            chatStore.updateMessagePin(data.message_id, data.pinned)
        })

        socketInstance.on(
            'chat:typing',
            (data: { chat_id: number; user_id: number; typing: boolean }) => {
                if (data.typing) {
                    chatStore.addTypingUser(data.chat_id, data.user_id)
                } else {
                    chatStore.removeTypingUser(data.chat_id, data.user_id)
                }
            }
        )

        socketInstance.on(
            'chat:read',
            (data: { chat_id: number; user_id: number; last_read_at: string }) => {
                chatStore.updateChatReadStatus(data.chat_id, data.user_id, data.last_read_at)
            }
        )

        socketInstance.on('chat:userOnline', (data: { user_id: number; online: boolean }) => {
            chatStore.updateUserOnlineStatus(data.user_id, data.online)
        })

        // Error events
        socketInstance.on('error', (error) => {
            console.error('[Chat Socket] Socket error:', error)
        })
    }

    const cleanupSocketListeners = () => {
        if (!socket.value) return

        // Remove all chat-related listeners
        const events = [
            'connect',
            'disconnect',
            'connect_error',
            'reconnect',
            'reconnect_error',
            'reconnect_failed',
            'chat:message',
            'chat:messageEdited',
            'chat:messageDeleted',
            'chat:messageLiked',
            'chat:messagePinned',
            'chat:typing',
            'chat:read',
            'chat:userOnline',
            'error',
        ]

        events.forEach((event) => {
            socket.value?.removeAllListeners(event)
        })
    }

    const showMessageNotification = (message: ChatMessage) => {
        try {
            const title = `${message.sender.name}`
            const body = message.content || 'New message'

            toast.info(body, title, {
                timeout: 5000,
                position: 'top-right',
                onClick: () => {
                    // Find and select the chat when notification is clicked
                    const chat = chatStore.chats.find((c) => c.id === message.chat_id)
                    if (chat) {
                        chatStore.setActiveChat(chat)
                        // Navigate to chat if not already there
                        const router = useRouter()
                        const localePath = useLocalePath()
                        router.push(localePath('/chat'))
                    }
                },
            })
        } catch (error) {
            console.error('[Chat Socket] Failed to show notification:', error)
        }
    }

    const updateChatPosition = (chatId: number) => {
        // This will be handled by the store's addMessage method
        // which already moves the chat to the top of the list
    }

    const connect = () => {
        const token = userStore.getAuthToken()
        if (!token) {
            console.warn('[Chat Socket] No auth token available')
            return
        }

        try {
            // Get existing socket or create new one
            socket.value = $socket.get() || $socket.connect(token)

            if (socket.value) {
                // Set connected state based on socket state
                isConnected.value = socket.value.connected
                connectionInitialized.value = true

                // Only setup listeners once
                if (!socket.value.hasListeners || !socket.value.hasListeners('chat:message')) {
                    setupSocketListeners(socket.value)
                }
            }
        } catch (error) {
            console.error('[Chat Socket] Connection error:', error)
            connectionInitialized.value = false
            isConnected.value = false
        }
    }

    const disconnect = () => {
        cleanupSocketListeners()

        if (socket.value) {
            $socket.disconnect()
            socket.value = null
        }

        isConnected.value = false
        connectionInitialized.value = false
        reconnectAttempts.value = 0
    }

    const reconnect = () => {
        if (reconnectAttempts.value >= maxReconnectAttempts) {
            console.error('[Chat Socket] Max reconnection attempts reached')
            return
        }

        disconnect()

        setTimeout(
            () => {
                connect()
            },
            Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
        ) // Exponential backoff
    }

    // Socket emission methods
    const emitTyping = (chatId: number, typing: boolean) => {
        if (!socket.value || !isConnected.value) {
            console.warn('[Chat Socket] Cannot emit typing - not connected')
            return
        }

        try {
            socket.value.emit('chat:typing', {
                chat_id: chatId,
                typing,
            })
        } catch (error) {
            console.error('[Chat Socket] Failed to emit typing:', error)
        }
    }

    const emitRead = (chatId: number) => {
        if (!socket.value || !isConnected.value) {
            console.warn('[Chat Socket] Cannot emit read - not connected')
            return
        }

        try {
            socket.value.emit('chat:read', {
                chat_id: chatId,
            })
        } catch (error) {
            console.error('[Chat Socket] Failed to emit read:', error)
        }
    }

    const joinChat = (chatId: number) => {
        if (!socket.value || !isConnected.value) {
            console.warn('[Chat Socket] Cannot join chat - not connected')
            return
        }

        try {
            socket.value.emit('chat:join', { chat_id: chatId })
        } catch (error) {
            console.error('[Chat Socket] Failed to join chat:', error)
        }
    }

    const leaveChat = (chatId: number) => {
        if (!socket.value || !isConnected.value) {
            console.warn('[Chat Socket] Cannot leave chat - not connected')
            return
        }

        try {
            socket.value.emit('chat:leave', { chat_id: chatId })
        } catch (error) {
            console.error('[Chat Socket] Failed to leave chat:', error)
        }
    }

    const sendTypingStatus = (chatId: number, isTyping: boolean) => {
        emitTyping(chatId, isTyping)
    }

    const markChatAsRead = (chatId: number) => {
        emitRead(chatId)
    }

    // Computed properties
    const unreadMessagesCount = computed(() => chatStore.totalUnreadCount)

    // Watchers
    watch(
        () => userStore.isAuthenticated,
        async (isAuth, wasAuth) => {
            if (isAuth && !wasAuth) {
                // User just logged in
                await nextTick()
                connect()
            } else if (!isAuth && wasAuth) {
                // User just logged out
                disconnect()
                chatStore.clear()
            }
        },
        { immediate: true }
    )

    // Auto-connect when token changes (refresh scenarios)
    watch(
        () => userStore.getAuthToken(),
        (newToken, oldToken) => {
            if (newToken && newToken !== oldToken && userStore.isAuthenticated) {
                disconnect()
                setTimeout(() => connect(), 1000)
            }
        }
    )

    // Lifecycle hooks
    onMounted(() => {
        if (userStore.isAuthenticated) {
            // Small delay to ensure everything is properly initialized
            setTimeout(() => {
                connect()
            }, 100)
        }
    })

    onUnmounted(() => {
        disconnect()
    })

    // Browser event handlers
    if (process.client) {
        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userStore.isAuthenticated) {
                if (!isConnected.value && connectionInitialized.value) {
                    reconnect()
                }
            }
        }

        // Handle online/offline status
        const handleOnline = () => {
            if (userStore.isAuthenticated && !isConnected.value) {
                reconnect()
            }
        }

        const handleOffline = () => {
            isConnected.value = false
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        onUnmounted(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        })
    }

    return {
        // State
        socket: computed(() => socket.value),
        isConnected: computed(() => isConnected.value),
        connectionInitialized: computed(() => connectionInitialized.value),
        unreadMessagesCount,

        // Methods
        connect,
        disconnect,
        reconnect,
        emitTyping,
        emitRead,
        joinChat,
        leaveChat,
        sendTypingStatus,
        markChatAsRead,
    }
}
