<template>
    <Drawer
        :is-open="isOpen"
        position="right"
        :title="t('filters.title')"
        :sub-title="
            activeFiltersCount > 0
                ? t('filters.appliedCount', { count: activeFiltersCount })
                : t('filters.noFiltersApplied')
        "
        :width="'400px'"
        :show-default-footer="false"
        @update:is-open="handleClose"
    >
        <template #default>
            <div class="filters-container">
                <!-- Search -->
                <div class="mb-4">
                    <InputSearch
                        v-model="searchQuery"
                        :placeholder="t('filters.searchPlaceholder')"
                        size="lg"
                        background="bg-gray-150 text-gray-600"
                        container-classes="rounded-sm"
                        @search="handleSearch"
                        @clear="handleClearSearch"
                    />
                </div>

                <!-- Company Name -->
                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('companyName') }}</span>
                    </template>
                    <div class="filter-section">
                        <Input
                            v-model="companyName"
                            :label="t('companyName')"
                            size="md"
                            :error="!!validationErrors.companyName"
                            :error-message="validationErrors.companyName"
                            @input="clearFieldError('companyName')"
                        />
                    </div>
                </Collapse>

                <!-- Email -->
                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('email') }}</span>
                    </template>
                    <div class="filter-section">
                        <Input
                            v-model="email"
                            :label="t('email')"
                            type="email"
                            size="md"
                            :error="!!validationErrors.email"
                            :error-message="validationErrors.email"
                            @input="clearFieldError('email')"
                        />
                    </div>
                </Collapse>

                <!-- Username -->
                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('username') }}</span>
                    </template>
                    <div class="filter-section">
                        <Input
                            v-model="username"
                            :label="t('username')"
                            size="md"
                            :error="!!validationErrors.username"
                            :error-message="validationErrors.username"
                            @input="clearFieldError('username')"
                        />
                    </div>
                </Collapse>
            </div>
        </template>

        <template #footer>
            <div class="filter-footer">
                <Button
                    variant="outline"
                    color="gray"
                    size="lg"
                    class="flex-1"
                    @click="resetFilters"
                >
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#reset" />
                    </svg>
                    {{ t('filters.reset') }}
                </Button>
                <Button
                    variant="filled"
                    color="blue"
                    size="lg"
                    class="flex-1"
                    @click="applyFilters"
                >
                    {{ t('filters.apply') }}
                </Button>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
    import { ref, computed, watch, reactive } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface Props {
        isOpen: boolean
        filters?: Record<string, any>
        errors?: Record<string, string[]>
    }

    interface Emits {
        (e: 'update:isOpen', value: boolean): void
        (e: 'apply', filters: Record<string, any>): void
        (e: 'reset'): void
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({}),
        errors: () => ({}),
    })

    const emit = defineEmits<Emits>()
    const { t } = useI18n()

    // Local filter state
    const searchQuery = ref('')
    const companyName = ref('')
    const email = ref('')
    const username = ref('')

    // Validation errors state
    const validationErrors = reactive<Record<string, string>>({
        companyName: '',
        email: '',
        username: '',
    })

    // Computed
    const activeFiltersCount = computed(() => {
        let count = 0
        if (searchQuery.value) count++
        if (companyName.value) count++
        if (email.value) count++
        if (username.value) count++
        return count
    })

    // Methods
    const handleSearch = () => {}

    const handleClearSearch = () => {
        searchQuery.value = ''
    }

    const clearFieldError = (field: string) => {
        if (validationErrors[field]) {
            validationErrors[field] = ''
        }
    }

    const clearAllErrors = () => {
        validationErrors.companyName = ''
        validationErrors.email = ''
        validationErrors.username = ''
    }

    const applyFilters = () => {
        clearAllErrors()

        const filters: Record<string, any> = {}
        if (searchQuery.value?.trim()) filters.search = searchQuery.value.trim()
        if (companyName.value?.trim()) filters.companyName = companyName.value.trim()
        if (email.value?.trim()) filters.email = email.value.trim()
        if (username.value?.trim()) filters.username = username.value.trim()

        emit('apply', filters)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        companyName.value = ''
        email.value = ''
        username.value = ''
        clearAllErrors()

        emit('reset')
        emit('apply', {})
        emit('update:isOpen', false)
    }

    const handleClose = (value: boolean) => {
        if (!value) clearAllErrors()
        emit('update:isOpen', value)
    }

    // Sync filters from props
    const syncFiltersFromProps = () => {
        if (props.filters) {
            searchQuery.value = props.filters.search || ''
            companyName.value = props.filters.companyName || ''
            email.value = props.filters.email || ''
            username.value = props.filters.username || ''
        }
    }

    // Sync validation errors from props (map snake_case API fields to camelCase)
    const syncErrorsFromProps = () => {
        if (props.errors && Object.keys(props.errors).length > 0) {
            clearAllErrors()

            Object.keys(props.errors).forEach((field) => {
                const errorMessages = props.errors[field]
                if (errorMessages && errorMessages.length > 0) {
                    // Map snake_case to camelCase
                    if (field === 'company_name' || field === 'companyName') {
                        validationErrors.companyName = errorMessages[0]
                    } else if (field === 'email') {
                        validationErrors.email = errorMessages[0]
                    } else if (field === 'username') {
                        validationErrors.username = errorMessages[0]
                    }
                }
            })
        }
    }

    // Watchers
    watch(() => props.filters, syncFiltersFromProps, { immediate: true, deep: true })
    watch(() => props.errors, syncErrorsFromProps, { immediate: true, deep: true })
    watch(
        () => props.isOpen,
        (val) => {
            if (val) {
                syncFiltersFromProps()
                syncErrorsFromProps()
            } else {
                clearAllErrors()
            }
        }
    )
</script>

<style scoped lang="scss">
    .filters-container {
        @apply space-y-2;
    }

    .filter-section {
        @apply py-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }
</style>
