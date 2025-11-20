<template>
    <div class="flex gap-2 items-center justify-end">
        <!-- Cancel button for pending invitations -->
        <Button
            v-if="invitation.status === 'pending'"
            size="sm"
            color="red"
            variant="outline"
            font-weight="normal"
            @click="emitAction('cancel')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#close"></use>
                </svg>
                <span class="leading-none">{{ t('connections.actions.cancel') }}</span>
            </div>
        </Button>

        <!-- Show profile button for accepted invitations -->
        <Button
            v-if="invitation.status === 'accepted'"
            size="sm"
            color="blue"
            variant="filled"
            font-weight="normal"
            @click="emitAction('show-profile')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#profile"></use>
                </svg>
                <span class="leading-none">{{ t('network.actions.viewProfile') }}</span>
            </div>
        </Button>

        <!-- Invite again button for expired invitations -->
        <Button
            v-if="invitation.status === 'expired'"
            size="sm"
            color="blue"
            variant="filled"
            font-weight="normal"
            @click="emitAction('invite')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#send"></use>
                </svg>
                <span class="leading-none">{{ t('network.invitations.actions.reinvite') }}</span>
            </div>
        </Button>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { NetworkInvitation } from '~/types/network'

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: null
            row?: Record<string, any>
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: null,
            row: () => ({}),
        }
    )

    const { t } = useI18n()
    const emit = defineEmits<{
        (e: 'actions', payload: { type: string; row: Record<string, any> }): void
    }>()

    const invitation = computed<NetworkInvitation>(() => {
        return props.row?.originalData || {}
    })

    const emitAction = (type: string) => {
        emit('actions', { type, row: props.row || {} })
    }
</script>
