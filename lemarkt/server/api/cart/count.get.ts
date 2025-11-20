export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = getCookie(event, 'auth.token')

    if (!token) {
        return { count: 0 }
    }

    try {
        const data = await $fetch<{ count: number }>(
            `${config.public.apiBaseURL}/user/cart/count`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        return { count: data?.count || 0 }
    } catch (error: any) {
        console.error('[SSR Count] Fetch error:', error)
        return { count: 0 }
    }
})
