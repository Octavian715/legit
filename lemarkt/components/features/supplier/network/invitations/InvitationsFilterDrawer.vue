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
        @update:is-open="$emit('update:isOpen', $event)"
    >
        <template #default>
            <div v-if="isInitializing" class="flex items-center justify-center mx-auto h-full">
                <div class="flex justify-center items-center p-8 rotate-90">
                    <span class="loader"></span>
                </div>
            </div>

            <div v-else-if="initializationError" class="p-4 bg-red-50 rounded-lg">
                <div class="flex">
                    <svg
                        class="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <div>
                        <p class="text-sm font-medium text-red-800">{{ t('error') }}</p>
                        <p class="text-sm text-red-700 mt-1">{{ initializationError }}</p>
                        <Button
                            variant="outline"
                            color="red"
                            size="sm"
                            class="mt-2"
                            @click="initializeFilterData"
                        >
                            {{ t('retry') }}
                        </Button>
                    </div>
                </div>
            </div>

            <div v-else class="filters-container">
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

                <Collapse>
                    <template #title>
                        <span class="text-subtitle font-medium">{{ t('filters.dateRange') }}</span>
                    </template>
                    <div class="filter-section">
                        <DatePicker
                            v-model="dateRangeModel"
                            :label="t('filters.chooseDateRange')"
                            :placeholder="t('filters.selectDateRange')"
                            :is-range-mode="true"
                            size="md"
                            date-format="yyyy-MM-dd"
                            @range-selected="onDateRangeSelect"
                        />
                    </div>
                </Collapse>

                <Collapse v-if="statusOptions && statusOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('network.invitations.status')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="status in statusOptions"
                                :key="`status-${status.value}`"
                                :model-value="isStatusSelected(status.value)"
                                :name="`status-${status.value}`"
                                size="md"
                                @update:model-value="(value) => toggleStatus(status.value, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ status.label }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="channelOptions && channelOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('network.invitations.channel')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="channel in channelOptions"
                                :key="`channel-${channel.value}`"
                                :model-value="isChannelSelected(channel.value)"
                                :name="`channel-${channel.value}`"
                                size="md"
                                @update:model-value="(value) => toggleChannel(channel.value, value)"
                            >
                                <template #default>
                                    <span class="text-body">{{ channel.label }}</span>
                                </template>
                            </Checkbox>
                        </div>
                    </div>
                </Collapse>

                <Collapse v-if="referredRoleOptions && referredRoleOptions.length > 0">
                    <template #title>
                        <span class="text-subtitle font-medium">{{
                            t('network.invitations.referredRole')
                        }}</span>
                    </template>
                    <div class="filter-section">
                        <div class="filter-options">
                            <Checkbox
                                v-for="role in referredRoleOptions"
                                :key="`role-${role.value}`"
                                :model-value="isReferredRoleSelected(role.value)"
                                :name="`role-${role.value}`"
                                size="md"
                                @update:model-value="
                                    (value) => toggleReferredRole(role.value, value)
                                "
                            >
                                <template #default>
                                    <span class="text-body">{{ role.label }}</span>
                                </template>
                            </Checkbox>
                        </div>
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
                    <svg class="w-4 h-4 mr-2">
                        <use xlink:href="/sprite.svg#check" />
                    </svg>
                    {{ t('filters.apply') }}
                </Button>
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useNetworkStore } from '~/stores/network'
    import type { InvitationFilters } from '~/types/network'
    import type { DateRange } from '~/types/ui/datePicker'

    interface Props {
        isOpen: boolean
        filters?: InvitationFilters
    }

    const props = withDefaults(defineProps<Props>(), {
        filters: () => ({
            search: '',
            status: [],
            channel: [],
            referred_role: [],
            start_date: '',
            end_date: '',
        }),
    })

    const emit = defineEmits<{
        'update:isOpen': [value: boolean]
        apply: [filters: InvitationFilters]
        reset: []
    }>()

    const { t } = useI18n()
    const networkStore = useNetworkStore()

    const initializationError = ref<string | null>(null)
    const isInitializing = ref(false)
    const searchQuery = ref('')
    const selectedStatuses = ref<string[]>([])
    const selectedChannels = ref<string[]>([])
    const selectedReferredRoles = ref<string[]>([])
    const dateRangeModel = ref<DateRange | null>(null)

    const defaultFilters: InvitationFilters = {
        search: '',
        status: [],
        channel: [],
        referred_role: [],
        start_date: '',
        end_date: '',
    }

    const localFilters = ref<InvitationFilters>({ ...defaultFilters })

    const statusOptions = computed(() => {
        return (
            networkStore.invitationFilters?.statuses?.filter(
                (item) => item && typeof item.value === 'string'
            ) || []
        )
    })

    const channelOptions = computed(() => {
        return (
            networkStore.invitationFilters?.channels?.filter(
                (item) => item && typeof item.value === 'string'
            ) || []
        )
    })

    const referredRoleOptions = computed(() => {
        return (
            networkStore.invitationFilters?.referred_roles?.filter(
                (item) => item && typeof item.value === 'string'
            ) || []
        )
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (searchQuery.value?.trim()) count++
        if (selectedStatuses.value.length > 0) count++
        if (selectedChannels.value.length > 0) count++
        if (selectedReferredRoles.value.length > 0) count++
        if (dateRangeModel.value?.start && dateRangeModel.value?.end) count++

        return count
    })

    const initializeFilterData = async (): Promise<void> => {
        isInitializing.value = true
        initializationError.value = null

        try {
            await networkStore.fetchInvitationFilters()
        } catch (error: any) {
            console.error('Failed to initialize invitation filter data:', error)
            initializationError.value = error.message || t('network.invitations.filters.loadError')
        } finally {
            isInitializing.value = false
        }
    }

    const handleSearch = (value: string) => {
        searchQuery.value = value?.trim() || ''
    }

    const handleClearSearch = () => {
        searchQuery.value = ''
    }

    const onDateRangeSelect = (range: DateRange) => {
        dateRangeModel.value = range
        if (range && range.start && range.end) {
            localFilters.value.start_date = range.start
            localFilters.value.end_date = range.end
        } else {
            localFilters.value.start_date = ''
            localFilters.value.end_date = ''
        }
    }

    const isStatusSelected = (statusValue: string): boolean => {
        return selectedStatuses.value.includes(statusValue)
    }

    const toggleStatus = (statusValue: string, isSelected: boolean) => {
        if (isSelected) {
            if (!selectedStatuses.value.includes(statusValue)) {
                selectedStatuses.value.push(statusValue)
            }
        } else {
            selectedStatuses.value = selectedStatuses.value.filter(
                (status) => status !== statusValue
            )
        }
    }

    const applyFilters = () => {
        const invitationFilters: InvitationFilters = {}

        if (searchQuery.value?.trim()) {
            invitationFilters.search = searchQuery.value.trim()
        }

        if (selectedStatuses.value.length > 0) {
            invitationFilters.status = [...selectedStatuses.value]
        }

        if (localFilters.value.start_date && localFilters.value.end_date) {
            invitationFilters.start_date = localFilters.value.start_date
            invitationFilters.end_date = localFilters.value.end_date
        }

        emit('apply', invitationFilters)
        emit('update:isOpen', false)
    }

    const resetFilters = () => {
        searchQuery.value = ''
        selectedStatuses.value = []
        dateRangeModel.value = null
        localFilters.value = { ...defaultFilters }

        emit('reset')

        const emptyFilters: InvitationFilters = { ...defaultFilters }
        emit('apply', emptyFilters)
        emit('update:isOpen', false)
    }

    const normalizeFilterValue = <T,>(value: T | T[]): T[] => {
        if (Array.isArray(value)) {
            return value.filter(Boolean)
        }
        if (value && typeof value === 'string') {
            return [value]
        }
        return []
    }

    const syncFiltersFromProps = () => {
        if (props.filters) {
            localFilters.value = {
                ...defaultFilters,
                ...props.filters,
            }

            searchQuery.value = props.filters.search || ''
            selectedStatuses.value = normalizeFilterValue(props.filters.status)

            if (props.filters.start_date && props.filters.end_date) {
                dateRangeModel.value = {
                    start: props.filters.start_date,
                    end: props.filters.end_date,
                }
            } else {
                dateRangeModel.value = null
            }
        }
    }

    watch(
        () => props.filters,
        () => syncFiltersFromProps(),
        { immediate: true, deep: true }
    )

    watch(
        () => props.isOpen,
        async (val) => {
            if (val) {
                await initializeFilterData()
                syncFiltersFromProps()
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

    .filter-options {
        @apply grid grid-cols-2 gap-2;
    }

    .filter-footer {
        @apply flex gap-3 px-4;
    }
</style>
