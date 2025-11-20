export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = getCookie(event, 'auth.token')

    if (!token) {
        return []
    }

    try {
        const data = await $fetch(`${config.public.apiBaseURL}/user/cart`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
        return data || []
    } catch (error: any) {
        console.error('[SSR Cart] Fetch error:', error)
        return []
    }
})
