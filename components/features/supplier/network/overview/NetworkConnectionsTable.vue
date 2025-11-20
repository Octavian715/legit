<template>
    <div class="connections-table-wrapper p-4">
        <div class="flex flex-col space-y-4">
            <!-- Table Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-gray-950 font-bold text-title3">
                        {{ t('network.requests.title') }}
                    </h3>
                    <p class="text-gray-600 text-subtitle3 mt-1">
                        {{ t('network.requests.subtitle') }}
                    </p>
                </div>
            </div>

            <!-- Table Section -->
            <div class="flex flex-col gap-4">
                <Table
                    :columns="tableColumns"
                    :rows="tableRows"
                    :loading="isLoading"
                    :pagination="showPagination"
                    :pagination-config="paginationConfig"
                    :actions="tableActions"
                    :show-column-borders="false"
                    extended-row
                    :fixed-layout="true"
                    background="bg-white"
                    test="network-connections-table"
                    @edit="handleSendMessage"
                    @delete="handleDeleteConnection"
                    @update:current-page="handlePageChange"
                >
                    <template #row-expansion="{ item }">
                        <div class="flex items-center justify-end gap-2 px-4 py-2 bg-gray-50">
                            <!-- Profile Button -->
                            <Button
                                variant="filled"
                                color="blue"
                                size="sm"
                                icon="user"
                                @click="handleViewProfile(item)"
                            >
                                <svg class="w-4 h-4 mr-1">
                                    <use xlink:href="/sprite.svg#user"></use>
                                </svg>
                                {{ t('network.actions.profile', 'Profile') }}
                            </Button>

                            <!-- Write Message Button -->
                            <Button
                                variant="filled"
                                color="blue"
                                size="sm"
                                @click="handleSendMessage(item)"
                            >
                                <svg class="w-4 h-4 mr-1">
                                    <use xlink:href="/sprite.svg#message"></use>
                                </svg>
                                {{ t('network.actions.writeMessage', 'Write a message') }}
                            </Button>

                            <!-- Phone Button -->
                            <Button
                                variant="filled"
                                color="blue"
                                size="sm"
                                @click="handleCallUser(item)"
                            >
                                <svg class="w-4 h-4 mr-1">
                                    <use xlink:href="/sprite.svg#calling"></use>
                                </svg>
                                {{ getPhoneNumber(item) }}
                            </Button>

                            <!-- Accept/Decline for requests -->
                            <template v-if="selectedType === 'requests'">
                                <Button
                                    v-tooltip="t('table.actions.confirm')"
                                    size="sm"
                                    font-weight="normal"
                                    color="blue"
                                    variant="outline"
                                    container-classes="!border-blue-50 !bg-blue-50"
                                    @click="handleAcceptConnection(item)"
                                >
                                    <svg class="w-4 h-4">
                                        <use xlink:href="/sprite.svg#check"></use>
                                    </svg>
                                </Button>
                                <Button
                                    v-tooltip="t('table.actions.reject')"
                                    size="sm"
                                    font-weight="normal"
                                    color="red"
                                    variant="outline"
                                    container-classes="!border-red-50 !bg-red-50"
                                    @click="handleDeclineConnection(item)"
                                >
                                    <svg class="w-4 h-4">
                                        <use xlink:href="/sprite.svg#close"></use>
                                    </svg>
                                </Button>
                            </template>
                        </div>
                    </template>

                    <!-- <template #table-footer>
                        <div
                            v-if="showTableFooter"
                            class="flex py-3 justify-center border-t border-gray-200"
                        >
                            <Button
                                :label="t('network.actions.viewAllConnections')"
                                size="md"
                                color="blue"
                                variant="filled"
                                @click="handleViewAllConnections"
                            />
                        </div>
                    </template> -->
                </Table>

                <!-- Error Message -->
                <div v-if="errorMessage" class="mt-2">
                    <p class="text-caption1 text-red-500 flex items-center gap-2" role="alert">
                        <svg class="w-4 h-4 flex-shrink-0">
                            <use xlink:href="/sprite.svg#alert-circle"></use>
                        </svg>
                        {{ errorMessage }}
                    </p>
                </div>

                <!-- Statistics Summary -->
                <div
                    v-if="showStatistics && connectionStats"
                    class="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
                >
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">
                            {{ connectionStats.total }}
                        </div>
                        <div class="text-sm text-gray-600">{{ t('network.stats.total') }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">
                            {{ connectionStats.accepted }}
                        </div>
                        <div class="text-sm text-gray-600">{{ t('network.stats.accepted') }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600">
                            {{ connectionStats.pending }}
                        </div>
                        <div class="text-sm text-gray-600">{{ t('network.stats.pending') }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">
                            {{ connectionStats.declined }}
                        </div>
                        <div class="text-sm text-gray-600">{{ t('network.stats.declined') }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { TableColumn, TableRow } from '~/types/ui/table'
    import type { ConnectionType, NetworkConnection } from '~/types/network'

    interface ConnectionStats {
        total: number
        accepted: number
        pending: number
        declined: number
    }

    interface Props {
        connections: NetworkConnection[]
        meta: any
        selectedType: ConnectionType
        currentPage: number
        loading?: boolean
        showPagination?: boolean
        showStatistics?: boolean
        showRefreshButton?: boolean
        showTableFooter?: boolean
        showEmptyStateAction?: boolean
        connectionStats?: ConnectionStats
        errorMessage?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        loading: false,
        showPagination: true,
        showStatistics: false,
        showRefreshButton: true,
        showTableFooter: true,
        showEmptyStateAction: true,
        connectionStats: undefined,
        errorMessage: '',
    })

    const emit = defineEmits<{
        typeChange: [type: ConnectionType]
        pageChange: [page: number]
        action: [action: { type: string; row: any }]
        refresh: []
        viewAll: []
        emptyStateAction: []
    }>()

    const { t } = useI18n()

    const isLoading = computed(() => props.loading)
    const isRefreshing = ref(false)

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_id',
            label: t('network.profile.companyId'),
            sortable: false,
            view: 'TableCellText',
            width: '80px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('network.profile.companyName'),
            sortable: true,
            view: 'TableCellCompany',
            width: '250px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('network.profile.country'),
            sortable: true,
            view: 'TableCellCountry',
            width: '150px',
            align: 'left',
        },
        {
            key: 'business_type',
            label: t('network.profile.businessType'),
            sortable: true,
            view: 'TableCellBusinessType',
            width: '120px',
            align: 'left',
        },
        {
            key: 'registration_year',
            label: t('network.profile.registrationYear'),
            sortable: true,
            view: 'TableCellText',
            width: '110px',
            align: 'center',
        },
        {
            key: 'annual_revenue',
            label: t('network.profile.annualRevenue'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'mutual_connections',
            label: t('network.profile.mutualConnections'),
            sortable: true,
            view: 'TableCellText',
            width: '90px',
            align: 'center',
        },
        {
            key: 'spoken_languages',
            label: t('network.profile.spokenLanguages'),
            sortable: false,
            view: 'TableCellLanguages',
            width: '180px',
            align: 'left',
        },
        {
            key: 'total_amount',
            label: t('table.totalAmount'),
            sortable: true,
            view: 'TableCellText',
            cellOptions: { classes: 'font-bold' },
            width: '130px',
            align: 'right',
        },
    ])

    const tableActions = computed(() => {
        const actions = ['show']

        switch (props.selectedType) {
            case 'requests':
                actions.push('edit')
                actions.push('delete')
                break
            case 'accepted':
                actions.push('edit')
                break
            case 'declined':
                actions.push('edit')
                break
            case 'outgoing':
                actions.push('delete')
                break
        }

        return actions
    })
    const createTableRows = (connections: NetworkConnection[]): TableRow[] => {
        if (!connections || !Array.isArray(connections) || connections.length === 0) {
            return []
        }

        return connections.map((connection, index) => {
            const user = connection?.user || {}

            // Prepare data for each column
            const companyData = {
                id: user.id || '',
                name: user.name || '-',
                email: user.email || '',
            }

            const rowData = [
                companyData.id, // company_id
                companyData, // company_name
                {
                    name: user.country?.name || t('table.unknown'),
                    icon: user.country?.flag_url || null,
                }, // country

                user.business_type
                    ? {
                          // business_type
                          id: user.business_type.id,
                          name: user.business_type.name,
                      }
                    : '-',
                user.registration_year?.toString() || '-', // registration_year
                user.annual_revenue?.name || '-', // annual_revenue
                (user.mutual_connections || 0).toString(), // mutual_connections
                Array.isArray(user.spoken_languages) // spoken_languages
                    ? user.spoken_languages.map((lang: any) => ({
                          id: lang.id,
                          code: lang.code,
                          name: lang.name,
                      }))
                    : [],
                '0.00',
            ]

            return {
                id: connection.id?.toString() || `connection-${index}`,
                row: rowData,
                originalData: connection,
                index: index,
            }
        })
    }
    const tableRows = computed<TableRow[]>(() => {
        const connectionsCopy = [...(props.connections || [])]
        return createTableRows(connectionsCopy)
    })

    const paginationConfig = computed(() => ({
        currentPage: props.currentPage,
        itemsPerPage: props.meta?.per_page || 100,
        totalItems: props.meta?.total || 0,
    }))

    const handleRefresh = async () => {
        isRefreshing.value = true
        try {
            emit('refresh')
        } finally {
            setTimeout(() => {
                isRefreshing.value = false
            }, 1000)
        }
    }

    const handlePageChange = (page: number) => {
        emit('pageChange', page)
    }

    const handleViewProfile = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'show',
            row: payload,
        })
    }

    const handleSendMessage = (payload: { row: TableRow }) => {
        const connectionData = payload.originalData.user

        emit('action', {
            type: 'message',
            row: connectionData,
        })
    }

    const handleDeleteConnection = (payload: { row: TableRow }) => {
        const connectionData = payload.row.originalData?.connection as NetworkConnection
        const actionType =
            props.selectedType === 'requests'
                ? 'decline'
                : props.selectedType === 'outgoing'
                  ? 'cancel'
                  : 'remove'

        emit('action', {
            type: actionType,
            row: connectionData,
        })
    }

    const handleCallUser = (item: any) => {
        const connection = item.originalData
        const phone = connection?.user?.contacts?.[0]?.phones?.[0]?.phone_number
        if (phone) {
            window.location.href = `tel:${phone}`
        }
    }

    const handleAcceptConnection = (item: any) => {
        const connection = item.originalData
        emit('action', {
            type: 'accept',
            row: connection,
        })
    }

    const handleDeclineConnection = (item: any) => {
        const connection = item.originalData
        emit('action', {
            type: 'decline',
            row: connection,
        })
    }

    // const handleViewAllConnections = () => {
    //     emit('viewAll')
    // }

    const getPhoneNumber = (item: any) => {
        const connection = item.originalData
        const phone = connection?.user?.contacts?.[0]?.phones?.[0]?.phone_number
        return phone ? `${phone}` : t('network.noPhone', 'No phone')
    }
    // const handleEmptyStateAction = () => {
    //     emit('emptyStateAction')
    // }

    watch(
        () => props.loading,
        (newValue) => {
            if (!newValue) {
                isRefreshing.value = false
            }
        }
    )
</script>

<style scoped>
    .connections-table-wrapper {
        @apply bg-white rounded-lg shadow;
    }

    @media (max-width: 768px) {
        .connections-table-wrapper {
            @apply shadow-sm;
        }
    }
</style>
