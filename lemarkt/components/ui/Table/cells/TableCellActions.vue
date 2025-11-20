<template>
    <div class="flex gap-2 items-center justify-end">
        <!-- Show profile -->
        <Button
            v-if="showAction('show-profile') || customAction === 'accepted'"
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
                <span class="leading-none">{{ t('profile.title') }}</span>
            </div>
        </Button>

        <!-- Connect button -->
        <Button
            v-if="showAction('connect')"
            size="sm"
            color="red"
            variant="filled"
            font-weight="normal"
            @click="emitAction('connect')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#close"></use>
                </svg>
                <span class="leading-none">{{ t('connections.connect') }}</span>
            </div>
        </Button>

        <Button
            v-if="showAction('accept')"
            size="sm"
            color="red"
            variant="filled"
            font-weight="normal"
            @click="emitAction('accept')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#check"></use>
                </svg>
                <span class="leading-none">{{ t('accept') }}</span>
            </div>
        </Button>
        <!-- Disconnect button -->
        <Button
            v-if="showAction('disconnect')"
            size="sm"
            color="red"
            variant="filled"
            font-weight="normal"
            @click="emitAction('disconnect')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#close"></use>
                </svg>
                <span class="leading-none">{{ t('connections.disconnect') }}</span>
            </div>
        </Button>

        <!-- Cancel disconnect button -->
        <Button
            v-if="showAction('cancel-disconnect') || customAction === 'pending'"
            size="sm"
            color="gray"
            variant="filled"
            font-weight="normal"
            :label="t('cancel', { n: 1 })"
            @click="emitAction('cancel-disconnect')"
        />

        <Button
            v-if="showAction('unfollow')"
            size="sm"
            color="red"
            variant="filled"
            font-weight="normal"
            container-classes="!text-red-500 hover:!text-white active:!text-white !bg-red-50 hover:!bg-red-500 active:!bg-red-700"
            @click="emitAction('unfollow')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#close"></use>
                </svg>
            </div>
        </Button>
        <Button
            v-if="showAction('view-pdf')"
            size="sm"
            color="blue"
            variant="filled"
            font-weight="normal"
            @click="emitAction('view-pdf')"
        >
            <div class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4 flex-shrink-0">
                    <use xlink:href="/sprite.svg#info"></use>
                </svg>
                <span class="leading-none">{{ t('table.viewPdf') }}</span>
            </div>
        </Button>
        <ButtonIcon
            v-if="showAction('show')"
            :label="t('viewDetails')"
            icon="eye"
            color="blue"
            size="md"
            icon-size="sm"
            variant="ghost"
            @click="emitAction('show')"
        />
        <ButtonIcon
            v-if="showAction('edit')"
            :label="t('edit')"
            icon="edit2"
            color="green"
            size="md"
            icon-size="sm"
            variant="ghost"
            @click="emitAction('edit')"
        />
        <ButtonIcon
            v-if="showAction('print')"
            :label="t('print')"
            icon="printer"
            color="gray"
            size="md"
            icon-size="sm"
            variant="ghost"
            @click="emitAction('print')"
        />
        <ButtonIcon
            v-if="showAction('download')"
            :label="t('download')"
            icon="save"
            color="black"
            size="md"
            icon-size="sm"
            variant="ghost"
            @click="emitAction('download')"
        />
        <ButtonIcon
            v-if="showAction('delete')"
            :label="t('delete')"
            icon="trash"
            color="red"
            size="md"
            icon-size="sm"
            variant="ghost"
            @click="emitAction('delete')"
        />

        <!-- Invite again button -->
        <Button
            v-if="
                showAction('invite') || customAction === 'expired' || customAction === 'cancelled'
            "
            size="sm"
            color="red"
            variant="filled"
            font-weight="normal"
            @click="emitAction('invite')"
        >
            <div class="flex items-center justify-center gap-1">
                <span class="leading-none">{{ t('network.invitations.actions.reinvite') }}</span>
            </div>
        </Button>
    </div>
</template>

<script setup lang="ts">
    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: any
            actions?: string[]
            row?: Record<string, any>
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: null,
            actions: () => [],
            row: () => ({}),
        }
    )

    const { t } = useI18n()
    const emit = defineEmits<{
        (e: 'actions', payload: { type: string; row: Record<string, any> }): void
    }>()

    // Safe computed property to handle undefined cellValue
    const customAction = computed(() => {
        return props.cellValue?.customAction ?? null
    })

    const showAction = (type: string) => {
        return props.actions.includes(type)
    }

    const emitAction = (type: string) => {
        emit('actions', { type, row: props.row })
    }
</script>
