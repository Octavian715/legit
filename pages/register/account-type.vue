<template>
    <AuthContainer
        class="bg-gray-150"
        full-height
        spacing
        content-class="w-full"
        class-container="w-full"
    >
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center p-8">
            <span class="loader"></span>
        </div>

        <!-- Account Type Selection Grid -->
        <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 w-full"
            :class="{
                'lg:grid-cols-3': accountTypeOptions.length >= 3,
            }"
        >
            <div
                v-for="option in accountTypeOptions"
                :key="option.id"
                class="relative flex flex-col justify-start items-center p-4 cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:bg-white hover:rounded-sm hover:shadow-account active:scale-95 group"
                :class="{
                    'bg-white rounded-sm shadow-account': selectedAccountType === option.id,
                    'opacity-50 cursor-not-allowed': isSubmitting,
                }"
                @click="!isSubmitting && handleSelection(option.id)"
            >
                <!-- Image Container with Enhanced Fallback -->
                <div class="relative mb-2.5">
                    <!-- <NuxtImg
                        v-if="!imageLoadErrors.includes(option.type)"
                        :src="getImgPath(option.type, selectedAccountType === option.id)"
                        width="140"
                        height="140"
                        :alt="option.label"
                        class="max-w-[100px] sm:max-w-[140px] transition-transform duration-200 group-hover:scale-105"
                        @error="handleImageError($event, option.type)"
                        @load="handleImageLoad($event, option.type)"
                    /> -->
                    <img
                        v-if="!imageLoadErrors.includes(option.type)"
                        :src="getImgPath(option.type, selectedAccountType === option.id)"
                        width="140"
                        height="140"
                        :alt="option.label"
                        class="max-w-[100px] sm:max-w-[140px] transition-transform duration-200 group-hover:scale-105"
                        @error="handleImageError($event, option.type)"
                        @load="handleImageLoad($event, option.type)"
                    />

                    <!-- Enhanced Fallback with Role-Specific Icons -->
                    <div
                        v-if="imageLoadErrors.includes(option.type)"
                        class="max-w-[100px] sm:max-w-[140px] w-[100px] sm:w-[140px] h-[100px] sm:h-[140px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 group-hover:border-red-300 group-hover:bg-gradient-to-br group-hover:from-red-50 group-hover:to-red-100"
                        :class="{
                            'bg-white': selectedAccountType === option.id,
                        }"
                    >
                        <svg
                            class="w-12 h-12 sm:w-16 sm:h-16 transition-colors duration-200"
                            :class="{
                                'text-red-500': selectedAccountType === option.id,
                                'text-gray-400 group-hover:text-red-400':
                                    selectedAccountType !== option.id,
                            }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                :d="getIconPath(option.type)"
                            />
                        </svg>
                    </div>
                </div>

                <!-- Radio Button with Enhanced Styling -->
                <Radiobox
                    name="accountType"
                    :model-value="selectedAccountType"
                    :value="option.id"
                    :label="option.label"
                    container-class="!font-medium mb-2"
                    :disabled="isSubmitting"
                    @update:modelValue="handleSelection"
                />

                <!-- Description with Better Typography -->
                <p class="text-subtitle3 text-gray-700 text-center pt-1.5 leading-relaxed">
                    {{ option.description }}
                </p>

                <!-- Hover Effect Overlay -->
                <div class="absolute inset-0 pointer-events-none"></div>
            </div>
        </div>

        <!-- Action Buttons Section -->
        <div class="flex flex-col justify-center items-center p-4 mt-6 space-y-6">
            <!-- Continue Button -->
            <Button
                variant="filled"
                color="red"
                :label="$t('continue')"
                :loading="isSubmitting"
                :disabled="isSubmitting || !isValid"
                class="min-w-[200px] transition-all duration-200"
                @click="handleSubmit"
            />

            <!-- Back to Login Link -->
            <Link :to="localePath('/login')" size="sm" color="primary" :disabled="isSubmitting">
                {{ $t('register.haveAlreadyAnAccount') }}
            </Link>
        </div>
    </AuthContainer>
</template>

<script setup lang="ts">
    import { useRegistrationNavigation } from '~/composables/useRegistrationNavigation'
    import Link from '~/components/ui/Link.vue'

    definePageMeta({
        layout: 'auth',
        middleware: ['registration', 'guest'],
        auth: false,
    })

    // Types
    type AccountType = 'supplier' | 'buyer' | 'serviceProvider'

    interface AccountTypeOption {
        id: number
        type: AccountType
        label: string
        description: string
    }

    // Composables
    const { t } = useI18n()
    const router = useRouter()
    const localePath = useLocalePath()
    const {
        getStepData,
        updateStepData,
        submitStep,
        initializeStep,
        isSubmitting,
        getAccountType,
        saveAccountType,
    } = useRegistrationNavigation()

    // Reactive State
    const isLoading = ref(false)
    const imageLoadErrors = ref<AccountType[]>([])

    // Get initial account type from enhanced method
    const getInitialAccountType = () => {
        try {
            const accountTypeData = getAccountType()

            return accountTypeData.id || null
        } catch (error) {
            console.warn('[AccountType] Error getting initial account type:', error)
            return null
        }
    }

    const selectedAccountType = ref<number | null>(getInitialAccountType())

    // Account Type Options Configuration
    const accountTypeOptions = computed<AccountTypeOption[]>(() => [
        {
            id: 1,
            type: 'supplier',
            label: t('register.asUser', { user: t('supplier') }, 'As a supplier'),
            description: t(
                'register.supplierAccountDescription',
                'For manufacturers and suppliers'
            ),
        },
        {
            id: 2,
            type: 'buyer',
            label: t('register.asUser', { user: t('buyer') }, 'As a buyer'),
            description: t(
                'register.buyerAccountDescription',
                'For retailers, restaurants, cafes and hotels'
            ),
        },
    ])

    // Computed Properties
    const isValid = computed(() => {
        return !!selectedAccountType.value && !isSubmitting.value
    })

    // Get selected account type info
    const getSelectedAccountTypeInfo = () => {
        return accountTypeOptions.value.find((option) => option.id === selectedAccountType.value)
    }

    // Methods
    const handleSelection = (id: number) => {
        if (isSubmitting.value) return

        selectedAccountType.value = id
        const selectedOption = getSelectedAccountTypeInfo()
        if (!selectedOption) return

        const referralCode = useCookie('referral_code').value || undefined

        // Step data for store and cookie
        const stepData = {
            id: id,
            type: selectedOption.type,
            label: selectedOption.label,
            referralCode,
            timestamp: new Date().toISOString(),
        }

        // Use enhanced saveAccountType method that handles both store and cookie
        saveAccountType(stepData)
    }

    const handleSubmit = async () => {
        if (!isValid.value) {
            return
        }

        try {
            const selectedOption = getSelectedAccountTypeInfo()
            if (!selectedOption) return

            if (!selectedAccountType.value) {
                console.error('[AccountType] No account type selected')
                return
            }

            const referralCode = useCookie('referral_code').value || undefined

            const stepData = {
                id: selectedAccountType.value,
                type: selectedOption.type,
                label: selectedOption.label,
                referralCode,
                timestamp: new Date().toISOString(),
            }

            // Use enhanced saveAccountType before submit
            saveAccountType(stepData)

            const success = await submitStep('accountType', stepData)

            if (success) {
                await router.push(localePath('/register/personal-info'))
            } else {
                // Still navigate as account type is saved in cookie
                await router.push(localePath('/register/personal-info'))
            }
        } catch (error) {
            console.error('[AccountType] Submit error:', error)
        }
    }

    // Image handling methods
    const getImgPath = (imageName: string, isActive: boolean): string => {
        const suffix = isActive ? '-active' : ''
        return `/images/register/${imageName}${suffix}.webp`
    }

    // SVG icon paths for fallback icons
    const getIconPath = (type: AccountType): string => {
        const iconPaths: Record<AccountType, string> = {
            supplier: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4m0-10v10',
            buyer: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
            serviceProvider:
                'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 0h4m-4 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V6a2 2 0 012-2',
        }
        return iconPaths[type] || iconPaths.buyer
    }

    // Enhanced image error handling
    const handleImageError = (event: Event, type: AccountType) => {
        console.error(`Failed to load image for ${type}`)
        const img = event.target as HTMLImageElement

        if (!imageLoadErrors.value.includes(type)) {
            imageLoadErrors.value.push(type)
        }
    }

    const handleImageLoad = (event: Event, type: AccountType) => {
        const img = event.target as HTMLImageElement

        // Remove from error list if it loads successfully
        const errorIndex = imageLoadErrors.value.indexOf(type)
        if (errorIndex > -1) {
            imageLoadErrors.value.splice(errorIndex, 1)
        }
    }

    // Initialize selected account type on mount
    const initializeSelectedAccountType = () => {
        try {
            const accountTypeData = getAccountType()

            if (accountTypeData.id) {
                selectedAccountType.value = accountTypeData.id
            }
        } catch (error) {
            console.warn('[AccountType] Error initializing account type:', error)
            selectedAccountType.value = null
        }
    }

    // Lifecycle
    onMounted(() => {
        initializeStep('accountType')
        initializeSelectedAccountType()
        isLoading.value = false
    })
</script>

<style scoped>
    .shadow-account {
        box-shadow:
            0 4px 5px 0 rgba(90, 93, 101, 0.12),
            0 2px 4px 0 rgba(90, 93, 101, 0.14);
    }
</style>
