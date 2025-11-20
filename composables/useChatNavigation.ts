import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Chat, ChatUser } from '~/types/chat'

export type MobileChatView = 'list' | 'conversation' | 'profile'

export const useChatNavigation = () => {
    const router = useRouter()
    const route = useRoute()

    const currentMobileView = ref<MobileChatView>('list')

    const canGoBack = computed(() => {
        return currentMobileView.value !== 'list'
    })

    const navigateToConversation = async (chat: Chat) => {
        currentMobileView.value = 'conversation'

        await router.push({
            query: {
                ...route.query,
                chatId: chat.id.toString(),
                view: 'conversation',
            },
        })
    }

    const navigateToProfile = (user?: ChatUser) => {
        currentMobileView.value = 'profile'

        router.push({
            query: {
                ...route.query,
                view: 'profile',
                userId: user?.id?.toString(),
            },
        })
    }

    const navigateToList = () => {
        currentMobileView.value = 'list'

        const query = { ...route.query }
        delete query.chatId
        delete query.view
        delete query.userId

        router.push({ query })
    }

    const goBack = () => {
        if (currentMobileView.value === 'profile') {
            currentMobileView.value = 'conversation'

            const query = { ...route.query }
            delete query.userId
            query.view = 'conversation'

            router.push({ query })
        } else if (currentMobileView.value === 'conversation') {
            navigateToList()
        }
    }

    const initializeFromRoute = async () => {
        const view = route.query.view as MobileChatView
        const chatId = route.query.chatId

        if (view === 'conversation' && chatId) {
            currentMobileView.value = 'conversation'
        } else if (view === 'profile') {
            currentMobileView.value = 'profile'
        } else {
            currentMobileView.value = 'list'
        }
    }

    return {
        currentMobileView: computed(() => currentMobileView.value),
        canGoBack,
        navigateToConversation,
        navigateToProfile,
        navigateToList,
        goBack,
        initializeFromRoute,
    }
}
