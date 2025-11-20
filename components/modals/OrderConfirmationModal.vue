<template>
    <div class="order-confirmation-modal">
        <div class="px-6 py-4">
            <div class="flex flex-col items-center gap-4">
                <div
                    class="w-16 h-16 rounded-full flex items-center justify-center"
                    :class="iconBackgroundClass"
                >
                    <svg class="w-8 h-8" :class="iconColorClass">
                        <use :xlink:href="`/sprite.svg#${iconName}`" />
                    </svg>
                </div>

                <div class="text-center">
                    <h3 class="text-title2 font-bold text-gray-950 mb-2">
                        {{ modalTitle }}
                    </h3>
                    <p class="text-subtitle1 text-gray-600">
                        {{ modalMessage }}
                    </p>
                </div>

                <div v-if="orderNumber" class="text-subtitle2 text-gray-500">
                    {{ t('orders.modal.orderNumber') }}:
                    <span class="font-semibold">{{ orderNumber }}</span>
                </div>
            </div>
        </div>

        <div class="flex gap-3 px-6 pb-6">
            <Button
                :disabled="isLoading"
                color="gray"
                variant="outline"
                size="lg"
                class="flex-1"
                @click="handleCancel"
            >
                {{ t('common.cancel') }}
            </Button>
            <Button
                :loading="isLoading"
                :color="confirmButtonColor"
                variant="filled"
                size="lg"
                class="flex-1"
                @click="handleConfirm"
            >
                {{ confirmButtonText }}
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'

    type OrderActionType = 'delete' | 'approve' | 'decline' | 'reset'

    interface Props {
        orderNumber?: string
        orderId: number
        action: OrderActionType
        isLoading?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        orderNumber: '',
        isLoading: false,
    })

    const emit = defineEmits<{
        confirm: []
        cancel: []
    }>()

    const { t } = useI18n()

    const actionConfig = computed(() => {
        const configs: Record<
            OrderActionType,
            {
                title: string
                message: string
                icon: string
                iconBg: string
                iconColor: string
                confirmColor: string
                confirmText: string
            }
        > = {
            delete: {
                title: t('orders.modal.delete.title'),
                message: t('orders.modal.delete.message'),
                icon: 'trash',
                iconBg: 'bg-red-50',
                iconColor: 'text-red-500',
                confirmColor: 'red',
                confirmText: t('common.delete'),
            },
            approve: {
                title: t('orders.modal.approve.title'),
                message: t('orders.modal.approve.message'),
                icon: 'check-circle',
                iconBg: 'bg-green-50',
                iconColor: 'text-green-500',
                confirmColor: 'green',
                confirmText: t('orders.modal.approve.confirm'),
            },
            decline: {
                title: t('orders.modal.decline.title'),
                message: t('orders.modal.decline.message'),
                icon: 'x-circle',
                iconBg: 'bg-red-50',
                iconColor: 'text-red-500',
                confirmColor: 'red',
                confirmText: t('orders.modal.decline.confirm'),
            },
            reset: {
                title: t('orders.modal.reset.title'),
                message: t('orders.modal.reset.message'),
                icon: 'rotate-ccw',
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-500',
                confirmColor: 'blue',
                confirmText: t('orders.modal.reset.confirm'),
            },
        }

        return configs[props.action]
    })

    const modalTitle = computed(() => actionConfig.value.title)
    const modalMessage = computed(() => actionConfig.value.message)
    const iconName = computed(() => actionConfig.value.icon)
    const iconBackgroundClass = computed(() => actionConfig.value.iconBg)
    const iconColorClass = computed(() => actionConfig.value.iconColor)
    const confirmButtonColor = computed(() => actionConfig.value.confirmColor)
    const confirmButtonText = computed(() => actionConfig.value.confirmText)

    const handleConfirm = () => {
        if (!props.isLoading) {
            emit('confirm')
        }
    }

    const handleCancel = () => {
        if (!props.isLoading) {
            emit('cancel')
        }
    }
</script>

<style scoped lang="scss">
    .order-confirmation-modal {
        @apply w-full;
    }
</style>
