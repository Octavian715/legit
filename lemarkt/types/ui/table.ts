export type SortDirection = 'asc' | 'desc' | undefined

export interface TableColumn {
    key: string
    label: string
    width?: string // Add width property (e.g., '150px', '20%', '10rem')
    minWidth?: string // Add minWidth for minimum column width
    maxWidth?: string // Add maxWidth for maximum column width
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
    view?: string
    cellOptions?: any
    className?: string
    editable?: boolean
}

export interface TableRow {
    id: string
    [key: string]: any
}

export interface PaginationConfig {
    currentPage: number
    itemsPerPage: number
    totalItems: number
}

export interface SortState {
    columnKey?: string | null
    direction?: SortDirection
}
