export const useAppInitialization = () => {
    const userStore = useUserStore()
    const { initialize: initializeStaticData } = useStaticData()

    const isInitialized = ref(false)
    const isInitializing = ref(false)
    const initializationError = ref<Error | null>(null)

    const initializeApp = async () => {
        if (isInitializing.value || isInitialized.value) return

        isInitializing.value = true
        initializationError.value = null

        try {
            // Run both in parallel for better performance
            await Promise.all([userStore.initializeUser(), initializeStaticData()])

            isInitialized.value = true
        } catch (error) {
            console.error('App initialization error:', error)
            initializationError.value = error as Error
        } finally {
            isInitializing.value = false
        }
    }

    const reinitializeOnAuthChange = async (isAuth: boolean, wasAuth: boolean) => {
        if (isAuth !== wasAuth && isInitialized.value) {
            try {
                const { refetch } = useStaticData()
                await refetch(true)
            } catch (error) {
                console.error('Static data reinitialization error:', error)
                initializationError.value = error as Error
            }
        }
    }

    return {
        isInitialized,
        isInitializing,
        initializationError,
        initializeApp,
        reinitializeOnAuthChange,
    }
}
