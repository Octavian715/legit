<template>
    <!-- ADD h-full here -->
    <div class="flex-1 flex flex-col bg-white rounded-b-md lg:rounded-md h-full">
        <div
            v-if="!hideHeader"
            class="m-3 p-3 bg-gray-100 rounded-md border border-gray-600 flex items-center justify-between"
        >
            <div class="flex items-center gap-3">
                <Avatar
                    :image-url="participantAvatar"
                    :initials="getParticipantInitials()"
                    size="lg"
                    :color="getParticipantAvatarColor()"
                />
                <div class="flex flex-col">
                    <div class="text-subtitle1 font-semibold text-gray-900">
                        {{ participantName }}
                    </div>
                    <div class="text-caption1 text-gray-600">{{ participantCompany }}</div>
                </div>
            </div>

            <div class="flex items-center space-x-2">
                <button
                    class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="View profile"
                    @click="toggleProfile"
                >
                    <svg
                        class="h-6 w-6 text-gray-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </button>
            </div>
        </div>

        <div
            ref="messagesContainer"
            class="flex-1 min-h-0 overflow-y-auto px-4 py-4 messages-container"
            @scroll="handleScroll"
        >
            <!-- All existing content remains the same -->
            <div v-if="loadingMessages" class="space-y-4">
                <!-- Loading skeleton -->
            </div>

            <div
                v-if="
                    !loadingMessages &&
                    activeChat &&
                    hasMoreMessages &&
                    hasMoreMessages[activeChat.id]
                "
                class="text-center mb-4"
            >
                <Button
                    :label="$t('chat.loadEarlierMessages')"
                    variant="ghost"
                    color="blue"
                    size="sm"
                    font-weight="normal"
                    @click="loadMoreMessages"
                />
            </div>

            <div v-if="!loadingMessages">
                <div v-for="(group, date) in groupedMessages" :key="date" class="mb-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="bg-gray-150 rounded-full px-3 py-1 text-caption1 text-gray-700">
                            {{ formatMessageDate(date) }}
                        </div>
                    </div>

                    <MessageItem
                        v-for="message in group"
                        :key="message.id"
                        :message="message"
                        :is-own="isOwnMessage(message)"
                        @action="handleLocalMessageAction"
                        @reply="setReplyingTo"
                    />
                </div>
            </div>

            <div
                v-if="
                    !loadingMessages &&
                    activeChat &&
                    typingUsersList &&
                    typingUsersList(activeChat.id).length > 0
                "
                class="flex items-center space-x-2 text-gray-500 mb-4"
            >
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="text-subtitle3">{{ getTypingText() }}</span>
            </div>
        </div>

        <MessageInput
            :replying-to="replyingTo"
            :editing-message="editingMessage"
            :disabled="loadingMessages"
            @cancel-reply="handleCancelReply"
            @cancel-edit="handleCancelEdit"
            @send="handleSendMessage"
        />
    </div>
</template>

<script setup lang="ts">
    // Script remains exactly the same
    import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
    import { storeToRefs } from 'pinia'
    import { useChatStore } from '~/stores/chat'
    import { useUserStore } from '~/stores/user'
    import { useChat } from '~/composables/socket/useChat'
    import { useSocketManager } from '~/composables/socket/useSocketManager'
    import type { ChatMessage } from '~/types/chat'

    const props = defineProps<{
        mobileMode?: boolean
        hideHeader?: boolean
    }>()

    const chatStore = useChatStore()
    const userStore = useUserStore()
    const {
        activeChat,
        activeChatMessages,
        loadingMessages,
        hasMoreMessages,
        typingUsersList,
        activeChatParticipant,
    } = storeToRefs(chatStore)

    const chat = useChat()

    const {
        replyingTo,
        editingMessage,
        handleMessageAction,
        loadMoreMessages,
        formatMessageDate,
        isOwnMessage,
        handleSendMessage,
    } = chat

    const { emitRead, joinChat, leaveChat } = useSocketManager()

    const messagesContainer = ref<HTMLElement>()
    const isUserScrolling = ref(false)
    const lastMessageCount = ref(0)

    const participantName = computed(() => {
        return activeChatParticipant.value?.name || 'Unknown User'
    })

    const participantCompany = computed(() => {
        return activeChatParticipant.value?.company || ''
    })

    const participantAvatar = computed(() => {
        return activeChatParticipant.value?.avatar
    })

    const getParticipantInitials = () => {
        const name = participantName.value
        const words = name.split(' ')
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    const getParticipantAvatarColor = () => {
        const colors = [
            'bg-blue-400',
            'bg-green-400',
            'bg-yellow-400',
            'bg-red-400',
            'bg-purple-400',
        ]
        const index = participantName.value.charCodeAt(0) % colors.length
        return colors[index]
    }

    const groupedMessages = computed(() => {
        const groups: Record<string, ChatMessage[]> = {}

        activeChatMessages.value.forEach((message) => {
            const date = message.created_at.split('T')[0]
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push(message)
        })

        return groups
    })

    const setReplyingTo = (message: ChatMessage) => {
        replyingTo.value = message
        editingMessage.value = null
    }

    const handleCancelReply = () => {
        replyingTo.value = null
    }

    const handleCancelEdit = () => {
        editingMessage.value = null
        chat.messageInput.value = ''
    }

    const toggleProfile = () => {
        chatStore.toggleProfile()
        if (activeChatParticipant.value) {
            chatStore.setSelectedUser(activeChatParticipant.value)
        }
    }

    const isScrolledToBottom = () => {
        if (!messagesContainer.value || !process.client) return false
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
        return scrollHeight - scrollTop - clientHeight < 100
    }

    const handleScroll = () => {
        if (!messagesContainer.value || !activeChat.value || !process.client) return

        const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value

        isUserScrolling.value = scrollHeight - scrollTop - clientHeight > 100

        if (
            scrollTop === 0 &&
            hasMoreMessages.value &&
            hasMoreMessages.value[activeChat.value.id]
        ) {
            loadMoreMessages()
        }
    }

    const getTypingText = () => {
        if (!activeChat.value || !typingUsersList.value) return ''

        const typingUsers = typingUsersList.value(activeChat.value.id)
        const { t } = useI18n()

        if (typingUsers.length === 1) {
            return t('chat.userIsTyping', { user: typingUsers[0] })
        } else if (typingUsers.length === 2) {
            return t('chat.usersAreTyping', { users: typingUsers.join(' and ') })
        } else {
            return t('chat.severalPeopleTyping')
        }
    }

    const scrollToBottom = (force = false) => {
        if (!process.client) return
        if (!force && isUserScrolling.value) return

        nextTick(() => {
            if (messagesContainer.value) {
                messagesContainer.value.scrollTo({
                    top: messagesContainer.value.scrollHeight,
                    behavior: 'smooth',
                })
            }
        })
    }

    const handleLocalMessageAction = async (action: string, message: ChatMessage) => {
        if (action === 'edit') {
            editingMessage.value = message
            replyingTo.value = null
            chat.messageInput.value = message.content || ''
        } else {
            await handleMessageAction(action as any, message)
        }
    }

    watch(activeChat, async (newChat, oldChat) => {
        if (!process.client) return

        if (oldChat) {
            leaveChat(oldChat.id)
        }

        if (newChat) {
            isUserScrolling.value = false
            joinChat(newChat.id)
            emitRead(newChat.id)

            if (!chatStore.messages || !chatStore.messages[newChat.id]) {
                await chatStore.fetchMessages(newChat.id)
            }

            lastMessageCount.value = activeChatMessages.value.length
            scrollToBottom(true)
        }

        editingMessage.value = null
        replyingTo.value = null
        chat.messageInput.value = ''
    })

    watch(
        activeChatMessages,
        (newMessages) => {
            if (!process.client) return

            const wasAtBottom = isScrolledToBottom()
            const isNewMessage = newMessages.length > lastMessageCount.value

            lastMessageCount.value = newMessages.length

            if (wasAtBottom || isNewMessage) {
                scrollToBottom()
            }
        },
        { deep: true }
    )

    onMounted(() => {
        if (process.client && activeChat.value) {
            lastMessageCount.value = activeChatMessages.value.length
        }
    })

    onUnmounted(() => {
        if (process.client && activeChat.value) {
            leaveChat(activeChat.value.id)
        }
    })
</script>

<style scoped>
    .messages-container {
        scroll-behavior: smooth;
    }

    .typing-indicator {
        display: flex;
        align-items: center;
    }

    .typing-indicator span {
        height: 6px;
        width: 6px;
        background-color: #9ca3af;
        border-radius: 50%;
        display: inline-block;
        margin-right: 3px;
        animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%,
        60%,
        100% {
            transform: translateY(0);
            opacity: 0.4;
        }
        30% {
            transform: translateY(-4px);
            opacity: 1;
        }
    }

    .message-item.highlight {
        animation: highlight 2s ease-in-out;
    }

    @keyframes highlight {
        0%,
        100% {
            background-color: transparent;
        }
        50% {
            background-color: #fef3c7;
        }
    }
</style>
