import { onUnmounted } from 'vue'
import type { Notification } from '~/types/notifications'
import { useNotificationEventBus } from './useNotificationEventBus'
import { useUserStore } from '~/stores/user'

export const useSystemNotificationHandler = () => {
    const eventBus = useNotificationEventBus()
    const userStore = useUserStore()
    const toast = useToastNotification()
    const router = useRouter()
    const localePath = useLocalePath()
    const isRegistered = ref(false)

    const handlers = new Map<string, (notification: Notification) => Promise<void>>([])

    const register = () => {
        if (isRegistered.value) return

        handlers.forEach((handler, type) => {
            eventBus.register(type as any, handler)
        })

        isRegistered.value = true
    }

    const unregister = () => {
        if (!isRegistered.value) return

        handlers.forEach((handler, type) => {
            eventBus.unregister(type as any, handler)
        })

        isRegistered.value = false
    }

    if (process.client) {
        onUnmounted(() => {
            unregister()
        })
    }

    return {
        register,
        unregister,
        isRegistered: () => isRegistered.value,
    }
}
