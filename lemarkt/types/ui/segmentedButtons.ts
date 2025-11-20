// types/ui/segmentedButtons.ts

export interface SegmentButtonOption {
    label: string
    value: string
    active?: boolean
}

export interface SegmentButtonOptionType {
    options: SegmentButtonOption[]
    defaultActive?: string
    disabled?: boolean
    borderRadius?:
        | 'rounded'
        | 'rounded-md'
        | 'rounded-lg'
        | 'rounded-xl'
        | 'rounded-2xl'
        | 'rounded-full'
        | 'rounded-none'
    size?: 'sm' | 'md' | 'lg'
    ariaLabel?: string
}

export type SegmentButtonEmits = {
    change: [value: string]
}
