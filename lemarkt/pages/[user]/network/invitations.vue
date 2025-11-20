<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="bg-white rounded-sm">
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-gray-950 font-bold text-title2">
                            {{ t('navigation.invitations') }}
                        </h1>
                        <p class="text-gray-800 text-subtitle3 mt-1">
                            {{
                                totalInvitations
                                    ? t('invitations', { n: totalInvitations })
                                    : t('network.invitations.sent')
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
                            :tooltip="t('network.invitations.filters.title')"
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
                    <InvitationsTable
                        :invitations="invitations"
                        :meta="invitationsMeta"
                        :loading="isLoading"
                        :show-pagination="canLoadMore.invitations || totalItems > itemsPerPage"
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
            <InvitationsFilterDrawer
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
    import { useLocalePath } from '#imports'
    import { useDebounceFn } from '@vueuse/core'
    import { useToastNotification } from '~/composables/useToastNotification'
    import { useConnections } from '~/composables/useConnections'
    import { useNetworkStore } from '~/stores/network'
    import { useModalStore } from '~/stores/modal'
    import type { InvitationFilters, InvitationSortField } from '~/types/network'
    import type { SortDirection } from '~/types/ui/table'
    import { useNetwork } from '~/composables/useNetwork'

    definePageMeta({ middleware: ['role'], layout: 'app' })

    const { t } = useI18n()
    const toast = useToastNotification()
    const networkStore = useNetworkStore()
    const modalStore = useModalStore()
    const {
        sendConnectionRequest,
        sendReferralInvitation,
        showCancelReferralInvitationConfirmation,
    } = useConnections()

    const { triggerRefresh } = useNetwork()
    const userRole = computed(() => route.params.user as string)
    const route = useRoute()
    const localePath = useLocalePath()
    const isFilterDrawerOpen = ref(false)
    const refreshKey = ref(0)

    const activeFilters = ref<InvitationFilters>({
        search: '',
        status: [],
        channel: [],
        referred_role: [],
        start_date: '',
        end_date: '',
    })

    const totalInvitations = computed(() => networkStore.invitationsMeta?.total || 0)
    const totalItems = computed(() => networkStore.invitationsMeta?.total || 0)
    const totalPages = computed(() => {
        if (totalItems.value === 0 || itemsPerPage.value === 0) return 1
        return Math.ceil(totalItems.value / itemsPerPage.value)
    })

    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const sortBy = ref<InvitationSortField | undefined>(undefined)
    const sortDirection = ref<SortDirection | undefined>(undefined)
    const isHandlingAction = ref(false)
    const isFetching = ref(false)

    let currentRequestId = 0

    const canLoadMore = computed(() => ({
        invitations: currentPage.value < totalPages.value,
    }))

    const invitations = computed(() => networkStore.invitations)
    const invitationsMeta = computed(() => networkStore.invitationsMeta)
    const isLoading = computed(() => networkStore.isLoading)

    const activeFiltersCount = computed(() => {
        let count = 0

        if (Array.isArray(activeFilters.value.status) && activeFilters.value.status.length > 0)
            count++
        if (Array.isArray(activeFilters.value.channel) && activeFilters.value.channel.length > 0)
            count++
        if (
            Array.isArray(activeFilters.value.referred_role) &&
            activeFilters.value.referred_role.length > 0
        )
            count++
        if (activeFilters.value.start_date && activeFilters.value.end_date) count++

        return count
    })

    const hasActiveFilters = computed(() => {
        return activeFiltersCount.value > 0 || activeFilters.value.search?.trim()?.length > 0
    })

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath(`/${userRole.value}/dashboard`) },
        { label: t('navigation.network'), to: localePath(`/${userRole.value}/network/overview`) },
        {
            label: t('navigation.invitations'),
            to: localePath(`/${userRole.value}/network/invitations`),
        },
    ])

    const transformFiltersForAPI = (filters: InvitationFilters) => {
        const apiFilters: any = { ...filters }

        if (Array.isArray(filters.status) && filters.status.length > 0) {
            apiFilters.status = filters.status
        } else if (typeof filters.status === 'string' && filters.status) {
            apiFilters.status = [filters.status]
        } else {
            delete apiFilters.status
        }

        if (Array.isArray(filters.channel) && filters.channel.length > 0) {
            apiFilters.channel = filters.channel
        } else if (typeof filters.channel === 'string' && filters.channel) {
            apiFilters.channel = [filters.channel]
        } else {
            delete apiFilters.channel
        }

        if (Array.isArray(filters.referred_role) && filters.referred_role.length > 0) {
            apiFilters.referred_role = filters.referred_role
        } else if (typeof filters.referred_role === 'string' && filters.referred_role) {
            apiFilters.referred_role = [filters.referred_role]
        } else {
            delete apiFilters.referred_role
        }

        if (!apiFilters.search?.trim()) {
            delete apiFilters.search
        }

        if (!apiFilters.start_date || !apiFilters.end_date) {
            delete apiFilters.start_date
            delete apiFilters.end_date
        }

        return apiFilters
    }

    const fetchInvitations = async () => {
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

            const apiFilters = transformFiltersForAPI(activeFilters.value)

            const filters: InvitationFilters = {
                ...apiFilters,
                page: currentPage.value,
                per_page: itemsPerPage.value,
                sort_by: sortBy.value,
                sort_direction: sortDirection.value,
            }

            const success = await networkStore.fetchInvitations(filters)

            if (requestId !== currentRequestId) {
                return false
            }

            // if (success && invitationsMeta.value?.total !== undefined) {
            //     const newTotalPages =
            //         Math.ceil(invitationsMeta.value.total / itemsPerPage.value) || 1
            //     if (currentPage.value > newTotalPages && newTotalPages > 0) {
            //         currentPage.value = newTotalPages
            //         return fetchInvitations()
            //     }
            // }

            return !!success
        } catch (error: any) {
            if (requestId !== currentRequestId) {
                return false
            }

            console.error('Failed to fetch invitations:', error)
            toast.error(error.message || t('network.errors.fetchInvitationsFailed'))
            return false
        } finally {
            if (requestId === currentRequestId) {
                isFetching.value = false
            }
        }
    }

    const debouncedFetch = useDebounceFn(fetchInvitations, 300)

    const createNewInvitation = async (invitationData: any): Promise<boolean> => {
        try {
            const invitationPayload = {
                email: invitationData.email,
                companyName: invitationData.company_name || 'Unknown Company',
                phoneNumber: invitationData.phone_number || '',
                comment: `Reinvite for ${invitationData.referred_role}`,
                referredRole: invitationData.referred_role || 'seller',
            }

            const result = await sendReferralInvitation(invitationPayload)

            if (result) {
                toast.success(t('network.invitations.reinvited'))
                await fetchInvitations()
                return true
            }

            return false
        } catch (error: any) {
            toast.error(error.message || t('network.errors.createInvitationFailed'))
            return false
        }
    }

    const handlePageChange = (page: number) => {
        if (currentPage.value === page || isFetching.value) {
            return
        }

        const maxPage = Math.max(1, totalPages.value)
        const validPage = Math.max(1, Math.min(page, maxPage))

        currentPage.value = validPage
        nextTick(() => {
            fetchInvitations()
        })
    }

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        if (itemsPerPage.value === newItemsPerPage || isFetching.value) {
            return
        }

        itemsPerPage.value = newItemsPerPage
        currentPage.value = 1
        nextTick(() => {
            fetchInvitations()
        })
    }

    const handleSortChange = (
        field: InvitationSortField | undefined,
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
            fetchInvitations()
        })
    }

    const handleTableAction = async (action: { type: string; row: any }) => {
        if (isHandlingAction.value) return

        try {
            isHandlingAction.value = true
            const invitation = action.row
            const user = invitation?.registered_user

            switch (action.type) {
                case 'cancel':
                case 'cancel-disconnect':
                    if (invitation.status.toLowerCase() === 'pending') {
                        const success = await showCancelReferralInvitationConfirmation(invitation)

                        if (success) {
                            await fetchInvitations()
                        }
                    } else {
                        toast.warning(t('network.errors.cannotCancelInvitation'))
                    }
                    break

                case 'invite':
                    if (invitation.status === 'expired' || invitation.status === 'cancelled') {
                        await createNewInvitation(invitation)
                    } else if (user?.id) {
                        const success = await sendConnectionRequest(user.id)
                        if (success) {
                            toast.success(t('network.invitations.reinvited'))
                            await fetchInvitations()
                        }
                    } else {
                        toast.error(t('network.errors.cannotReinvite'))
                    }
                    break

                case 'show-profile':
                case 'profile':
                    if (user?.id) {
                        await navigateTo(`/profile/${user.username || user.id}`)
                    } else {
                        toast.warning(t('network.errors.profileNotAvailable'))
                    }
                    break

                default:
                    console.warn('Unknown invitation action type:', action.type)
            }
        } catch (error: any) {
            console.error('Invitation action error:', error)
            toast.error(error.message || t('network.errors.actionFailed'))
        } finally {
            isHandlingAction.value = false
        }
    }

    const openFilters = () => {
        isFilterDrawerOpen.value = true
    }

    const handleApplyFilters = (filters: InvitationFilters) => {
        activeFilters.value = {
            search: filters.search || '',
            status: Array.isArray(filters.status) ? filters.status : [],
            start_date: filters.start_date || '',
            end_date: filters.end_date || '',
        }

        isFilterDrawerOpen.value = false
        currentPage.value = 1
        refreshKey.value++
        debouncedFetch()
    }

    const resetFilters = () => {
        activeFilters.value = {
            search: '',
            status: [],
            start_date: '',
            end_date: '',
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
            fetchInvitations()
        }
    )

    onMounted(() => {
        nextTick(() => {
            fetchInvitations()
        })
    })
</script>
