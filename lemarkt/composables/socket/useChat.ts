import { useLocalePath } from '#imports'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { ChatMessage, MessageAction, SendMessagePayload } from '~/types/chat'
import { useChatStore } from '~/stores/chat'
import { useUserStore } from '~/stores/user'
import { useSocketManager } from '~/composables/socket/useSocketManager'
import { useThrottleFn } from '@vueuse/core'
import { useDate } from '~/composables/useDate'

// Global state to prevent multiple initializations
let globalChatInitialized = false
let globalInitializationPromise: Promise<boolean> | null = null

export const useChat = () => {
    const chatStore = useChatStore()
    const userStore = useUserStore()
    const toast = useToastNotification()
    const socketManager = useSocketManager()
    const localePath = useLocalePath()
    const { t } = useI18n()

    // Input state
    const messageInput = ref('')
    const replyingTo = ref<ChatMessage | null>(null)
    const editingMessage = ref<ChatMessage | null>(null)
    const attachments = ref<File[]>([])
    const isRecording = ref(false)
    const showEmojiPicker = ref(false)
    const showActions = ref<number | null>(null)
    const loadingNewChat = ref<boolean>(false)
    const chatInitialized = ref(globalChatInitialized)

    // Computed properties
    const canSendMessage = computed(() => {
        return (
            (messageInput.value.trim().length > 0 || attachments.value.length > 0) &&
            !chatStore.sendingMessage
        )
    })

    const isConnected = computed(() => socketManager.isConnected.value)
    const isConnecting = computed(() => socketManager.isConnecting.value)

    const handleStartChat = async (userId: number, module: string): Promise<void> => {
        if (!userId) {
            toast.warning(t('chat.userNotFound'))
            return
        }

        // Check if users are connected (optional - remove if not required)
        // if (!connectionState.value.isConnected) {
        //     toast.warning(t('connections.mustBeConnectedToChat'))
        //     return
        // }

        loadingNewChat.value = true

        try {
            // Fetch or create direct chat with the supplier
            const chat = await chatStore.fetchOrCreateDirectChat(userId)

            if (chat) {
                // Navigate to messages page - the chat will be active

                switch (module) {
                    case 'supplier':
                        await navigateTo(localePath('/supplier/chat'))

                        break
                    case 'buyer':
                        await navigateTo(localePath('/buyer/chat'))
                    default:
                        await navigateTo(localePath('/chat'))
                }
            } else {
                throw new Error('Failed to create chat')
            }
        } catch (error: any) {
            console.error('Failed to start chat:', error)
            toast.error(t('chat.failedToStartChat', 'Failed to start chat. Please try again.'))
        } finally {
            loadingNewChat.value = false
        }
    }

    const handleSendMessage = async () => {
        if (!canSendMessage.value) return

        // Check if editing
        if (editingMessage.value) {
            const messageId = editingMessage.value.id
            const newContent = messageInput.value.trim()

            // Don't send if no changes
            if (editingMessage.value.content === newContent) {
                toast?.warning('No changes made to the message')
                return
            }

            try {
                // Call edit API
                await chatStore.editMessage(messageId, newContent)

                // Clear edit state
                editingMessage.value = null
                messageInput.value = ''

                // Don't show success toast - let the socket update handle it
            } catch (error: any) {
                console.error('[useChat] Edit error:', error)
                toast?.error(error.message || 'Failed to edit message')
            }

            return // Important: exit here for edits
        }

        // Handle new message
        if (!chatStore.activeChat && !replyingTo.value) {
            toast?.warning('Please select a conversation first')
            return
        }

        try {
            const payload: SendMessagePayload = {
                content: messageInput.value.trim(),
                chat_id: chatStore.activeChat?.id,
                reply_to_id: replyingTo.value?.id,
                files: attachments.value.length > 0 ? attachments.value : undefined,
            }

            await chatStore.sendMessage(payload)

            // Clear input
            messageInput.value = ''
            replyingTo.value = null
            attachments.value = []
            showEmojiPicker.value = false
        } catch (error: any) {
            console.error('[useChat] Send error:', error)
            toast?.error(error.message || 'Failed to send message')
        }
    }

    const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleSendMessage()
        }

        // ESC key to cancel edit/reply
        if (event.key === 'Escape') {
            if (editingMessage.value) {
                cancelEdit()
            } else if (replyingTo.value) {
                cancelReply()
            }
        }
    }

    const handleMessageAction = async (action: MessageAction, message: ChatMessage) => {
        showActions.value = null

        try {
            switch (action) {
                case 'edit':
                    if (message.sender.id === userStore.user?.id && !message.is_deleted) {
                        // Set editing state
                        editingMessage.value = message
                        messageInput.value = message.content || ''
                        // Clear reply if editing
                        replyingTo.value = null

                        // Focus input
                        nextTick(() => {
                            const input = document.querySelector('textarea') as HTMLTextAreaElement
                            if (input) {
                                input.focus()
                                input.setSelectionRange(input.value.length, input.value.length)
                            }
                        })
                    } else {
                        toast?.warning('You can only edit your own messages')
                    }
                    break

                case 'delete':
                    if (message.sender.id === userStore.user?.id) {
                        const confirmed = window.confirm(
                            'Are you sure you want to delete this message?'
                        )
                        if (confirmed) {
                            await chatStore.deleteMessage(message.id)

                            // Clear edit state if deleting the message being edited
                            if (editingMessage.value?.id === message.id) {
                                cancelEdit()
                            }

                            toast?.success('Message deleted')
                        }
                    } else {
                        toast?.warning('You can only delete your own messages')
                    }
                    break

                case 'reply':
                    replyingTo.value = message
                    // Clear edit if replying
                    editingMessage.value = null
                    messageInput.value = ''

                    // Focus input
                    nextTick(() => {
                        const input = document.querySelector('textarea') as HTMLTextAreaElement
                        if (input) input.focus()
                    })
                    break

                case 'pin':
                    await chatStore.togglePin(message.id, !message.pinned)
                    toast?.success(message.pinned ? 'Message unpinned' : 'Message pinned')
                    break

                case 'like':
                case 'unlike':
                    await chatStore.toggleLike(message.id)
                    break

                case 'copy':
                    if (message.content) {
                        await navigator.clipboard.writeText(message.content)
                        toast?.success('Message copied to clipboard')
                    }
                    break

                default:
                    console.warn(`Unknown message action: ${action}`)
            }
        } catch (error: any) {
            console.error(`[useChat] Action ${action} failed:`, error)
            toast?.error(error.message || `Failed to ${action} message`)
        }
    }

    // File handling
    const handleFileSelect = (event: Event) => {
        const input = event.target as HTMLInputElement
        if (input.files) {
            const newFiles = Array.from(input.files)

            const maxSize = 10 * 1024 * 1024 // 10MB
            const maxFiles = 10

            const oversizedFiles = newFiles.filter((file) => file.size > maxSize)
            if (oversizedFiles.length > 0) {
                toast?.warning(
                    `${oversizedFiles.length} file(s) exceed the 10MB limit and were not added`
                )
                return
            }

            if (attachments.value.length + newFiles.length > maxFiles) {
                toast?.warning(`You can only attach up to ${maxFiles} files`)
                return
            }

            attachments.value = [...attachments.value, ...newFiles]
        }

        // Reset input
        input.value = ''
    }

    const removeAttachment = (index: number) => {
        attachments.value.splice(index, 1)
    }

    // Edit/Reply management
    const cancelEdit = () => {
        editingMessage.value = null
        messageInput.value = ''
    }

    const cancelReply = () => {
        replyingTo.value = null
    }

    // Message loading
    const loadMoreMessages = async () => {
        if (!chatStore.activeChat || chatStore.loadingMessages) return

        const messages = chatStore.activeChatMessages
        if (messages.length === 0) return

        const oldestMessage = messages[0]
        try {
            await chatStore.fetchMessages(chatStore.activeChat.id, {
                before: oldestMessage.id,
                limit: 50,
            })
        } catch (error: any) {
            toast?.error('Failed to load more messages')
        }
    }

    // Formatting utilities
    const formatMessageTime = (date: string) => {
        const { formatDate } = useDate()
        return formatDate(date, 'HH:mm')
    }

    const formatMessageDate = (date: string) => {
        const { formatDate, areDatesEqual } = useDate()
        const today = new Date()
        const messageDate = new Date(date)

        if (areDatesEqual(today, messageDate)) {
            return 'Today'
        }

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (areDatesEqual(yesterday, messageDate)) {
            return 'Yesterday'
        }

        return formatDate(date, 'dd.MM.yyyy')
    }

    const isOwnMessage = (message: ChatMessage) => {
        return message.sender.id === userStore.user?.id
    }

    // UI utilities
    const scrollToBottom = () => {
        nextTick(() => {
            const messagesContainer = document.querySelector('.messages-container')
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
        })
    }

    const scrollToMessage = (messageId: number) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            messageElement.classList.add('highlight')
            setTimeout(() => {
                messageElement.classList.remove('highlight')
            }, 2000)
        }
    }

    const searchInMessages = (query: string) => {
        if (!query || !chatStore.activeChat) return []

        const messages = chatStore.activeChatMessages
        return messages.filter(
            (message) =>
                message.content?.toLowerCase().includes(query.toLowerCase()) && !message.is_deleted
        )
    }

    // Socket-powered typing functionality
    let typingTimeout: NodeJS.Timeout | null = null
    const handleTyping = useThrottleFn(() => {
        if (!chatStore.activeChat || !isConnected.value) return

        // Don't emit typing when editing
        if (editingMessage.value) return

        // Emit typing start
        socketManager.emitTyping(chatStore.activeChat.id, true)

        // Clear existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        // Set timeout to stop typing after 3 seconds
        typingTimeout = setTimeout(() => {
            if (chatStore.activeChat) {
                socketManager.emitTyping(chatStore.activeChat.id, false)
            }
            typingTimeout = null
        }, 3000)
    }, 500)

    // Socket-powered chat management
    const joinCurrentChat = () => {
        if (chatStore.activeChat && isConnected.value) {
            socketManager.joinChat(chatStore.activeChat.id)
        }
    }

    const leaveCurrentChat = () => {
        if (chatStore.activeChat && isConnected.value) {
            socketManager.leaveChat(chatStore.activeChat.id)
        }
    }

    const markCurrentChatAsRead = () => {
        if (chatStore.activeChat && isConnected.value) {
            socketManager.emitRead(chatStore.activeChat.id)
            chatStore.markChatAsRead(chatStore.activeChat.id)
        }
    }

    const reset = () => {
        try {
            chatInitialized.value = false
            globalChatInitialized = false
            globalInitializationPromise = null

            // Clear state
            messageInput.value = ''
            replyingTo.value = null
            editingMessage.value = null
            attachments.value = []
            isRecording.value = false
            showEmojiPicker.value = false
            showActions.value = null

            // Clear typing timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout)
                typingTimeout = null
            }
        } catch (error) {
            console.error('[useChat] Error during reset:', error)
        }
    }

    // Chat connection management
    const initializeChat = async (): Promise<boolean> => {
        if (userStore.isRegistrationComplete && !userStore.isVerified) {
            return false
        }

        if (globalChatInitialized) {
            chatInitialized.value = true
            return true
        }

        if (globalInitializationPromise) {
            return await globalInitializationPromise
        }

        try {
            globalInitializationPromise = new Promise(async (resolve) => {
                try {
                    // Load chats if not already loaded
                    if (chatStore.chats.length === 0) {
                        await chatStore.fetchChats()
                    }

                    // Mark as initialized
                    globalChatInitialized = true
                    chatInitialized.value = true

                    resolve(true)
                } catch (error: any) {
                    console.error('[useChat] Initialization failed:', error)
                    globalChatInitialized = false
                    chatInitialized.value = false
                    globalInitializationPromise = null
                    toast?.error('Failed to initialize chat')
                    resolve(false)
                }
            })

            return await globalInitializationPromise
        } catch (error: any) {
            console.error('[useChat] Initialization error:', error)
            globalChatInitialized = false
            chatInitialized.value = false
            globalInitializationPromise = null
            return false
        }
    }

    // Watchers
    watch(
        () => chatStore.activeChat,
        (newChat, oldChat) => {
            // Clear edit/reply state when switching chats
            cancelEdit()
            cancelReply()

            // Leave old chat room
            if (oldChat && isConnected.value) {
                socketManager.leaveChat(oldChat.id)
            }

            // Join new chat room
            if (newChat && isConnected.value) {
                socketManager.joinChat(newChat.id)
                markCurrentChatAsRead()
                scrollToBottom()
            }
        },
        { immediate: true }
    )

    // Socket connection watcher
    watch(isConnected, (connected) => {
        if (connected && chatStore.activeChat) {
            // Rejoin chat room when connection is restored
            socketManager.joinChat(chatStore.activeChat.id)
        }
    })

    // Lifecycle hooks
    onMounted(() => {
        if (chatStore.activeChat) {
            scrollToBottom()
            joinCurrentChat()
            markCurrentChatAsRead()
        }
    })

    onUnmounted(() => {
        // Clean up typing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        // Clear edit/reply state
        cancelEdit()
        cancelReply()

        // Leave current chat room
        leaveCurrentChat()
    })

    return {
        // State
        messageInput,
        replyingTo,
        editingMessage,
        attachments,
        isRecording,
        showEmojiPicker,
        showActions,
        chatInitialized,
        loadingNewChat,

        // Computed
        canSendMessage,
        isConnected,
        isConnecting,

        // Message actions
        handleSendMessage,
        handleKeyPress,
        handleMessageAction,
        handleStartChat,

        // File handling
        handleFileSelect,
        removeAttachment,

        // Edit/Reply
        cancelEdit,
        cancelReply,

        // Message management
        loadMoreMessages,
        searchInMessages,

        // Formatting
        formatMessageTime,
        formatMessageDate,
        isOwnMessage,

        // UI utilities
        scrollToBottom,
        scrollToMessage,

        // Typing
        handleTyping,

        // Chat management
        joinCurrentChat,
        leaveCurrentChat,
        markCurrentChatAsRead,
        initializeChat,
        reset,
    }
}
