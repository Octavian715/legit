import type { TableColumn, TableRow } from '~/types/ui/table'

export const useTableEvents = (
    props: {
        enableCellEvents?: boolean
    },
    emit: (event: string, ...args: any[]) => void
) => {
    const handleCellEvent = (
        event: 'cell-clicked' | 'cell-hover' | 'cell-leave',
        payload: { row: TableRow; column: TableColumn }
    ) => {
        if (props.enableCellEvents || event === 'cell-clicked') {
            emit(event, payload)
        }
    }

    const handleRowAction = (payload: { type: string; row: Record<string, any> }) => {
        // Map action types to kebab-case events that match Table component's defineEmits
        const eventMap: Record<string, string> = {
            edit: 'edit',
            delete: 'delete',
            show: 'show',
            download: 'download',
            print: 'print',
            'show-profile': 'show-profile',
            disconnect: 'disconnect',
            connect: 'connect',
            accept: 'accept',
            follow: 'follow',
            unfollow: 'unfollow',
            'cancel-disconnect': 'cancel-disconnect',
            invite: 'invite',
            'product-status': 'product-status',
            'product-prices': 'product-prices',
            'product-features': 'product-features',
            'view-pdf': 'view-pdf',
        }

        const eventName = eventMap[payload.type]

        if (eventName) {
            // For known events, emit with standardized payload structure
            emit(eventName, { row: payload.row })
        } else {
            // For unknown action types, emit generic 'row-action' event
            emit('row-action', { type: payload.type, row: payload.row })
        }
    }

    const handleAddItem = () => {
        emit('add-item')
    }

    const handleTabChange = (value: string | number) => {
        emit('change-tab', value)
    }

    return {
        handleCellEvent,
        handleRowAction,
        handleAddItem,
        handleTabChange,
    }
}
