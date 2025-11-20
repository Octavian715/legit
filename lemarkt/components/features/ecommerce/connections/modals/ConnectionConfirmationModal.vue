<template>
    <div class="connection-confirmation-modal">
        <div class="flex items-center gap-3 mb-4 px-5 px-4">
            <div class="flex-1">
                <h3 class="text-title2 font-semibold text-gray-950 mb-1">
                    {{ confirmationMessageStart }}<strong>{{ props.userName }}</strong
                    >{{ confirmationMessageEnd }}
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
        userName: string
        userId: number
        action: 'connect' | 'disconnect' | 'cancelInvitation'
        isLoading?: boolean
    }

    const props = defineProps<Props>()

    const emit = defineEmits<{
        (e: 'confirm'): void
        (e: 'cancel'): void
    }>()

    const { t } = useI18n()
    const modalStore = useModalStore()

    const isConnecting = computed(() => props.action === 'connect')
    const isDisconnect = computed(() => props.action === 'disconnect')
    const isCancelInvitation = computed(() => props.action === 'cancelInvitation')

    const confirmationMessageStart = computed(() => {
        if (isConnecting.value) {
            return t('connections.connectConfirmMessageStart')
        } else if (isDisconnect.value) {
            return t('connections.disconnectConfirmMessageStart')
        } else if (isCancelInvitation.value) {
            return t('connections.cancelInvitationConfirmMessageStart')
        }
        return ''
    })
    const confirmationMessageEnd = computed(() => {
        if (isConnecting.value) {
            return t('connections.connectConfirmMessageEnd')
        } else if (isDisconnect.value) {
            return t('connections.disconnectConfirmMessageEnd')
        } else if (isCancelInvitation.value) {
            return t('connections.cancelInvitationConfirmMessageEnd')
        }
        return ''
    })

    const actionDescription = computed(() => {
        if (isConnecting.value) {
            return t('connections.connectDescription')
        } else if (isDisconnect.value) {
            return t('connections.disconnectDescription')
        } else if (isCancelInvitation.value) {
            return t('connections.cancelInvitationDescription')
        }
        return ''
    })

    const confirmButtonText = computed(() => {
        if (isConnecting.value) {
            return t('connections.sendRequest')
        } else if (isDisconnect.value) {
            return t('connections.removeConnection')
        } else if (isCancelInvitation.value) {
            return t('connections.cancelInvitation')
        }
        return ''
    })
    const confirmButtonColor = computed(() => {
        return isCancelInvitation.value ? 'blue' : 'red'
    })

    const handleConfirm = () => {
        emit('confirm')
    }

    const handleCancel = () => {
        emit('cancel')
        modalStore.closeModal()
    }
</script>
