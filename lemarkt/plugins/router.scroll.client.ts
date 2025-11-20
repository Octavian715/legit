export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter()

    router.beforeEach(() => {
        if (process.client) {
            const scrollContainers = document.querySelectorAll('.layout__content')
            scrollContainers.forEach((container) => {
                if (container) {
                    container.scrollTop = 0
                }
            })
        }
    })
})
