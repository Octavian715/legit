<template>
    <div class="product-confirmation-modal">
        <div class="flex items-center gap-3 mb-4 px-4">
            <div class="flex-1">
                <h3 class="text-title2 font-semibold text-gray-950 mb-1">
                    {{ confirmationMessageStart }}
                    <strong>{{ props.productArticle }}</strong> -
                    <strong>{{ props.productName }}</strong>
                    {{ confirmationMessageEnd }}
                </h3>
                <p class="text-subtitle2 text-gray-800 text-center">{{ actionDescription }}</p>
            </div>
        </div>

        <div class="flex gap-2.5 justify-center border-t border-gray-400 pt-3">
            <Button
                color="gray"
                variant="filled"
                size="md"
                :disabled="isLoading"
                @click="handleCancel"
            >
                {{ t('cancel') }}
            </Button>

            <Button
                :color="confirmButtonColor"
                variant="filled"
                size="md"
                :disabled="isLoading"
                @click="handleConfirm"
            >
                <span v-if="isLoading" class="flex items-center gap-2">
                    <div
                        class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                    {{ t('processing') }}
                </span>
                <span v-else>
                    {{ confirmButtonText }}
                </span>
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface Props {
        productName: string
        productId: number | string
        productArticle: number | string
        action: 'deleteProduct' | 'archiveProduct' | 'publishProduct' | 'unpublishProduct'
        isLoading?: boolean
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        (e: 'confirm'): void
        (e: 'cancel'): void
    }>()

    const { t } = useI18n()
    const modalStore = useModalStore()

    const isDeleteAction = computed(() => props.action === 'deleteProduct')
    const isArchiveAction = computed(() => props.action === 'archiveProduct')
    const isPublishAction = computed(() => props.action === 'publishProduct')
    const isUnpublishAction = computed(() => props.action === 'unpublishProduct')

    const confirmationMessageStart = computed(() => {
        if (isDeleteAction.value) {
            return t('product.deleteConfirmMessageStart')
        } else if (isArchiveAction.value) {
            return t('product.archiveConfirmMessageStart')
        } else if (isPublishAction.value) {
            return t('product.publishConfirmMessageStart')
        } else if (isUnpublishAction.value) {
            return t('product.unpublishConfirmMessageStart')
        }
        return ''
    })

    const confirmationMessageEnd = computed(() => {
        if (isDeleteAction.value) {
            return t('product.deleteConfirmMessageEnd')
        } else if (isArchiveAction.value) {
            return t('product.archiveConfirmMessageEnd')
        } else if (isPublishAction.value) {
            return t('product.publishConfirmMessageEnd')
        } else if (isUnpublishAction.value) {
            return t('product.unpublishConfirmMessageEnd')
        }
        return ''
    })

    const actionDescription = computed(() => {
        if (isDeleteAction.value) {
            return t('product.deleteDescription')
        } else if (isArchiveAction.value) {
            return t('product.archiveDescription')
        } else if (isPublishAction.value) {
            return t('product.publishDescription')
        } else if (isUnpublishAction.value) {
            return t('product.unpublishDescription')
        }
        return ''
    })

    const confirmButtonText = computed(() => {
        if (isDeleteAction.value) {
            return t('delete')
        } else if (isArchiveAction.value) {
            return t('archive')
        } else if (isPublishAction.value) {
            return t('publish')
        } else if (isUnpublishAction.value) {
            return t('unpublish')
        }
        return ''
    })

    const confirmButtonColor = computed(() => {
        if (isDeleteAction.value) {
            return 'red'
        } else if (isArchiveAction.value) {
            return 'yellow'
        } else if (isPublishAction.value) {
            return 'green'
        } else if (isUnpublishAction.value) {
            return 'gray'
        }
        return 'blue'
    })

    const handleConfirm = () => {
        emit('confirm')
    }

    const handleCancel = () => {
        emit('cancel')
        modalStore.closeModal()
    }
</script>
