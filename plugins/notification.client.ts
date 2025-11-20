import { useUserStore } from '~/stores/user'
import { useNotifications } from '~/composables/socket/useNotifications'
import { useChat } from '~/composables/socket/useChat'
import { useNotificationHandler } from '~/composables/notifications/useNotificationHandler'

let initializationPromise: Promise<void> | null = null
let isInitialized = false

let notificationsReset: (() => void) | null = null
let chatReset: (() => void) | null = null
let handlersCleanup: (() => void) | null = null

export default defineNuxtPlugin({
    name: 'notifications-initialization',
    dependsOn: ['socket'],
    enforce: 'post',
    setup() {
        if (!process.client) {
            return {
                provide: {
                    initializeNotifications: () => Promise.resolve(),
                    isNotificationsInitialized: () => false,
                },
            }
        }

        const userStore = useUserStore()
        const nuxtApp = useNuxtApp()

        if (!nuxtApp.$socket) {
            console.error('[NotificationsPlugin] Socket plugin not available!')
            return {
                provide: {
                    initializeNotifications: () => Promise.resolve(),
                    isNotificationsInitialized: () => false,
                },
            }
        }

        const initializeNotifications = async (): Promise<void> => {
            if (userStore.isRegistrationComplete && !userStore.isVerified) {
                return Promise.resolve()
            }

            if (isInitialized || initializationPromise) {
                return initializationPromise || Promise.resolve()
            }

            initializationPromise = (async () => {
                try {
                    const { initialize: initNotifications, reset: resetNotifications } =
                        useNotifications()
                    const { initializeChat, reset: resetChat } = useChat()
                    const { initialize: initHandlers, cleanup: cleanupHandlers } =
                        useNotificationHandler()

                    notificationsReset = resetNotifications
                    chatReset = resetChat
                    handlersCleanup = cleanupHandlers

                    resetNotifications()
                    resetChat()

                    const notificationResult = await initNotifications()
                    if (!notificationResult) {
                        console.warn('[NotificationsPlugin] Notifications initialization failed')
                    }

                    const chatResult = await initializeChat()
                    if (!chatResult) {
                        console.warn('[NotificationsPlugin] Chat initialization failed')
                    }

                    initHandlers()

                    isInitialized = true
                } catch (error) {
                    console.error('[NotificationsPlugin] Initialization failed:', error)
                    isInitialized = false
                    initializationPromise = null
                    throw error
                }
            })()

            return initializationPromise
        }

        const cleanup = () => {
            try {
                isInitialized = false
                initializationPromise = null

                if (notificationsReset) {
                    notificationsReset()
                    notificationsReset = null
                }
                if (chatReset) {
                    chatReset()
                    chatReset = null
                }
                if (handlersCleanup) {
                    handlersCleanup()
                    handlersCleanup = null
                }
            } catch (error) {
                console.error('[NotificationsPlugin] Cleanup error:', error)
            }
        }

        watch(
            () => userStore.isAuthenticated,
            async (isAuth, wasAuth) => {
                if (isAuth && userStore.isRegistrationComplete && userStore.isVerified) {
                    if (!isInitialized) {
                        try {
                            await initializeNotifications()
                        } catch (error) {
                            console.error('[NotificationsPlugin] Failed to initialize:', error)
                        }
                    }
                } else if (wasAuth && !isAuth) {
                    cleanup()
                }
            },
            { immediate: true }
        )

        if (process.client) {
            window.addEventListener('beforeunload', cleanup)
        }

        return {
            provide: {
                initializeNotifications,
                isNotificationsInitialized: () => isInitialized,
            },
        }
    },
})
