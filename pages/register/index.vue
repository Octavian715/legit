<!-- pages/register/index.vue -->
<template>
    <div class="register-redirect-container min-h-[400px] flex items-center justify-center">
        <div class="flex justify-center items-center p-8">
            <span class="loader"></span>
        </div>
    </div>
</template>

<script setup lang="ts">
    // Define page meta
    definePageMeta({ middleware: ['registration', 'guest'], layout: 'auth' })

    // Composables
    const route = useRoute()
    const localePath = useLocalePath()

    // Client-side redirect as fallback
    if (process.client) {
        // Use nextTick or onMounted to ensure proper timing
        onMounted(async () => {
            try {
                let targetUrl = '/register/account-type'

                // Check for referral code in query parameters
                const referralCode = route.query.referral_code as string

                if (referralCode) {
                    // Add referral code as query parameter to the target URL
                    targetUrl = `/register/account-type?referral_code=${encodeURIComponent(referralCode)}`

                    // Optionally store referral code in a cookie for persistence across the registration flow
                    const referralCookie = useCookie('referral_code', {
                        httpOnly: false,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                    })
                    referralCookie.value = referralCode
                }

                await navigateTo(localePath(targetUrl), {
                    replace: true,
                    redirectCode: 302,
                })
            } catch (error) {
                console.error('[Register] Redirect error:', error)

                // Fallback redirect without referral code
                await navigateTo(localePath('/register/account-type'), {
                    replace: true,
                    redirectCode: 302,
                })
            }
        })
    }
</script>

<style scoped>
    .register-redirect-container {
        width: 100%;
    }
</style>
