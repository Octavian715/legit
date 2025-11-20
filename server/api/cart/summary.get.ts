export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = getCookie(event, 'auth.token')

    if (!token) {
        return {
            supplier_count: 0,
            grand_totals: null,
        }
    }

    try {
        return await $fetch(`${config.public.apiBaseURL}/user/cart/summary`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
    } catch (error: any) {
        console.error('[SSR Summary] Fetch error:', error)
        return {
            supplier_count: 0,
            grand_totals: null,
        }
    }
})
