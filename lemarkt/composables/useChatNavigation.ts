import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '~/stores/chat'
import type { Chat, ChatUser } from '~/types/chat'

type MobileView = 'list' | 'conversation' | 'profile'

export function useChatNavigation() {
    const route = useRoute()
    const router = useRouter()
    const chatStore = useChatStore()

    const currentMobileView = ref<MobileView>('list')

    const navigateToConversation = async (chat: Chat) => {
        currentMobileView.value = 'conversation'
        await router.push({
            query: {
                chatId: chat.id.toString(),
                view: 'conversation',
            },
        })
    }

    const navigateToProfile = async (user: ChatUser) => {
        currentMobileView.value = 'profile'
        await router.push({
            query: {
                ...route.query,
                view: 'profile',
                userId: user.id.toString(),
            },
        })
    }

    const goBack = async () => {
        if (currentMobileView.value === 'profile') {
            // Go back to conversation
            currentMobileView.value = 'conversation'
            const query: Record<string, string> = {
                chatId: route.query.chatId as string,
                view: 'conversation',
            }
            await router.push({ query })
        } else if (currentMobileView.value === 'conversation') {
            // Go back to list
            currentMobileView.value = 'list'
            chatStore.setActiveChat(null)
            await router.push({ query: {} })
        }
    }

    const initializeFromRoute = async () => {
        const chatId = route.query.chatId
        const view = route.query.view as MobileView
        const userId = route.query.userId

        if (!view) {
            currentMobileView.value = 'list'
            return
        }

        if (view === 'profile') {
            currentMobileView.value = 'profile'

            // Set selectedUser if available (it should be set by ChatLayout.vue onMounted)
            if (userId && chatId) {
                const chat = chatStore.chats.find((c) => c.id === parseInt(chatId as string))
                if (chat && chat.is_direct) {
                    const participant = chat.participants.find(
                        (p) => p.id === parseInt(userId as string)
                    )
                    if (participant) {
                        const user: ChatUser = {
                            id: participant.id,
                            name: participant.name,
                            avatar: participant.avatar_url,
                            company: participant.company,
                            online: participant.online,
                        }
                        chatStore.setSelectedUser(user)
                    }
                }
            }
        } else if (view === 'conversation' && chatId) {
            currentMobileView.value = 'conversation'
        } else {
            currentMobileView.value = 'list'
        }
    }

    return {
        currentMobileView: computed(() => currentMobileView.value),
        navigateToConversation,
        navigateToProfile,
        goBack,
        initializeFromRoute,
    }
}
