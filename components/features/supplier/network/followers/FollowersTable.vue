<template>
    <div class="followers-table-wrapper">
        <Table
            :columns="tableColumns"
            :rows="tableRows"
            :loading="loading"
            :pagination="true"
            :pagination-config="paginationConfig"
            :actions="tableActions"
            :show-column-borders="false"
            :fixed-layout="true"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            background="bg-white"
            test="followers-table"
            @show="handleViewProfile"
            @edit="handleSendMessage"
            @delete="handleUnfollowAction"
            @show-profile="handleViewProfile"
            @unfollow="handleUnfollowAction"
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
    import type { NetworkFollower, ConnectionSortField } from '~/types/network'

    interface Props {
        followers?: NetworkFollower[]
        meta?: any
        currentPage?: number
        itemsPerPage?: number
        loading?: boolean
        showPagination?: boolean
        sortBy?: ConnectionSortField
        sortDirection?: 'asc' | 'desc' | undefined
    }

    const props = withDefaults(defineProps<Props>(), {
        followers: () => [],
        meta: () => ({}),
        currentPage: 1,
        itemsPerPage: 10,
        loading: false,
        showPagination: true,
        sortBy: undefined,
        sortDirection: undefined,
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

    const internalCurrentPage = ref(props.currentPage)
    const internalItemsPerPage = ref(props.itemsPerPage)

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

    const tableActions = computed(() => ['show-profile', 'unfollow'])

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
            key: 'email',
            label: t('table.email'),
            sortable: true,
            view: 'TableCellText',
            width: '250px',
            align: 'left',
        },
        // {
        //     key: 'contacts',
        //     label: t('table.contactPerson'),
        //     sortable: false,
        //     view: 'TableCellText',
        //     width: '150px',
        //     align: 'center',
        // },
        {
            key: 'phone',
            label: t('table.phoneNumber'),
            sortable: true,
            view: 'TableCellText',
            width: '150px',
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
        const followers = props.followers || []

        if (!Array.isArray(followers) || followers.length === 0) {
            return []
        }

        return followers.map((follower, index) => {
            const user = follower.user || {}
            const contact = Array.isArray(user.contacts) ? user.contacts[0] : null
            const phoneNumbers = contact?.phones?.length
                ? contact?.phones[0]?.phone_number
                : t('table.notSpecified')

            return {
                id: follower.id?.toString() || `follower-${index}`,
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
                    user.email,
                    // contact?.name || t('table.notSpecified'),
                    phoneNumbers, // Add phones to the row data if needed
                    user.spoken_languages || [],
                ],
                originalData: follower,
                index: index,
            }
        })
    })

    const paginationConfig = computed(() => ({
        currentPage: internalCurrentPage.value,
        itemsPerPage: internalItemsPerPage.value,
        totalItems: props.meta?.total || 0,
    }))

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

        const sortableFields: Record<string, ConnectionSortField> = {
            company_name: 'name',
            country: 'country',
            business_type: 'business_type',
            registration_year: 'registration_year',
            phone: 'phone',
            email: 'email',
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

    const handleUnfollowAction = (payload: { row: TableRow }) => {
        emit('action', {
            type: 'unfollow',
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
