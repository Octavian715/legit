<template>
    <Button
        type="button"
        color="gray"
        :size="sizefollow"
        :font-weight="fontWidthFollow"
        variant="filled"
        :loading="loading || localLoading"
        :container-classes="baseClasses"
        :disabled="loading || localLoading || !userId"
        @click="handleFollow"
    >
        {{ isFollow ? t('connections.unfollow') : t('connections.follow') }}
    </Button>
</template>

<script lang="ts" setup>
    import { withDefaults, defineEmits, defineProps } from 'vue'
    interface Props {
        loading?: boolean
        userId: number
        supplierName?: string
        isFollow: boolean
        size?: string
        fontWidth?: string
        classes?: string
        controlled?: boolean
    }

    const props = withDefaults(defineProps<Props>(), { size: 'sm', classes: '', controlled: false })

    const emit = defineEmits<{
        (e: 'set-follow', value: boolean): void
    }>()

    const { t } = useI18n()
    const toast = useToastNotification()

    const localLoading = ref(false)

    const { handleFollowAction } = useConnections()

    const handleFollow = async (): Promise<void> => {
        if (!props.userId || props.loading || localLoading.value) return

        if (props.controlled) {
            emit('set-follow', !props.isFollow)
            return
        }
        localLoading.value = true

        try {
            const success = await handleFollowAction(
                props.supplierName || '',
                props.userId,
                props.isFollow
            )

            if (success) {
                emit('set-follow', !props.isFollow)
            }
        } catch (error: any) {
            console.error('Follow toggle error:', error)
            toast.error(error.message || t('connections.errors.followFailed'))
        } finally {
            localLoading.value = false
        }
    }

    const sizefollow = computed(() => {
        return props.size || 'sm'
    })
    const fontWidthFollow = computed(() => {
        return props.fontWidth || 'medium'
    })

    const baseClasses = computed(() => {
        const classes = ''
        // const classes = ['flex-1 sm:flex-initial']
        return classes.concat(props.classes)
    })
</script>
