<!-- ~/components/features/ecommerce/settings/tabs/NotificationRow.vue -->
<template>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-0"> -->
        <!-- Label la stânga -->
        <span class="text-subtitle3 text-gray-950">{{ label }}</span>

        <!-- Checkboxes container - stack vertical pe mobile, horizontal pe desktop -->
        <div class="flex items-center gap-3 md:mr-auto">
            <!-- E-Mail checkbox -->
            <Checkbox
                :model-value="email"
                :label="$t('settings.notifications.email', 'E-Mail')"
                :name="`${name}_email`"
                @update:model-value="handleEmailChange"
            />

            <!-- In-app checkbox -->
            <Checkbox
                :model-value="inApp"
                :label="$t('settings.notifications.inApp', 'In-app')"
                :name="`${name}_inapp`"
                @update:model-value="handleInAppChange"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        label?: string
        email?: boolean
        inApp?: boolean
        name?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        label: '',
        email: false,
        inApp: false,
        name: 'notification',
    })

    const emit = defineEmits<{
        (e: 'update:email', value: boolean): void
        (e: 'update:inApp', value: boolean): void
        (e: 'change'): void
    }>()

    const handleEmailChange = (value: boolean) => {
        emit('update:email', value)
        emit('change')
    }

    const handleInAppChange = (value: boolean) => {
        emit('update:inApp', value)
        emit('change')
    }
</script>
