<template>
    <div
        :class="[
            'bg-white flex flex-col rounded-md p-3 space-y-2 h-full',
            mobileMode ? 'w-full' : 'w-80',
        ]"
    >
        <!-- <div> -->
        <InputSearch
            v-model="searchQuery"
            :placeholder="$t('chat.searchPlaceholder')"
            size="md"
            background="bg-gray-100"
            @search="handleSearch"
        />

        <!-- <div class="flex gap-2">
                <Button
                    v-for="filter in filters"
                    :key="filter.id"
                    :label="$t(`chat.filters.${filter.id}`)"
                    :variant="activeFilters.includes(filter.id) ? 'outline' : 'ghost'"
                    :color="activeFilters.includes(filter.id) ? 'blue' : 'gray'"
                    size="sm"
                    font-weight="normal"
                    container-classes="text-subtitle4 flex-1 text-nowrap"
                    @click="toggleFilter(filter.id)"
                />
            </div> -->
        <!-- </div> -->

        <!-- Add max-height and scrollbar styling -->
        <div class="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <!-- Rest of the content remains the same -->
            <div
                v-if="loadingChats || (!hasTriedToLoad && filteredChats.length === 0)"
                class="py-2 space-y-2"
            >
                <!-- Loading skeleton -->
                <div
                    v-for="i in 5"
                    :key="i"
                    class="flex flex-col gap-2 p-3 border border-gray-300 rounded-sm animate-pulse"
                >
                    <div class="relative flex items-center gap-2">
                        <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div class="flex flex-col gap-0 flex-1">
                            <div class="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                            <div class="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                        <div class="h-3 bg-gray-300 rounded w-12"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <div class="h-3 bg-gray-300 rounded flex-1 mr-2"></div>
                            <div class="w-5 h-5 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-else-if="hasTriedToLoad && filteredChats.length === 0"
                class="py-9 text-center space-y-2"
            >
                <img
                    src="/images/content/no-message.svg"
                    width="200"
                    height="150"
                    alt="No messages"
                    class="mx-auto"
                    loading="lazy"
                />

                <div class="text-gray-950 text-title2 mb-2">{{ $t('chat.noConversations') }}</div>
                <div class="text-gray-800 text-body">{{ $t('chat.startNewConversation') }}</div>
            </div>

            <div v-else class="py-2 space-y-2">
                <div
                    v-if="searchQuery?.length && filteredChats.length"
                    class="text-center bg-blue-100 text-blue-500 text-subtitle2 py-0.5 rounded transition-all duration-200"
                >
                    {{ $t('chat.message.messageFound', { count: filteredChats.length }) }}
                </div>
                <div
                    v-for="chat in filteredChats"
                    :key="chat.id"
                    :class="[
                        'group flex flex-col gap-2 p-3 border cursor-pointer rounded-sm',
                        'transition-all duration-200 ease-in-out',
                        'hover:bg-blue-300 hover:text-white hover:border-blue-300',
                        isActive(chat)
                            ? 'bg-blue-300 border-blue-300 text-white'
                            : 'text-gray-950 border-gray-600 hover:shadow-sm',
                    ]"
                    @click="handleChatClick(chat)"
                >
                    <div class="relative flex items-center gap-2">
                        <Avatar
                            :image-url="getChatAvatar(chat)"
                            :initials="getChatInitials(chat)"
                            size="base"
                            :color="getAvatarColor(chat)"
                        />
                        <div class="flex flex-col gap-0 flex-1 min-w-0 overflow-hidden">
                            <div
                                v-tooltip="getChatName(chat)"
                                class="text-subtitle1 font-medium truncate transition-colors duration-200"
                            >
                                {{ getChatName(chat) }}
                            </div>
                            <div
                                class="text-caption1 flex-shrink-0 transition-colors duration-200"
                                :class="[
                                    !isActive(chat)
                                        ? 'text-gray-800 group-hover:text-gray-200'
                                        : 'text-gray-200',
                                ]"
                            >
                                {{ chat.name }}
                            </div>
                        </div>
                        <div
                            class="text-body flex-shrink-0 ml-auto my-auto transition-colors duration-200"
                            :class="[
                                !isActive(chat)
                                    ? 'text-gray-800 group-hover:text-gray-200'
                                    : 'text-gray-200',
                            ]"
                        >
                            {{ formatChatTime(chat.last_message_at || chat.created_at) }}
                        </div>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <div
                                class="text-body truncate flex-1 mr-2 transition-colors duration-200"
                            >
                                <span v-if="isTyping(chat.id)" class="text-green-600 italic">
                                    {{ $t('chat.typing') }}...
                                </span>
                                <span v-else>
                                    {{ getLastMessagePreview(chat) }}
                                </span>
                            </div>

                            <div
                                v-if="chat.unread_count > 0"
                                class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-body rounded-full flex-shrink-0 transition-all duration-200"
                                :class="[
                                    isActive(chat)
                                        ? 'bg-white text-blue-500'
                                        : 'bg-blue-500 text-white group-hover:bg-white group-hover:text-blue-500',
                                ]"
                            >
                                {{ chat.unread_count > 99 ? '99+' : chat.unread_count }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // Script remains exactly the same - no changes needed
    import { ref, computed, onMounted } from 'vue'
    import { storeToRefs } from 'pinia'
    import { useChatStore } from '~/stores/chat'
    import { useUserStore } from '~/stores/user'
    import { useDebounceFn } from '@vueuse/core'
    import type { Chat } from '~/types/chat'
    import { useDate } from '~/composables/useDate'

    const props = defineProps<{
        mobileMode?: boolean
    }>()

    const emit = defineEmits<{
        'select-chat': [chat: Chat]
    }>()

    const chatStore = useChatStore()
    const userStore = useUserStore()
    const { filteredChats, activeChat, loadingChats, isTyping, chats } = storeToRefs(chatStore)

    const searchQuery = ref('')
    const activeFilters = ref<string[]>(['all'])
    const hasTriedToLoad = ref(false)

    const filters = [
        { id: 'all', label: 'All Messages' },
        { id: 'unread', label: 'New messages' },
        { id: 'selected', label: 'Selected' },
    ]

    onMounted(async () => {
        if (process.client) {
            if (chats.value.length === 0 && !loadingChats.value) {
                try {
                    await chatStore.fetchChats()
                } catch (error) {
                    console.error('Failed to load chats:', error)
                } finally {
                    hasTriedToLoad.value = true
                }
            } else {
                hasTriedToLoad.value = true
            }
        }
    })

    const handleSearch = useDebounceFn(() => {
        chatStore.setFilters({
            search: searchQuery.value,
            unread: activeFilters.value.includes('unread'),
        })
    }, 300)

    const toggleFilter = (filterId: string) => {
        if (filterId === 'all') {
            activeFilters.value = ['all']
            chatStore.setFilters({ search: searchQuery.value })
        } else {
            const filtered = activeFilters.value.filter((f) => f !== 'all')

            if (filtered.includes(filterId)) {
                activeFilters.value = filtered.filter((f) => f !== filterId)
                if (activeFilters.value.length === 0) {
                    activeFilters.value = ['all']
                }
            } else {
                activeFilters.value = [...filtered, filterId]
            }

            chatStore.setFilters({
                search: searchQuery.value,
                unread: activeFilters.value.includes('unread'),
                selected: activeFilters.value.includes('selected'),
            })
        }
    }

    const handleChatClick = async (chat: Chat) => {
        if (props.mobileMode) {
            emit('select-chat', chat)
        } else {
            await selectChat(chat)
        }
    }

    const selectChat = async (chat: Chat) => {
        await chatStore.setActiveChat(chat)

        if (!chatStore.messages || !chatStore.messages[chat.id]) {
            await chatStore.fetchMessages(chat.id)
        }
    }

    const isActive = (chat: Chat) => {
        if (props.mobileMode) return false
        return activeChat.value?.id === chat.id
    }

    const getChatName = (chat: Chat) => {
        if (chat.name) return chat.name

        const otherParticipant = chat.participants.find((p) => p.id !== userStore.user?.id)
        return otherParticipant?.name || 'Unknown'
    }

    const getChatAvatar = (chat: Chat) => {
        if (chat.is_direct) {
            const otherParticipant = chat.participants.find((p) => p.id !== userStore.user?.id)
            return otherParticipant?.avatar_url
        }

        return chat.avatar_url
    }

    const getChatInitials = (chat: Chat) => {
        const name = getChatName(chat)
        const words = name.split(' ')
        if (words.length >= 2) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    const getAvatarColor = (chat: Chat) => {
        const colors = [
            'bg-blue-400',
            'bg-green-400',
            'bg-yellow-400',
            'bg-red-400',
            'bg-purple-400',
        ]
        const index = String(chat.id).charCodeAt(0) % colors.length
        return colors[index]
    }

    const formatChatTime = (date: string) => {
        const { formatDate, areDatesEqual } = useDate()
        const today = new Date()
        const messageDate = new Date(date)

        if (areDatesEqual(today, messageDate)) {
            return formatDate(date, 'HH:mm')
        }

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (areDatesEqual(yesterday, messageDate)) {
            return 'Yesterday'
        }

        return formatDate(date, 'dd.MM')
    }

    const getLastMessagePreview = (chat: Chat): string => {
        const { t } = useI18n()

        // No last_message_at means no messages at all

        if (!chat.last_message_at) {
            return t('chat.noMessages')
        }

        const lastMessage = chat.last_message

        // Has text content - show it

        if (lastMessage?.content) {
            return lastMessage.content
        }

        // last_message_at exists but content is null - means there are attachments

        if (chat.last_message_at && (!lastMessage || !lastMessage.content)) {
            // If we have attachments info, use it

            if (lastMessage?.attachments && lastMessage.attachments.length > 0) {
                const count = lastMessage.attachments.length

                const fileType = lastMessage.attachments[0].file_type

                if (fileType === 'image') {
                    return count === 1
                        ? t('chat.sentAnImage', '📷 Sent an image')
                        : t('chat.sentImages', { count }, `📷 Sent ${count} images`)
                } else if (fileType === 'document') {
                    return count === 1
                        ? t('chat.sentADocument', '📄 Sent a document')
                        : t('chat.sentDocuments', { count }, `📄 Sent ${count} documents`)
                } else {
                    return count === 1
                        ? t('chat.sentAFile', '📎 Sent a file')
                        : t('chat.sentFiles', { count }, `📎 Sent ${count} files`)
                }
            }

            // No attachments info available but last_message_at exists - assume attachment

            return t('chat.sentAttachment', '📎 Sent an attachment')
        }

        return t('chat.noMessages')
    }
</script>
