<!-- components/modals/ExitConfirmationModal.vue -->
<template>
    <Modal
        :is-open="isOpen"
        :title="modalTitle"
        content-width="min-w-md"
        @update:is-open="$emit('update:is-open', $event)"
        @close="handleCancel"
    >
        <!-- Content -->
        <div class="text-center space-y-3 px-4">
            <p class="text-subtitle2 text-gray-700 leading-relaxed">
                {{ modalMessage }}
            </p>

            <!-- Logout link (if needed for other use cases) -->
            <div v-if="showLogoutOption" class="pt-4 border-t border-gray-200">
                <button
                    type="button"
                    class="text-sm text-gray-600 hover:text-gray-800 underline"
                    @click="handleLogout"
                >
                    {{ $t('auth.logout', 'Logout') }}
                </button>
            </div>
        </div>

        <!-- Footer Slot - Use Modal's built-in footer slot! -->
        <template #footer>
            <!-- Layout with Primary Action (3 buttons: Primary + Cancel + Discard) -->
            <div v-if="hasPrimaryAction" class="flex gap-2.5 justify-center">
                <!-- Secondary Actions Row -->
                <div class="flex gap-2.5 w-full">
                    <Button
                        variant="outline"
                        color="gray"
                        :label="cancelText"
                        size="lg"
                        @click="handleCancel"
                    />
                    <!-- Primary Action Slot (e.g., Save & Continue) -->
                    <Button
                        variant="outline"
                        color="red"
                        :label="okText"
                        size="lg"
                        @click="handleConfirm"
                    />
                </div>
                <!-- Primary Action Slot (e.g., Save & Continue) -->
                <slot name="primary-action" />
            </div>

            <!-- Default Layout (2 buttons: Cancel + OK) - Backward compatible with auth layout -->
            <div v-else class="flex gap-2.5 justify-center">
                <Button
                    variant="outline"
                    color="gray"
                    :label="cancelText"
                    size="lg"
                    @click="handleCancel"
                />
                <Button color="red" :label="okText" size="lg" @click="handleConfirm" />
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
    interface Props {
        isOpen?: boolean
        modalTitle?: string
        modalMessage?: string
        okText?: string
        cancelText?: string
        showLogoutOption?: boolean
    }

    interface Emits {
        (e: 'update:is-open', value: boolean): void
        (e: 'confirm'): void
        (e: 'cancel'): void
        (e: 'logout'): void
    }

    const props = withDefaults(defineProps<Props>(), {
        isOpen: false,
        modalTitle: 'Exit?',
        modalMessage: 'Are you sure you want to exit?',
        okText: 'Exit',
        cancelText: 'Cancel',
        showLogoutOption: false,
    })

    const emit = defineEmits<Emits>()
    const slots = useSlots()

    // Check if primary-action slot is provided
    const hasPrimaryAction = computed(() => !!slots['primary-action'])

    const handleConfirm = () => {
        emit('confirm')
        emit('update:is-open', false)
    }

    const handleCancel = () => {
        emit('cancel')
        emit('update:is-open', false)
    }

    const handleLogout = () => {
        emit('logout')
        emit('update:is-open', false)
    }
</script>
