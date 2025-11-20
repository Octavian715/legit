import { ref, computed, watch, onUnmounted, nextTick, getCurrentInstance, markRaw } from 'vue'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import type { ChatMessage } from '~/types/chat'
import type { Notification, UnreadCountUpdate } from '~/types/notifications'
import { useChatStore } from '~/stores/chat'
import { useNotificationsStore } from '~/stores/notifications'
import { useUserStore } from '~/stores/user'
import { useNotificationEventBus } from '~/composables/notifications/handlers/useNotificationEventBus'

interface SocketSubscriber {
    id: string
    type: 'chat' | 'notifications' | 'mixed'
    onDisconnect?: () => void
}

const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return
    }

    try {
        const notification = new Notification(title, {
            body,
            icon: icon || '/icon.png',
            badge: '/badge.png',
            tag: 'chat-message',
            requireInteraction: false,
        })

        notification.onclick = () => {
            window.focus()
            notification.close()
        }

        setTimeout(() => notification.close(), 5000)
    } catch (error) {
        console.error('[Notification] Failed to show browser notification:', error)
    }
}

class SocketManager {
    private socket: Socket | null = null
    private subscribers = new Map<string, SocketSubscriber>()
    private isConnected = ref(false)
    private isConnecting = ref(false)
    private reconnectAttempts = ref(0)
    private maxReconnectAttempts = 5
    private eventListenersSetup = false
    private connectionPromise: Promise<Socket | null> | null = null

    constructor() {
        if (process.client && typeof window !== 'undefined') {
            this.setupBrowserEvents()
        }
    }

    private setupBrowserEvents() {
        if (!process.client) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && this.shouldBeConnected()) {
                if (!this.isConnected.value && !this.isConnecting.value) {
                    this.connect()
                }
            }
        }

        const handleOnline = () => {
            if (this.shouldBeConnected() && !this.isConnected.value) {
                this.connect()
            }
        }

        const handleOffline = () => {
            this.isConnected.value = false
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        window.addEventListener('beforeunload', () => this.forceDisconnect())
    }

    private shouldBeConnected(): boolean {
        if (!process.client) return false
        const userStore = useUserStore()
        return userStore.isAuthenticated && this.subscribers.size > 0
    }

    private setupSocketListeners(socketInstance: Socket) {
        if (this.eventListenersSetup || !socketInstance) return

        socketInstance.on('connect', () => {
            this.isConnected.value = true
            this.isConnecting.value = false
            this.reconnectAttempts.value = 0
        })

        socketInstance.on('disconnect', (reason) => {
            this.isConnected.value = false
            this.isConnecting.value = false

            this.subscribers.forEach((subscriber) => {
                subscriber.onDisconnect?.()
            })
        })

        socketInstance.on('connect_error', (error) => {
            this.isConnected.value = false
            this.isConnecting.value = false
            console.error('[SocketManager] Connection error:', error.message)

            if (error.message.includes('Authentication') || error.message.includes('token')) {
                console.error('[SocketManager] Auth failed, clearing connection')
                this.forceDisconnect()
            }
        })

        socketInstance.on('reconnect', (attemptNumber) => {
            this.isConnected.value = true
            this.reconnectAttempts.value = 0
        })

        this.setupChatListeners(socketInstance)
        this.setupNotificationListeners(socketInstance)

        this.eventListenersSetup = true
    }

    private setupChatListeners(socketInstance: Socket) {
        if (!socketInstance || !process.client) return

        const chatStore = useChatStore()
        const userStore = useUserStore()
        const toast = useToastNotification()

        socketInstance.on('chatMessageNew', (message: any) => {
            const existingMessage = chatStore.findMessageById(message.id)
            if (existingMessage) {
                message.edited = true
                message.is_edited = true
                chatStore.updateMessageById(message.id, message)
                return
            }

            if (!message.likes) message.likes = []
            if (!message.attachments) message.attachments = []

            message.liked_by_current_user =
                message.likes.some((like: any) => like.id === userStore.user?.id) || false

            chatStore.addMessage(message)

            const isOwnMessage = message.sender.id === userStore.user?.id
            const isActiveChat = chatStore.activeChat?.id === message.chat_id

            if (!isOwnMessage && !isActiveChat) {
                const chat = chatStore.chats.find((c: any) => c.id === message.chat_id)
                const senderName = message.sender?.name || 'Someone'
                const chatName = chat?.is_direct ? senderName : chat?.name || 'Group Chat'

                const messagePreview = message.content
                    ? message.content.length > 50
                        ? message.content.substring(0, 50) + '...'
                        : message.content
                    : message.attachments?.length > 0
                      ? `📎 ${message.attachments.length} attachment(s)`
                      : 'New message'

                toast.info(messagePreview, chatName, {
                    timeout: 5000,
                    position: 'top-right',
                })

                if (document.hidden) {
                    showBrowserNotification(chatName, messagePreview, message.sender?.avatar)
                }

                if (typeof Audio !== 'undefined') {
                    try {
                        const audioContext = new (window.AudioContext ||
                            (window as any).webkitAudioContext)()
                        const oscillator = audioContext.createOscillator()
                        const gainNode = audioContext.createGain()

                        oscillator.connect(gainNode)
                        gainNode.connect(audioContext.destination)

                        oscillator.frequency.value = 800
                        oscillator.type = 'sine'

                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                        gainNode.gain.exponentialRampToValueAtTime(
                            0.01,
                            audioContext.currentTime + 0.5
                        )

                        oscillator.start(audioContext.currentTime)
                        oscillator.stop(audioContext.currentTime + 0.5)
                    } catch (error) {}
                }
            }
        })

        socketInstance.on('chatMessageEdited', (message: any) => {
            if (!message.attachments) message.attachments = []
            if (!message.likes) message.likes = []
            message.edited = true
            message.is_edited = true

            if (!message.chat_id) {
                for (const chatId in chatStore.messages) {
                    const chatMessages = chatStore.messages[chatId]
                    const found = chatMessages.find((m: any) => m.id === message.id)
                    if (found) {
                        message.chat_id = parseInt(chatId)
                        break
                    }
                }
            }

            const updated = chatStore.updateMessageById(message.id, message)
            if (!updated) {
                console.error('[SocketManager] Failed to update edited message:', message.id)
            }
        })

        socketInstance.on('chatMessageDeleted', (data: any) => {
            chatStore.removeMessage(data.chat_id, data.id)
            toast.info('A message was deleted')
        })

        socketInstance.on('chatMessageLiked', (data: any) => {
            for (const chatId in chatStore.messages) {
                const chatMessages = chatStore.messages[chatId]
                const messageIndex = chatMessages.findIndex((m: any) => m.id === data.id)

                if (messageIndex !== -1) {
                    const existingMessage = chatMessages[messageIndex]
                    const updatedMessage = {
                        ...existingMessage,
                        likes: data.likes || [],
                        liked_by_current_user: (data.likes || []).some(
                            (like: any) => like.id === userStore.user?.id
                        ),
                    }
                    chatStore.updateMessage(updatedMessage)
                    break
                }
            }
        })

        socketInstance.on('chatMessagePinned', (data: any) => {
            chatStore.updateMessagePin(data.id, data.pinned)
            toast.info(data.pinned ? 'Message pinned' : 'Message unpinned')
        })

        socketInstance.on(
            'chat:typing',
            (data: { chat_id: number; user_id: number; typing: boolean }) => {
                if (data.user_id !== userStore.user?.id) {
                    if (data.typing) {
                        chatStore.addTypingUser(data.chat_id, data.user_id)
                    } else {
                        chatStore.removeTypingUser(data.chat_id, data.user_id)
                    }
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

        socketInstance.on('chatCreated', (chat: any) => {
            chatStore.addOrUpdateChat(chat)
        })

        socketInstance.on('chatUpdated', (chat: any) => {
            chatStore.addOrUpdateChat(chat)
        })
    }

    private setupNotificationListeners(socketInstance: Socket) {
        if (!socketInstance || !process.client) return

        const notificationsStore = useNotificationsStore()
        const toast = useToastNotification()
        const eventBus = useNotificationEventBus()

        socketInstance.on('connected', (data: { userId: number; userName: string }) => {})

        socketInstance.on('notificationNew', (notification: Notification) => {
            notificationsStore.addNotification(notification)

            eventBus.emit(notification)

            toast.info(notification.body || notification.title, notification.title, {
                timeout: 5000,
                position: 'top-right',
            })
        })

        socketInstance.on('notificationUnreadCount', (data: UnreadCountUpdate) => {
            notificationsStore.updateUnreadCount(data.unread_count)
        })

        socketInstance.on('notificationRead', (data: { id: number }) => {
            const notification = notificationsStore.notifications.find((n) => n.id === data.id)
            if (notification) {
                notification.is_read = true
                notificationsStore.unreadCount = Math.max(0, notificationsStore.unreadCount - 1)
            }
        })

        socketInstance.on('notificationsAllRead', () => {
            notificationsStore.notifications.forEach((n) => {
                n.is_read = true
            })
            notificationsStore.unreadCount = 0
        })
    }

    async connect(): Promise<Socket | null> {
        if (!process.client) {
            console.warn('[SocketManager] Cannot connect on server side')
            return null
        }

        if (this.isConnecting.value) {
            return this.connectionPromise
        }

        if (this.socket?.connected) {
            return this.socket
        }

        const userStore = useUserStore()
        const token = userStore.getAuthToken()

        if (!token) {
            console.warn('[SocketManager] No auth token available')
            return null
        }

        this.isConnecting.value = true

        this.connectionPromise = new Promise(async (resolve) => {
            try {
                if (this.socket) {
                    this.socket.disconnect()
                    this.socket = null
                    this.eventListenersSetup = false
                }

                let socketInstance: Socket | null = null
                try {
                    const nuxtApp = useNuxtApp()
                    if (nuxtApp.$socket && typeof nuxtApp.$socket.connect === 'function') {
                        socketInstance = nuxtApp.$socket.connect(token)
                        if (socketInstance) {
                            socketInstance = markRaw(socketInstance) as Socket
                        }
                    }
                } catch (pluginError) {
                    console.warn('[SocketManager] Plugin not available, using direct connection')
                }

                this.socket = socketInstance

                if (!this.socket) {
                    resolve(null)
                    return
                }

                this.setupSocketListeners(this.socket)

                const timeout = setTimeout(() => {
                    resolve(this.socket)
                }, 10000)

                this.socket.once('connect', () => {
                    clearTimeout(timeout)
                    resolve(this.socket)
                })

                this.socket.once('connect_error', () => {
                    clearTimeout(timeout)
                    resolve(null)
                })
            } catch (error) {
                console.error('[SocketManager] Connection failed:', error)
                resolve(null)
            } finally {
                this.isConnecting.value = false
                this.connectionPromise = null
            }
        })

        return this.connectionPromise
    }

    disconnect() {
        if (this.subscribers.size > 0) {
            return
        }
        this.forceDisconnect()
    }

    private forceDisconnect() {
        if (this.socket) {
            try {
                this.socket.disconnect()
            } catch (error) {
                console.error('[SocketManager] Error during disconnect:', error)
            }
            this.socket = null
        }

        this.isConnected.value = false
        this.isConnecting.value = false
        this.eventListenersSetup = false
        this.reconnectAttempts.value = 0
        this.connectionPromise = null
    }

    subscribe(subscriber: SocketSubscriber): string {
        if (!process.client) {
            console.warn('[SocketManager] Cannot subscribe on server side')
            return subscriber.id
        }

        if (this.subscribers.has(subscriber.id)) {
            return subscriber.id
        }

        this.subscribers.set(subscriber.id, subscriber)

        if (this.shouldBeConnected() && !this.socket?.connected && !this.isConnecting.value) {
            this.connect()
        }

        return subscriber.id
    }

    unsubscribe(subscriberId: string) {
        const removed = this.subscribers.delete(subscriberId)
        if (this.subscribers.size === 0) {
            setTimeout(() => {
                if (this.subscribers.size === 0) {
                    this.disconnect()
                }
            }, 100)
        }
        return removed
    }

    emit(event: string, data: any) {
        if (!process.client) {
            console.warn('[SocketManager] Cannot emit on server side')
            return false
        }

        if (!this.socket?.connected) {
            console.warn('[SocketManager] Cannot emit', event, '- not connected')
            return false
        }

        try {
            this.socket.emit(event, data)
            return true
        } catch (error) {
            console.error('[SocketManager] Emit failed:', error)
            return false
        }
    }

    getSocket() {
        return this.socket
    }

    getIsConnected() {
        return computed(() => this.isConnected.value)
    }

    getIsConnecting() {
        return computed(() => this.isConnecting.value)
    }

    getSubscriberCount() {
        return computed(() => this.subscribers.size)
    }
}

let socketManager: SocketManager | null = null

const getSocketManager = () => {
    if (!process.client) {
        return {
            getIsConnected: () => computed(() => false),
            getIsConnecting: () => computed(() => false),
            getSubscriberCount: () => computed(() => 0),
            subscribe: () => '',
            unsubscribe: () => {},
            emit: () => false,
            getSocket: () => null,
        }
    }

    if (!socketManager) {
        socketManager = new SocketManager()
    }
    return socketManager
}

export const useSocketManager = () => {
    const manager = getSocketManager()
    const userStore = useUserStore()
    const instanceId = `socket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    let subscriberId: string | null = null

    const isConnected = manager.getIsConnected()
    const isConnecting = manager.getIsConnecting()
    const subscriberCount = manager.getSubscriberCount()

    const subscribe = (
        type: 'chat' | 'notifications' | 'mixed' = 'mixed',
        onDisconnect?: () => void
    ) => {
        if (!process.client) return ''

        if (subscriberId) {
            return subscriberId
        }

        subscriberId = manager.subscribe({
            id: instanceId,
            type,
            onDisconnect,
        })

        return subscriberId
    }

    const unsubscribe = () => {
        if (!process.client) return

        if (subscriberId) {
            manager.unsubscribe(subscriberId)
            subscriberId = null
        }
    }

    if (process.client) {
        watch(
            () => userStore.isAuthenticated,
            async (isAuth) => {
                if (isAuth && !subscriberId) {
                    await nextTick()
                    subscribe()
                } else if (!isAuth && subscriberId) {
                    unsubscribe()
                }
            },
            { immediate: true }
        )
    }

    if (process.client && getCurrentInstance()) {
        onUnmounted(() => {
            unsubscribe()
        })
    }

    return {
        isConnected,
        isConnecting,
        subscriberCount,
        subscribe,
        unsubscribe,
        emit: (event: string, data: any) => manager.emit(event, data),

        emitTyping: (chatId: number, typing: boolean) =>
            manager.emit('chat:typing', { chat_id: chatId, typing }),
        emitRead: (chatId: number) => manager.emit('chat:read', { chat_id: chatId }),
        joinChat: (chatId: number) => manager.emit('chat:join', { chat_id: chatId }),
        leaveChat: (chatId: number) => manager.emit('chat:leave', { chat_id: chatId }),

        markNotificationRead: (notificationId: number) =>
            manager.emit('notification:read', { id: notificationId }),
        markAllNotificationsRead: () => manager.emit('notifications:readAll'),
    }
}
