<template>
    <div class="max-h-full">
        <!-- Desktop Layout (lg and up) -->
        <div class="hidden lg:flex gap-2" :style="{ height: desktopHeight }">
            <ConversationList @select-chat="handleDesktopChatSelect" />

            <div class="flex-1 flex gap-2">
                <MessagePanel v-if="activeChat" />

                <div v-else class="flex-1 flex items-center justify-center bg-white rounded-md">
                    <div class="text-center space-y-3">
                        <svg
                            class="mx-auto h-12 w-12 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>

                        <div class="text-gray-950 text-title2 mb-2">
                            {{ $t('chat.noConversationSelected') }}
                        </div>
                        <div class="text-gray-800 text-body">
                            {{ $t('chat.getStartedBySelectingConversation') }}
                        </div>
                    </div>
                </div>

                <UserProfileSidebar v-if="profileOpen" />
            </div>
        </div>

        <!-- Mobile Layout (below lg) -->
        <div class="block lg:hidden relative overflow-hidden" :style="{ height: mobileHeight }">
            <!-- Loading State -->
            <div
                v-if="isLoadingFromRoute"
                class="absolute inset-0 flex items-center justify-center bg-white rounded-md z-10"
            >
                <div class="text-center">
                    <div
                        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
                    ></div>
                    <div class="text-gray-600">Loading conversation...</div>
                </div>
            </div>

            <!-- Content (hidden while loading) -->
            <div v-show="!isLoadingFromRoute" class="h-full">
                <Transition :name="transitionName" mode="out-in">
                    <!-- Chat List View -->
                    <div v-if="currentMobileView === 'list'" key="list" class="absolute inset-0">
                        <ConversationList
                            :mobile-mode="true"
                            @select-chat="handleMobileChatSelect"
                        />
                    </div>

                    <!-- Conversation View -->
                    <div
                        v-else-if="currentMobileView === 'conversation'"
                        key="conversation"
                        class="absolute inset-0 flex flex-col"
                    >
                        <div
                            class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 rounded-t-md"
                        >
                            <button
                                class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                aria-label="Go back"
                                @click="goBack"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>

                            <div v-if="activeChat" class="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar
                                    :image-url="participantAvatar"
                                    :initials="getParticipantInitials()"
                                    size="base"
                                    :color="getParticipantAvatarColor()"
                                />
                                <div class="flex flex-col min-w-0 flex-1">
                                    <div
                                        class="text-subtitle1 font-semibold text-gray-900 truncate"
                                    >
                                        {{ participantName }}
                                    </div>
                                    <div class="text-caption1 text-gray-600 truncate">
                                        {{ participantCompany }}
                                    </div>
                                </div>
                            </div>

                            <button
                                class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                aria-label="View profile"
                                @click="handleProfileClick"
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

                        <div class="flex-1 min-h-0 overflow-hidden">
                            <MessagePanel :mobile-mode="true" :hide-header="true" />
                        </div>
                    </div>

                    <!-- Profile View -->
                    <div
                        v-else-if="currentMobileView === 'profile'"
                        key="profile"
                        class="absolute inset-0 flex flex-col bg-white rounded-md"
                    >
                        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                            <button
                                class="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                aria-label="Go back"
                                @click="goBack"
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
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>

                            <div class="text-subtitle1 font-semibold text-gray-900">
                                {{ $t('chat.profile.userProfile') }}
                            </div>
                        </div>

                        <div class="flex-1 overflow-y-auto">
                            <UserProfileSidebar :mobile-mode="true" />
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, watch, onMounted } from 'vue'
    import { storeToRefs } from 'pinia'
    import { useRoute, useRouter } from 'vue-router'
    import { useChatStore } from '~/stores/chat'
    import { useChatNavigation } from '~/composables/useChatNavigation'
    import type { Chat } from '~/types/chat'

    const UserProfileSidebar = defineAsyncComponent(
        () => import('~/components/features/global/chat/UserProfileSidebar.vue')
    )
    const route = useRoute()
    const router = useRouter()
    const chatStore = useChatStore()
    const { activeChat, profileOpen, activeChatParticipant, chats, initializing } =
        storeToRefs(chatStore)

    const {
        currentMobileView,
        navigateToConversation,
        navigateToProfile,
        goBack,
        initializeFromRoute,
    } = useChatNavigation()

    const isLoadingFromRoute = ref(false)

    const desktopHeight = computed(() => 'calc(100vh - 250px)')
    const mobileHeight = computed(() => 'calc(100vh - 300px)')

    const transitionName = computed(() => {
        if (currentMobileView.value === 'list') {
            return 'slide-right'
        }
        return 'slide-left'
    })

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

    const handleDesktopChatSelect = async (chat: Chat) => {
        await chatStore.setActiveChat(chat)

        // Update profile sidebar if it's open
        if (chatStore.profileOpen && activeChatParticipant.value) {
            chatStore.setSelectedUser(activeChatParticipant.value)
        }
    }

    const handleMobileChatSelect = async (chat: Chat) => {
        await chatStore.setActiveChat(chat)
        await navigateToConversation(chat)
    }

    const handleProfileClick = () => {
        if (activeChatParticipant.value) {
            chatStore.setSelectedUser(activeChatParticipant.value)
            navigateToProfile(activeChatParticipant.value)
        }
    }

    const loadChatFromUrl = async (chatId: number) => {
        try {
            isLoadingFromRoute.value = true

            // Pas 1: Wait for initialization if in progress
            if (initializing.value) {
                await new Promise<void>((resolve) => {
                    const unwatch = watch(initializing, (val) => {
                        if (!val) {
                            unwatch()
                            resolve()
                        }
                    })
                })
            }

            // Pas 2: Fetch all chats if not already loaded (CRITICAL!)
            if (chats.value.length === 0) {
                await chatStore.fetchChats()
            }

            // Pas 3: Find the chat in the loaded list
            const chat = chats.value.find((c) => c.id === chatId)

            if (!chat) {
                console.error('[ChatLayout] Chat not found in user chats:', chatId)
                const toast = useToastNotification()
                toast?.error('Conversation not found')
                router.push('/chat')
                return
            }

            // Pas 4: Initialize view BEFORE setting active chat

            initializeFromRoute()

            // Pas 5: Set active chat (this will call /chats/{chatId}/messages internally)
            await chatStore.setActiveChat(chat)

            // Pas 6: Force fetch messages if not loaded (uses /chats/{chatId}/messages)
            if (!chatStore.messages[chat.id] || chatStore.messages[chat.id].length === 0) {
                await chatStore.fetchMessages(chat.id)
            }
        } catch (error) {
            console.error('[ChatLayout] Error loading chat from URL:', error)
            const toast = useToastNotification()
            toast?.error('Failed to load conversation')
            router.push('/chat')
        } finally {
            isLoadingFromRoute.value = false
        }
    }

    watch(
        () => activeChat.value,
        (newChat) => {
            if (!newChat && currentMobileView.value === 'conversation') {
                goBack()
            }
        }
    )

    onMounted(async () => {
        if (!process.client) return

        const chatId = route.query.chatId
        const view = route.query.view

        if (chatId && view === 'conversation') {
            const chatIdNum = parseInt(chatId as string)
            await loadChatFromUrl(chatIdNum)
        } else {
            initializeFromRoute()
        }
    })
</script>

<style scoped>
    .slide-left-enter-active,
    .slide-left-leave-active,
    .slide-right-enter-active,
    .slide-right-leave-active {
        transition: transform 0.3s ease-in-out;
    }

    .slide-left-enter-from {
        transform: translateX(100%);
    }

    .slide-left-leave-to {
        transform: translateX(-100%);
    }

    .slide-right-enter-from {
        transform: translateX(-100%);
    }

    .slide-right-leave-to {
        transform: translateX(100%);
    }
</style>
