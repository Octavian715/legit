<template>
    <div class="invitations-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="true"
            :pagination-config="paginationConfig"
            :actions="allActions"
            :fixed-layout="true"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            background="bg-white"
            test="invitations-table"
            @actions="handleTableAction"
            @show-profile="handleViewProfile"
            @cancel-disconnect="handleCancelRequestAction"
            @invite="handleInviteRequestAction"
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
    import { useDate } from '~/composables/useDate'
    import type { TableColumn, TableRow, SortState } from '~/types/ui/table'
    import type { NetworkInvitation, InvitationSortField } from '~/types/network'

    interface Props {
        invitations?: NetworkInvitation[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: InvitationSortField
        sortDirection?: 'asc' | 'desc' | undefined
    }

    const props = withDefaults(defineProps<Props>(), {
        invitations: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 20,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
    })

    const emit = defineEmits<{
        'page-change': [page: number]
        'items-per-page-change': [itemsPerPage: number]
        'sort-change': [
            field: InvitationSortField | undefined,
            direction: 'asc' | 'desc' | undefined,
        ]
        action: [action: { type: string; row: any }]
        'update:current-page': [page: number]
        'update:items-per-page': [itemsPerPage: number]
    }>()

    const { t } = useI18n()
    const { formatDate } = useDate()

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

    const allActions = []

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

    const tableColumns = computed<TableColumn[]>(() => [
        {
            key: 'company_name',
            label: t('table.companyName'),
            sortable: true,
            view: 'TableCellText',
            width: '200px',
            align: 'left',
        },
        {
            key: 'email',
            label: t('table.email'),
            sortable: true,
            view: 'TableCellText',
            width: '250px',
            align: 'left',
        },
        {
            key: 'phone_number',
            label: t('table.phoneNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '150px',
            align: 'left',
        },
        {
            key: 'sent_at',
            label: t('table.dateSent'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'expires_at',
            label: t('table.expires'),
            sortable: true,
            view: 'TableCellText',
            width: '120px',
            align: 'left',
        },
        {
            key: 'status',
            label: t('table.status'),
            sortable: true,
            view: 'TableCellStatus',
            width: '100px',
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

    const getStatusColor = (status: string) => {
        const currentStatus = status.toLowerCase()
        switch (currentStatus) {
            case 'pending':
                return 'warning'
            case 'accepted':
                return 'success'
            case 'expired':
                return 'error'
            case 'cancelled':
                return 'gray'
            default:
                return 'gray'
        }
    }

    const tableRows = computed<TableRow[]>(() => {
        const invitations = props.invitations || []

        if (!Array.isArray(invitations) || invitations.length === 0) {
            return []
        }

        return invitations.map((invitation, index) => {
            return {
                id: invitation.id?.toString() || `invitation-${index}`,
                row: [
                    invitation.company_name || t('common.unknown'),
                    invitation.email || t('common.notSpecified'),
                    invitation.phone_number || t('common.notSpecified'),
                    formatDate(invitation.sent_at, 'dd.MM.yyyy'),
                    formatDate(invitation.expires_at, 'dd.MM.yyyy'),
                    {
                        label: invitation.status,
                        color: getStatusColor(invitation.status),
                        status: invitation.status,
                    },
                    { customAction: invitation.status.toLowerCase() },
                ],
                originalData: invitation,
                index: index,
            }
        })
    })

    const paginationConfig = computed(() => ({
        currentPage: internalCurrentPage.value,
        itemsPerPage: internalItemsPerPage.value,
        totalItems: props.meta?.total || 0,
    }))

    const handleTableAction = (payload: { type: string; row: TableRow }) => {
        emit('action', {
            type: payload.type,
            row: payload.row.originalData,
        })
    }

    const handleViewProfile = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'profile',
            row: payload.row.originalData,
        })
    }

    const handleCancelRequestAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'cancel',
            row: payload.row.originalData,
        })
    }

    const handleInviteRequestAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'invite',
            row: payload.row.originalData,
        })
    }

    const handlePageChange = (page: number) => {
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        internalItemsPerPage.value = itemsPerPage
        internalCurrentPage.value = 1
        emit('items-per-page-change', itemsPerPage)
        emit('update:items-per-page', itemsPerPage)
        emit('update:current-page', 1)
    }

    const handlePageChanged = (page: number) => {
        internalCurrentPage.value = page
        emit('page-change', page)
        emit('update:current-page', page)
    }

    const handleItemsPerPageChanged = (itemsPerPage: number) => {
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

        const sortableFields: Record<string, InvitationSortField> = {
            company_name: 'company_name',
            email: 'email',
            phone_number: 'phone_number',
            sent_at: 'created_at',
            expires_at: 'expires_at',
            status: 'status',
        }

        const sortField = sortableFields[sortState.columnKey || '']
        if (sortField) {
            emit('sort-change', sortField, sortState.direction)
        }
    }
</script>
