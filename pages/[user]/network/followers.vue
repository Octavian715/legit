<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.followers') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalFollowers
                                    ? t('followers', { n: totalFollowers })
                                    : t('network.followers.followed')
                            }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <InputSearch
                            v-model.trim="activeFilters.search"
                            :placeholder="t('filters.searchPlaceholder')"
                            size="md"
                            background="bg-gray-150 hidden md:block"
                            container-classes="rounded-sm"
                        />
                        <Button
                            variant="ghost"
                            color="gray"
                            size="lg"
                            square
                            container-classes="!p-1 relative"
                            :tooltip="t('network.followers.filters.title')"
                            @click="openFilters"
                        >
                            <svg class="w-4 h-4 flex-1">
                                <use xlink:href="/sprite.svg#filter" />
                            </svg>
                            <span
                                v-if="hasActiveFilters"
                                class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                                aria-label="Active filters"
                            ></span>
                        </Button>
                    </div>
                </div>

                <ClientOnly>
                    <FollowersTable
                        :followers="followers"
                        :meta="followersMeta"
                        :loading="isLoading"
                        :show-pagination="canLoadMore.followers || totalItems > itemsPerPage"
                        :current-page="currentPage"
                        :items-per-page="itemsPerPage"
                        :sort-by="sortBy"
                        :sort-direction="sortDirection"
                        @page-change="handlePageChange"
                        @items-per-page-change="handleItemsPerPageChange"
                        @sort-change="handleSortChange"
                        @action="handleTableAction"
                    />
                </ClientOnly>
            </div>
        </div>

        <ClientOnly>
            <FollowersFilterDrawer
                :is-open="isFilterDrawerOpen"
                :filters="activeFilters"
                @update:is-open="isFilterDrawerOpen = $event"
                @apply="handleApplyFilters"
                @reset="resetFilters"
            />
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, nextTick, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { useRoute } from 'vue-router'
    import { useLocalePath } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useNetwork } from '~/composables/useNetwork'
    import { useConnections } from '~/composables/useConnections'
    import type { NetworkFilters, ConnectionFilters, ConnectionSortField } from '~/types/network'
    import type { SortDirection } from '~/types/ui/table'

    definePageMeta({
        middleware: ['role'],
        layout: 'app',
    })

    const { t } = useI18n()
    const route = useRoute()
    const localePath = useLocalePath()
    const toast = useToastNotification()

    const {
        followers,
        followersMeta,
        isLoading,
        canLoadMore,
        getFollowersWithFilters,
        transformApiFiltersToConnection,
        triggerRefresh,
    } = useNetwork()

    const { handleFollowAction } = useConnections()

    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)

    const activeFilters = ref<ConnectionFilters>({
        search: '',
        businessTypeIds: [],
        countryIds: [],
        spokenLanguageIds: [],
        dateRange: undefined,
    })

    const totalFollowers = computed(() => followersMeta.value?.total || 0)
    const totalItems = computed(() => followersMeta.value?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref<ConnectionSortField | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isHandlingAction = ref(false)
    const isFetching = ref(false)

    let currentRequestId = 0

    const userRole = computed(() => route.params.user as string)

    const networkFilters = computed<NetworkFilters>(() => {
        const filters: NetworkFilters = {}

        if (activeFilters.value.search?.trim()) {
            filters.search = activeFilters.value.search.trim()
        }

        if (activeFilters.value.businessTypeIds?.length) {
            filters.business_type_ids = activeFilters.value.businessTypeIds
        }

        if (activeFilters.value.countryIds?.length) {
            filters.country_ids = activeFilters.value.countryIds
        }

        if (activeFilters.value.spokenLanguageIds?.length) {
            filters.spoken_language_ids = activeFilters.value.spokenLanguageIds
        }

        if (activeFilters.value.dateRange) {
            filters.start_date = activeFilters.value.dateRange.startDate
            filters.end_date = activeFilters.value.dateRange.endDate
        }

        return filters
    })

    const activeFiltersCount = computed(() => {
        let count = 0

        if (activeFilters.value.businessTypeIds?.length) count++
        if (activeFilters.value.countryIds?.length) count++
        if (activeFilters.value.spokenLanguageIds?.length) count++
        if (activeFilters.value.dateRange) count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || activeFilters.value.search?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath(`/${userRole.value}/dashboard`) },
        { label: t('navigation.network'), to: localePath(`/${userRole.value}/network/overview`) },
        {
            label: t('navigation.followers'),
            to: localePath(`/${userRole.value}/network/followers`),
        },
    ])

    const fetchFollowers = async () => {
        if (isFetching.value) {
            return false
        }

        const requestId = ++currentRequestId

        try {
            isFetching.value = true

            if (requestId !== currentRequestId) {
                return false
            }

            if (currentPage.value > totalPages.value && totalPages.value > 0) {
                currentPage.value = totalPages.value
            }

            const connectionFilters: ConnectionFilters = transformApiFiltersToConnection({
                ...networkFilters.value,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            })

            const success = await getFollowersWithFilters('followed', connectionFilters)

            if (requestId !== currentRequestId) {
                return false
            }

            if (success && followersMeta.value?.total !== undefined) {
                const newTotalPages = Math.ceil(followersMeta.value.total / itemsPerPage.value) || 1
                if (currentPage.value > newTotalPages && newTotalPages > 0) {
                    currentPage.value = newTotalPages
                    return fetchFollowers()
                }
            }

            return success
        } catch (error: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch followers:', error)
            toast.error(error.message || t('network.errors.fetchFollowersFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchFollowers, 300)

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) {
            return
        }

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchFollowers()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) {
            return
        }

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchFollowers()
        })
    }

    const handleSortChange = (
        field: ConnectionSortField | undefined,
        direction: 'asc' | 'desc' | undefined
    ) => {
        if (isFetching.value) {
            return
        }

        if (!field || direction === undefined) {
            sortBy.value = undefined
            sortDirection.value = undefined
        } else {
            sortBy.value = field
            sortDirection.value = direction
        }

        currentPage.value = 1
        nextTick(() => {
            fetchFollowers()
        })
    }

    const handleTableAction = async (action: { type: string; row: any }) => {
        if (isHandlingAction.value) return

        try {
            isHandlingAction.value = true
            const follower = action.row
            const user = follower.user || {}

            switch (action.type) {
                case 'unfollow':
                    if (user.id) {
                        const userName = user.name || t('common.unknown')
                        const success = await handleFollowAction(userName, user.id, true)
                        if (success) {
                            await fetchFollowers()
                        }
                    }
                    break

                case 'profile':
                case 'show-profile':
                    if (user.id) {
                        await navigateTo(localePath(`/profile/${user.username || user.id}`))
                    }
                    break

                case 'message':
                    if (user.id) {
                        const { handleStartChat } = await import('~/composables/socket/useChat')
                        await handleStartChat(user.id, userRole.value)
                    }
                    break

                case 'print':
                    window.print()
                    break

                default:
                    console.warn('Unknown action type:', action.type)
            }
        } catch (error: any) {
            toast.error(error.message || t('network.errors.actionFailed'))
        } finally {
            isHandlingAction.value = false
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: NetworkFilters) => {
        activeFilters.value = {
            search: filters.search || '',
            businessTypeIds: filters.business_type_ids || [],
            countryIds: filters.country_ids || [],
            spokenLanguageIds: filters.spoken_language_ids || [],
            dateRange:
                filters.start_date && filters.end_date
                    ? {
                          startDate: filters.start_date,
                          endDate: filters.end_date,
                      }
                    : undefined,
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        refreshKey.value++
        debouncedFetch()
    }

    const resetFilters = () => {
        activeFilters.value = {
            search: '',
            businessTypeIds: [],
            countryIds: [],
            spokenLanguageIds: [],
            dateRange: undefined,
        }

        currentPage.value = 1
        refreshKey.value++

        if (isFilterDrawerOpen.value) {
            isFilterDrawerOpen.value = false
        }

        debouncedFetch()
    }

    watch(
        () => activeFilters.value,
        () => {
            currentPage.value = 1
            debouncedFetch()
        },
        { deep: true }
    )

    watch(
        () => refreshKey.value || triggerRefresh.value,
        () => {
            fetchFollowers()
        }
    )

    onMounted(() => {
        nextTick(() => {
            fetchFollowers()
        })
    })
</script>

<style scoped>
    .followers-page {
        @apply pb-20;
    }
</style>
