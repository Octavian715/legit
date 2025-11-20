<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div>
            <div class="flex items-center justify-between py-5">
                <div class="flex items-center gap-4 flex-1">
                    <div class="w-12"></div>
                    <div class="flex-1 text-center">
                        <h1 class="text-title1 text-gray-950">{{ pageTitle }}</h1>
                    </div>
                </div>

                <ButtonClose
                    v-tooltip="t('close')"
                    size="lg"
                    icon-size="lg"
                    :loading="isLoading || isInitialLoading"
                    @click="handleClose"
                />
            </div>

            <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                <div class="flex items-start gap-3">
                    <svg
                        class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div class="flex-1">
                        <p class="text-subtitle2 font-semibold text-red-900">
                            {{ t('orders.error.title') }}
                        </p>
                        <p class="text-subtitle3 text-red-800 mt-1">{{ error }}</p>
                    </div>
                    <button
                        type="button"
                        class="text-red-600 hover:text-red-800 transition-colors"
                        @click="error = null"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <Transition name="fade" mode="out-in">
                <OrdersDocumentTypeSelectorSkeleton v-if="isInitialLoading" />

                <OrdersDocumentTypeSelector
                    v-else-if="!isFormVisible"
                    :loading="isLoading"
                    @select="handleTypeSelected"
                />

                <OrdersOrderForm
                    v-else
                    mode="create"
                    :initial-type="selectedType"
                    @cancel="handleBack"
                    @success="handleSuccess"
                    @error="handleFormError"
                    @form-dirty="handleFormDirty"
                />
            </Transition>
        </div>

        <ExitConfirmationModal
            v-model:is-open="showExitModal"
            :modal-title="t('orders.exitCreate.title')"
            :modal-message="t('orders.exitCreate.message')"
            :ok-text="t('orders.exitCreate.confirm')"
            @confirm="confirmExit"
            @cancel="showExitModal = false"
        />
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import type { DocumentType } from '~/types/documents'
    import { useToastNotification } from '~/composables/useToastNotification'

    const localePath = useLocalePath()
    const router = useRouter()
    const { t } = useI18n()
    const toast = useToastNotification()
    const { documentTypes } = useDocumentTypes()

    definePageMeta({
        middleware: ['supplier'],
        layout: 'app',
    })

    const isInitialLoading = ref(true)
    const isLoading = ref(false)
    const isFormVisible = ref(false)
    const selectedType = ref<DocumentType | null>(null)
    const showExitModal = ref(false)
    const error = ref<string | null>(null)
    const hasUnsavedChanges = ref(false)
    const allowNavigation = ref(false)

    const pageTitle = computed(() => {
        return !isFormVisible.value
            ? t('orders.selectDocumentType')
            : t('addATemplate', { template: t('orders.orders', { n: 0 }) })
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.orders'), to: localePath('/supplier/orders/overview') },
        { label: t('navigation.createOrder'), to: localePath('/supplier/orders/create') },
    ])

    const handleTypeSelected = async (type: DocumentType) => {
        try {
            isLoading.value = true
            error.value = null
            selectedType.value = type
            await nextTick()

            setTimeout(() => {
                isFormVisible.value = true
                isLoading.value = false
            }, 300)
        } catch (err: any) {
            console.error('[Create Order] Type selection error:', err)
            error.value = err?.message || t('orders.error.typeSelection')
            isLoading.value = false
        }
    }

    const handleBack = () => {
        if (isLoading.value) return

        if (hasUnsavedChanges.value && isFormVisible.value) {
            showExitModal.value = true
            return
        }

        isFormVisible.value = false
        selectedType.value = null
        error.value = null
        hasUnsavedChanges.value = false
    }

    const handleClose = () => {
        if (isLoading.value || isInitialLoading.value) return

        if (hasUnsavedChanges.value) {
            showExitModal.value = true
        } else {
            confirmExit()
        }
    }

    const confirmExit = () => {
        showExitModal.value = false
        allowNavigation.value = true
        router.push(localePath('/supplier/orders/all'))
    }

    const handleSuccess = async (document?: any) => {
        hasUnsavedChanges.value = false
        allowNavigation.value = true

        await nextTick()

        setTimeout(() => {
            router.push(localePath('/supplier/orders/all'))
        }, 1000)
    }

    const handleFormError = (errorMessage: string) => {
        error.value = errorMessage
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFormDirty = (isDirty: boolean) => {
        hasUnsavedChanges.value = isDirty
    }

    onMounted(async () => {
        try {
            await nextTick()

            if (!documentTypes || documentTypes.length === 0) {
                throw new Error(t('orders.error.noDocumentTypes'))
            }

            setTimeout(() => {
                isInitialLoading.value = false
            }, 500)
        } catch (err: any) {
            console.error('[Create Order] Initialization error:', err)
            error.value = err?.message || t('orders.error.initialization')
            isInitialLoading.value = false
        }
    })

    // onBeforeRouteLeave((to, from, next) => {
    //     if (allowNavigation.value || !hasUnsavedChanges.value) {
    //         next()
    //     } else {
    //         showExitModal.value = true
    //         next(false)
    //     }
    // })

    onBeforeUnmount(() => {
        error.value = null
        hasUnsavedChanges.value = false
    })

    if (process.client) {
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges.value && !allowNavigation.value) {
                e.preventDefault()
                e.returnValue = ''
            }
        })
    }

    useSeoMeta({
        title: () => t('orders.createOrder'),
        description: () => t('orders.createOrderDescription'),
    })
</script>

<style scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
