<template>
    <div class="connections-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="showPagination"
            :pagination-config="paginationConfig"
            :actions="tableActions"
            :show-column-borders="false"
            :fixed-layout="true"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            background="bg-white"
            test="connections-table"
            @show="handleViewProfile"
            @edit="handleSendMessage"
            @delete="handleActionButton"
            @show-profile="handleViewProfile"
            @accept="handleAcceptConnectionAction"
            @decline="handleDeclineConnectionAction"
            @cancel="handleCancelConnectionAction"
            @disconnect="handleDisconnectAction"
            @cancel-disconnect="handleCancelDisconnectAction"
            @print="handlePrintAction"
            @sort="handleSort"
            @update:current-page="handlePageChange"
            @update:items-per-page="handleItemsPerPageChange"
            @page-changed="handlePageChanged"
            @items-per-page-changed="handleItemsPerPageChanged"
        />
    </div>
</template>

<script setup lang="ts">
    import { computed, watch } from 'vue'
    import { useI18n } from 'vue-i18n'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { NetworkConnection, ConnectionSortField } from '~/types/network'
    import { useLocalePath } from '#imports'

    interface Props {
        connections?: NetworkConnection[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: ConnectionSortField
        sortDirection?: 'asc' | 'desc' | undefined
        showProfile?: boolean
        showAccept?: boolean
        showDisconnect?: boolean
        showCancel?: boolean
        showCancelDisconnect?: boolean
        showDecline?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        connections: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 5,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
        showProfile: true,
        showDisconnect: false,
        showAccept: false,
        showCancel: false,
        showCancelDisconnect: false,
        showDecline: false,
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [
            field: ConnectionSortField | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        action: [action: { type: string; row: any }]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
    }>()

    const { t } = useI18n()

    // Internal pagination state for proper reactivity
    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

    // Watch for prop changes and sync internal state
    watch(
        () => props.currentPage,
        (newPage) => {
            if (newPage !== internalCurrentPage.value) {
                internalCurrentPage.value = newPage
            }
        },
        { immediate: true }
    )

    watch(
        () => props.itemsPerPage,
        (newItemsPerPage) => {
            if (newItemsPerPage !== internalItemsPerPage.value) {
                internalItemsPerPage.value = newItemsPerPage
            }
        },
        { immediate: true }
    )

    const tableActions = computed(() => {
        const baseActions = ['show-profile']

        if (props.showAccept) {
            baseActions.push('accept')
        }

        if (props.showDecline) {
            baseActions.push('decline')
        }

        if (props.showCancel) {
            baseActions.push('cancel')
        }

        if (props.showDisconnect) {
            baseActions.push('disconnect')
        }

        if (props.showCancelDisconnect) {
            baseActions.push('cancel-disconnect')
        }

        return baseActions
    })

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_id',
            label: t('table.companyId'),
            sortable: false,
            view: 'TableCellText',
            width: '80px',
            align: 'left',
        },
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: true,
            view: 'TableCellCompany',
            width: '250px',
            align: 'left',
        },
        {
            key: 'country',
            label: t('table.country'),
            sortable: true,
            view: 'TableCellCountry',
            width: '150px',
            align: 'left',
        },
        {
            key: 'business_type',
            label: t('table.businessType'),
            sortable: true,
            view: 'TableCellBusinessType',
            width: '120px',
            align: 'left',
        },
        {
            key: 'registration_year',
            label: t('table.registrationYear'),
            sortable: true,
            view: 'TableCellText',
            width: '110px',
            align: 'center',
        },
        {
            key: 'annual_revenue',
            label: t('table.annualRevenue'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'mutual_connections',
            label: t('table.mutualConnections'),
            sortable: true,
            view: 'TableCellText',
            width: '110px',
            align: 'center',
        },
        {
            key: 'spoken_languages',
            label: t('table.spokenLanguages'),
            sortable: false,
            view: 'TableCellLanguages',
            width: '180px',
            align: 'left',
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            view: 'TableCellActions',
            width: '120px',
            align: 'right',
        },
    ])

    const tableRows = computed<TableRow[]>(() => {
        const connections = props.connections || []

        if (!Array.isArray(connections) || connections.length === 0) {
            return []
        }

        return connections.map((connection, index) => {
            const user = connection.user || {}

            return {
                id: connection.id?.toString() || `connection-${index}`,
                row: [
                    user.id?.toString() || '',
                    {
                        id: user.id,
                        name: user.name || t('table.unknown'),
                        email: user.email || '',
                        username: user.userName || '',
                    },
                    {
                        name: user.country?.name || t('table.unknown'),
                        icon: user.country?.flag_url || null,
                    },
                    user.business_type?.name || t('table.unknown'),
                    user.registration_year?.toString() || t('table.notSpecified'),
                    user.annual_revenue?.name || t('table.notSpecified'),
                    (connection.mutual_connections || 0).toString(),
                    user.spoken_languages || [],
                ],
                originalData: connection,
                index: index,
            }
        })
    })

    const paginationConfig = computed(() => ({
        currentPage: internalCurrentPage.value,
        itemsPerPage: internalItemsPerPage.value,
        totalItems: props.meta?.total || 0,
    }))

    // Primary pagination handlers (maintain backward compatibility)
    const handlePageChange = (page: number) => {
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        internalItemsPerPage.value = itemsPerPage
        // Reset to first page when changing items per page
        internalCurrentPage.value = 1
        emit('items-per-page-change', itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
        emit('update:current-page', 1)
    }

    // Additional event handlers for the fixed pagination system
    const handlePageChanged = (page: number) => {
        // This is called by the Table component's enhanced pagination
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChanged = (itemsPerPage: number) => {
        // This is called by the Table component's enhanced pagination
        internalItemsPerPage.value = itemsPerPage
        internalCurrentPage.value = 1
        emit('items-per-page-change', itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
        emit('update:current-page', 1)
    }

    const handleSort = (sortState: SortState) => {
        if (sortState.direction === undefined) {
            emit('sort-change', undefined, undefined)
            return
        }

        const sortableFields: Record<string, ConnectionSortField> = {
            company_name: 'name',
            country: 'country',
            business_type: 'business_type',
            registration_year: 'registration_year',
            annual_revenue: 'annual_revenue',
            mutual_connections: 'mutual_connections',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }

    const handleViewProfile = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'profile',
            row: payload.row.originalData,
        })
    }

    const handleSendMessage = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'message',
            row: payload.row.originalData,
        })
    }

    const handleActionButton = (payload: { row: TableRow }) => {
        let actionType: string

        if (props.showDisconnect) {
            actionType = 'disconnect'
        } else if (props.showCancelDisconnect) {
            actionType = 'cancel-disconnect'
        } else {
            actionType = 'disconnect'
        }

        emit('action', {
            type: actionType,
            row: payload.row.originalData,
        })
    }

    const handleDisconnectAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'disconnect',
            row: payload.row.originalData,
        })
    }

    const handleAcceptConnectionAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'accept',
            row: payload.row.originalData,
        })
    }

    const handleCancelDisconnectAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'cancel-disconnect',
            row: payload.row.originalData,
        })
    }

    const handleCancelConnectionAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'cancel',
            row: payload.row.originalData,
        })
    }

    const handleDeclineConnectionAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'decline',
            row: payload.row.originalData,
        })
    }

    const handlePrintAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'print',
            row: payload.row.originalData,
        })
    }
</script>
