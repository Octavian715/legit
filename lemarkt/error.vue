<template>
    <div>
        <!-- Public/Unauthenticated User - No Layout -->
        <template v-if="!userStore.isAuthenticated">
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="container mx-auto py-24 px-4">
                    <div class="flex flex-col items-center justify-center min-h-[400px] gap-6">
                        <img
                            v-if="props.error.statusCode === 500"
                            src="/images/error/error-500.svg"
                            :alt="t('errorLayout.serverErrorTitle', 'Server Error')"
                            class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                            loading="lazy"
                        />
                        <img
                            v-else
                            src="/images/error/error-404.svg"
                            :alt="t('errorLayout.notFoundTitle', 'Page Not Found')"
                            class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                            loading="lazy"
                        />
                        <div class="flex flex-col gap-3">
                            <h3 class="text-h3 font-bold text-gray-950 text-center">
                                {{ errorTitle }}
                            </h3>
                            <p class="text-subtitle2 text-gray-800 text-center max-w-md">
                                {{ errorDescription }}
                            </p>
                        </div>

                        <Button
                            :label="$t('auth.backToLogin', 'Back to Login')"
                            size="lg"
                            variant="filled"
                            color="blue"
                            @click="handleUnauthenticatedError"
                        />
                    </div>
                </div>
            </div>
        </template>

        <!-- Dashboard Layout (Supplier/Buyer Dashboard) - Authenticated -->
        <template v-else-if="isDashboardRoute">
            <div class="layout">
                <div v-if="!isMobile" class="layout__sidebar">
                    <AppSideBar />
                </div>

                <div class="layout__topbar">
                    <AppHeaderDashboard />
                </div>

                <div class="layout__content">
                    <main class="layout__main">
                        <div class="container mx-auto py-24 px-4">
                            <div
                                class="flex flex-col items-center justify-center min-h-[400px] gap-6"
                            >
                                <img
                                    v-if="props.error.statusCode === 500"
                                    src="/images/error/error-500.svg"
                                    :alt="t('errorLayout.serverErrorTitle', 'Server Error')"
                                    class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                                    loading="lazy"
                                />
                                <img
                                    v-else
                                    src="/images/error/error-404.svg"
                                    :alt="t('errorLayout.notFoundTitle', 'Page Not Found')"
                                    class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                                    loading="lazy"
                                />
                                <div class="flex flex-col gap-3">
                                    <h3 class="text-h3 font-bold text-gray-950 text-center">
                                        {{ errorTitle }}
                                    </h3>
                                    <p class="text-subtitle2 text-gray-800 text-center max-w-md">
                                        {{ errorDescription }}
                                    </p>
                                </div>

                                <Button
                                    :label="buttonLabel"
                                    size="lg"
                                    variant="filled"
                                    color="blue"
                                    @click="handleError"
                                />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </template>

        <!-- Default Layout (Marketplace/Public) - Authenticated -->
        <template v-else>
            <div>
                <AppHeader />
                <DesktopMenu />

                <div class="container mx-auto py-24 px-4">
                    <div class="flex flex-col items-center justify-center min-h-[400px] gap-6">
                        <img
                            v-if="props.error.statusCode === 500"
                            src="/images/error/error-500.svg"
                            :alt="t('errorLayout.serverErrorTitle')"
                            class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                            loading="lazy"
                        />
                        <img
                            v-else
                            src="/images/error/error-404.svg"
                            :alt="t('errorLayout.notFoundTitle')"
                            class="w-full max-w-md md:max-w-lg lg:max-w-2xl h-auto object-contain"
                            loading="lazy"
                        />
                        <div class="flex flex-col gap-3">
                            <h3 class="text-h3 font-bold text-gray-950 text-center">
                                {{ errorTitle }}
                            </h3>
                            <p class="text-subtitle2 text-gray-800 text-center max-w-md">
                                {{ errorDescription }}
                            </p>
                        </div>

                        <Button
                            :label="buttonLabel"
                            size="lg"
                            variant="filled"
                            color="blue"
                            @click="handleError"
                        />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    import type { NuxtError } from '#app'
    import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

    const props = defineProps({
        error: Object as () => NuxtError,
    })

    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const localePath = useLocalePath()
    const userStore = useUserStore()

    const breakpoints = useBreakpoints(breakpointsTailwind)
    const isMobile = breakpoints.smaller('sm')

    const isDashboardRoute = computed(() => {
        const path = route.path
        return (
            path.startsWith('/supplier') || path.startsWith('/buyer') || path.startsWith('/admin')
        )
    })

    const errorTitle = computed(() => {
        if (!props.error) return t('errorLayout.defaultTitle', 'Page Not Found')

        const statusCode = props.error.statusCode

        if (statusCode === 404) return t('errorLayout.notFoundTitle', 'Page Not Found')
        if (statusCode === 500) return t('errorLayout.serverErrorTitle', 'Server Error')

        return t('errorLayout.defaultTitle', 'Page Not Found')
    })

    const errorDescription = computed(() => {
        if (!props.error) return t('errorLayout.defaultDescription', 'An unexpected error occurred')

        const statusCode = props.error.statusCode
        const customMessage = props.error.statusMessage

        if (statusCode === 404) {
            return (
                customMessage ||
                t(
                    'errorLayout.notFoundDescription',
                    "The page you're looking for doesn't exist or has been moved"
                )
            )
        }
        if (statusCode === 500) {
            return (
                customMessage ||
                t(
                    'errorLayout.serverErrorDescription',
                    'We encountered an error while processing your request'
                )
            )
        }

        return customMessage || t('errorLayout.defaultDescription', 'Page Not Found')
    })

    const buttonLabel = computed(() => {
        if (!props.error) return t('errorLayout.goHome', 'Go Home')

        return props.error.statusCode === 404
            ? t('errorLayout.goHome', 'Go Home')
            : t('errorLayout.retry', 'Try Again')
    })

    const handleError = () => {
        clearError({ redirect: '/marketplace' })
    }

    const handleUnauthenticatedError = () => {
        clearError({ redirect: localePath('/login') })
    }
</script>

<style scoped lang="scss">
    .layout {
        @apply h-screen bg-gray-200 transition-all duration-300;
        @apply flex flex-col overflow-hidden;

        @screen sm {
            display: grid;
            grid-template-columns: minmax(300px, 22%) 1fr;
            grid-template-rows: auto 1fr;
        }

        &__sidebar {
            @apply transition-all duration-300;

            @screen sm {
                @apply row-span-2 overflow-y-auto;
            }
        }

        &__topbar {
            @apply z-10 flex-shrink-0 sticky top-0 bg-white shadow-sm;

            @screen sm {
                @apply col-start-2 col-span-1 row-start-1;
            }
        }

        &__content {
            @apply flex-1 overflow-x-hidden py-5 px-6 overflow-y-auto transition-all duration-300;

            @screen sm {
                @apply col-start-2 col-span-1 row-start-2;
            }
        }

        &__main {
            @apply w-full h-full;
        }
    }
</style>
