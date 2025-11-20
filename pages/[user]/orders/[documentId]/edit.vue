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

            <Transition name="fade" mode="out-in">
                <OrdersOrderFormSkeleton v-if="isInitialLoading" />

                <div
                    v-else-if="loadError"
                    class="p-8 bg-red-50 border border-red-200 rounded text-center"
                >
                    <svg
                        class="w-16 h-16 text-red-600 mx-auto mb-4"
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
                    <p class="text-subtitle2 font-semibold text-red-900 mb-2">
                        {{ t('orders.error.loadFailed') }}
                    </p>
                    <p class="text-subtitle3 text-red-800 mb-4">{{ loadError }}</p>
                    <div class="flex gap-3 justify-center">
                        <Button
                            :label="t('retry')"
                            color="blue"
                            variant="filled"
                            @click="handleRetry"
                        />
                        <Button
                            :label="t('orders.backToOverview')"
                            color="gray"
                            variant="outline"
                            @click="handleBackToOverview"
                        />
                    </div>
                </div>

                <OrdersOrderForm
                    v-else-if="documentId && !isInitialLoading"
                    mode="edit"
                    :document-id="documentId"
                    @cancel="handleBack"
                    @success="handleSuccess"
                    @error="handleFormError"
                    @form-dirty="handleFormDirty"
                />
            </Transition>
        </div>

        <ExitConfirmationModal
            v-model:is-open="showExitModal"
            :modal-title="t('orders.exitEdit.title')"
            :modal-message="t('orders.exitEdit.message')"
            :ok-text="t('orders.exitEdit.confirm')"
            @confirm="confirmExit"
            @cancel="showExitModal = false"
        />
    </div>
</template>

<script setup lang="ts">
    import { useLocalePath } from '#imports'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useDocumentsStore } from '~/stores/documents'

    const localePath = useLocalePath()
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()
    const toast = useToastNotification()
    const documentsStore = useDocumentsStore()

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const isInitialLoading = ref(true)
    const isLoading = ref(false)
    const showExitModal = ref(false)
    const loadError = ref<string | null>(null)
    const hasUnsavedChanges = ref(false)
    const allowNavigation = ref(false)
    const documentId = ref<number | null>(null)
    const documentType = ref<string>('')

    const pageTitle = computed(() => {
        if (isInitialLoading.value) {
            return t('orders.loading')
        }
        return t('orders.editDocument', { type: getDocumentTypeLabel(documentType.value) })
    })

    const pathRole = computed(() => {
        const path = route.path.toLowerCase()
        if (path.includes('/supplier/')) return 'supplier'
        if (path.includes('/buyer/')) return 'buyer'
        return 'supplier'
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath(`/${pathRole.value}/dashboard`) },

        { label: t('navigation.orders'), to: localePath('/supplier/orders/overview') },
        {
            label: t('navigation.editOrder'),
            to: localePath(`/supplier/orders/${documentId.value}/edit`),
        },
    ])

    const getDocumentTypeLabel = (type: string): string => {
        const typeMap: Record<string, string> = {
            order: t('documentTypes.order'),
            offer: t('documentTypes.offer'),
            delivery_note: t('documentTypes.deliveryNote'),
            invoice: t('documentTypes.invoice'),
            correction_invoice: t('documentTypes.correctionInvoice'),
        }
        return typeMap[type] || type
    }

    const loadDocument = async () => {
        const id = route.params.documentId

        if (!id || Array.isArray(id)) {
            loadError.value = t('orders.error.invalidDocumentId')
            isInitialLoading.value = false
            return
        }

        const numericId = parseInt(id, 10)
        if (isNaN(numericId)) {
            loadError.value = t('orders.error.invalidDocumentId')
            isInitialLoading.value = false
            return
        }

        documentId.value = numericId

        try {
            isInitialLoading.value = true
            loadError.value = null

            const document = await documentsStore.fetchDocument(numericId)

            if (!document) {
                loadError.value = t('orders.error.documentNotFound')
                isInitialLoading.value = false
                return
            }

            documentType.value = document.type

            await nextTick()
        } catch (err: any) {
            console.error('[Edit Order] Load document error:', err)
            loadError.value =
                err?.data?.message || err?.message || t('orders.error.documentLoadFailed')
        } finally {
            isInitialLoading.value = false
        }
    }

    const handleRetry = async () => {
        await loadDocument()
    }

    const handleBack = () => {
        if (isLoading.value) return

        if (hasUnsavedChanges.value) {
            showExitModal.value = true
            return
        }

        confirmExit()
    }

    const handleClose = () => {
        if (isLoading.value || isInitialLoading.value) return

        if (hasUnsavedChanges.value) {
            showExitModal.value = true
        } else {
            confirmExit()
        }
    }

    const handleBackToOverview = () => {
        allowNavigation.value = true
        router.push(localePath('/supplier/orders/overview'))
    }

    const confirmExit = () => {
        showExitModal.value = false
        allowNavigation.value = true
        router.push(localePath('/supplier/orders/overview'))
    }

    const handleSuccess = async (document?: any) => {
        hasUnsavedChanges.value = false
        allowNavigation.value = true

        toast.success(t('orders.success.documentUpdated'))

        await nextTick()

        setTimeout(() => {
            router.push(localePath('/supplier/orders/overview'))
        }, 1000)
    }

    const handleFormError = (errorMessage: string) => {
        toast.error(errorMessage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFormDirty = (isDirty: boolean) => {
        hasUnsavedChanges.value = isDirty
    }

    onMounted(async () => {
        await loadDocument()
    })

    onBeforeRouteLeave((to, from, next) => {
        if (allowNavigation.value || !hasUnsavedChanges.value) {
            next()
        } else {
            showExitModal.value = true
            next(false)
        }
    })

    onBeforeUnmount(() => {
        loadError.value = null
        hasUnsavedChanges.value = false
        documentsStore.clearCurrentDocument()
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
        title: () => t('orders.editDocument', { type: documentType.value }),
        description: () => t('orders.editDocumentDescription'),
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
