<!-- components/ui/SelectWithAdd.vue -->
<template>
    <div class="select-with-add relative">
        <!-- Select Input -->
        <div class="relative">
            <select
                :id="fieldId"
                v-model="selectedValue"
                :name="name"
                class="select-input"
                :class="[
                    'w-full px-4 py-3 pr-10 text-subtitle2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    {
                        'border-red-500 focus:ring-red-500 focus:border-red-500': error,
                        'border-gray-300 hover:border-gray-400': !error,
                        'bg-gray-100 cursor-not-allowed': disabled,
                        'bg-white': !disabled,
                    },
                ]"
                :disabled="disabled"
                @change="handleSelectChange"
            >
                <option value="" disabled>
                    {{ placeholder }}
                </option>
                <option v-for="option in allOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
                <!-- Add new option -->
                <option value="__ADD_NEW__">
                    {{ addLabel }}
                </option>
            </select>

            <!-- Dropdown Icon -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400">
                    <use :xlink:href="`/sprite.svg#chevron-down`"></use>
                </svg>
            </div>
        </div>

        <!-- Error Message -->
        <div v-if="error && errorMessage" class="mt-1">
            <p class="text-caption1 text-red-500" role="alert">
                {{ errorMessage }}
            </p>
        </div>

        <!-- Add New Item Modal -->
        <Modal
            v-model:is-open="showAddModal"
            :title="addModalTitle"
            content-width="sm:max-w-md"
            hide-footer
            @close="handleCloseAddModal"
        >
            <div class="space-y-4">
                <Input
                    v-model="newItemValue"
                    :label="addInputLabel"
                    :placeholder="addInputPlaceholder"
                    background="bg-white"
                    :error="!!addItemError"
                    :error-message="addItemError"
                    @input="addItemError = ''"
                    @keydown.enter="handleAddItem"
                />

                <div class="flex gap-3 justify-end">
                    <Button
                        type="button"
                        color="gray"
                        variant="filled"
                        :label="$t('cancel', 'Cancel')"
                        @click="handleCloseAddModal"
                    />

                    <Button
                        type="button"
                        color="blue"
                        :label="$t('add', 'Add')"
                        :disabled="!newItemValue.trim()"
                        @click="handleAddItem"
                    />
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface SelectOption {
        value: string | number
        label: string
    }

    interface Props {
        modelValue: string | number | null
        options: SelectOption[]
        placeholder?: string
        addLabel?: string
        addModalTitle?: string
        addInputLabel?: string
        addInputPlaceholder?: string
        name?: string
        disabled?: boolean
        error?: boolean
        errorMessage?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        placeholder: 'Select an option',
        addLabel: 'Add new item',
        addModalTitle: 'Add New Item',
        addInputLabel: 'Item Name',
        addInputPlaceholder: 'Enter item name',
        name: undefined,
        disabled: false,
        error: false,
        errorMessage: '',
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: string | number | null): void
        (e: 'addItem', value: string): void
    }>()

    // Composables
    const { t } = useI18n({ useScope: 'global' })

    // State
    const selectedValue = ref<string | number | null>(props.modelValue)
    const showAddModal = ref(false)
    const newItemValue = ref('')
    const addItemError = ref('')

    // Computed
    const fieldId = computed(() => {
        return props.name ? `select-${props.name}` : 'select-with-add'
    })

    const allOptions = computed(() => {
        return [...props.options]
    })

    // Methods
    const handleSelectChange = (event: Event) => {
        const target = event.target as HTMLSelectElement
        const value = target.value

        if (value === '__ADD_NEW__') {
            showAddModal.value = true
            // Reset select to previous value
            selectedValue.value = props.modelValue
        } else {
            selectedValue.value = value || null
            emit('update:modelValue', selectedValue.value)
        }
    }

    const handleAddItem = () => {
        const trimmedValue = newItemValue.value.trim()

        if (!trimmedValue) {
            addItemError.value = t('validation.required', 'This field is required')
            return
        }

        // Check if item already exists
        const exists = props.options.some(
            (option) => option.label.toLowerCase() === trimmedValue.toLowerCase()
        )

        if (exists) {
            addItemError.value = t('validation.itemExists', 'This item already exists')
            return
        }

        // Emit add item event
        emit('addItem', trimmedValue)

        // Select the new item
        selectedValue.value = trimmedValue
        emit('update:modelValue', trimmedValue)

        // Close modal and reset
        handleCloseAddModal()
    }

    const handleCloseAddModal = () => {
        showAddModal.value = false
        newItemValue.value = ''
        addItemError.value = ''
    }

    // Watch props changes
    watch(
        () => props.modelValue,
        (newValue) => {
            selectedValue.value = newValue
        }
    )
</script>

<style scoped>
    .select-input {
        background-image: none;
        appearance: none;
    }

    /* Custom dropdown arrow positioning */
    .select-input::-ms-expand {
        display: none;
    }
</style>
