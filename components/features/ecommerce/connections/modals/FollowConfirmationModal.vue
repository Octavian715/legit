<template>
    <div class="follow-confirmation-modal">
        <div class="flex items-center gap-3 mb-4 px-5">
            <div class="flex-1">
                <h3 class="text-title2 font-semibold text-gray-950 mb-1">
                    {{ confirmationMessageStart }}
                    <strong>{{ props.userName }}</strong>
                    {{ confirmationMessageEnd }}
                </h3>
                <p class="text-subtitle2 text-gray-800 text-center"> {{ actionDescription }} </p>
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
                {{ $t('cancel') }}
            </Button>

            <Button
                color="red"
                variant="filled"
                size="md"
                :disabled="isLoading"
                @click="handleConfirm"
            >
                <span v-if="isLoading" class="flex items-center gap-2">
                    <div
                        class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                    {{ $t('processing') }}
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
        userName: string
        userId: number
        action: 'follow' | 'unfollow'
        isLoading?: boolean
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        (e: 'confirm'): void
        (e: 'cancel'): void
    }>()

    const { t } = useI18n()
    const modalStore = useModalStore()

    const isFollowing = computed(() => props.action === 'unfollow')

    const confirmationMessageStart = computed(() => {
        const messageKey = isFollowing.value
            ? 'connections.unfollowConfirmMessageStart'
            : 'connections.followConfirmMessageStart'
        return t(messageKey)
    })

    const confirmationMessageEnd = computed(() => {
        const messageKey = isFollowing.value
            ? 'connections.unfollowConfirmMessageEnd'
            : 'connections.followConfirmMessageEnd'
        return t(messageKey)
    })

    const actionDescription = computed(() => {
        const descriptionKey = isFollowing.value
            ? 'connections.unfollowDescription'
            : 'connections.followDescription'
        return t(descriptionKey)
    })

    const confirmButtonText = computed(() => {
        return isFollowing.value ? t('connections.stopFollowing') : t('connections.startFollowing')
    })

    const handleConfirm = () => {
        emit('confirm')
    }

    const handleCancel = () => {
        emit('cancel')
        modalStore.closeModal()
    }
</script>
