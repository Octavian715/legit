<template>
    <div class="company-details-redirect-container min-h-[400px] flex items-center justify-center">
        <div class="flex justify-center items-center p-8">
            <span class="loader"></span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useUserStore } from '~/stores/user'
    import { useRegistrationNavigation } from '~/useRegistrationNavigation'
    import { useGlobalStore } from '~/stores/global'

    definePageMeta({ middleware: ['registration'], layout: 'auth' })

    // Composables
    const localePath = useLocalePath()
    const userStore = useUserStore()
    const global = useGlobalStore()
    const { initializeStep } = useRegistrationNavigation()

    // Auto-redirect on client side
    if (process.client) {
        onMounted(async () => {
            try {
                // Initialize static data if needed

                await global.fetchStaticData(true)
                // Initialize the step to ensure proper state

                initializeStep('companyDetails')

                // Determine correct substep
                const user = userStore.user
                let targetSubstep = 'profile'

                // Determine the correct substep based on user's registration progress
                if (user) {
                    const currentStep = user.register_step
                    const currentSubstep = user.register_substep
                    // If user is on company-details step, use their substep
                    if (currentStep === 'company-details') {
                        switch (currentSubstep) {
                            case 1:
                                targetSubstep = 'profile'
                                break
                            case 2:
                                targetSubstep = 'detailed'
                                break
                            case 3:
                                targetSubstep = 'address'
                                break
                            case 4:
                                targetSubstep = 'topics'
                                break
                            case 5:
                                targetSubstep = 'contacts'
                                break
                            case 6:
                                targetSubstep = 'banks'
                                break
                            default:
                                targetSubstep = 'profile'
                        }
                    } else {
                        // If user is on a different step but somehow ended up here,
                        // start from the beginning of company details
                        targetSubstep = 'profile'
                    }
                }

                const targetPath = `/register/company-details/${targetSubstep}`

                await navigateTo(localePath(targetPath), {
                    replace: true,
                    redirectCode: 302,
                })
            } catch (error) {
                console.error('[CompanyDetails] Redirect error:', error)

                // Fallback to profile substep on error
                await navigateTo(localePath('/register/company-details/profile'), {
                    replace: true,
                    redirectCode: 302,
                })
            }
        })
    }
</script>
<style scoped>
    .company-details-redirect-container {
        width: 100%;
    }
</style>
