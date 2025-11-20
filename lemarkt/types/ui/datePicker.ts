export interface DateRange {
    start: string
    end: string
}

export interface TabOption {
    label: string
    value: string
}

export interface DatePickerProps {
    modelValue?: string | DateRange
    isRangeMode?: boolean
    dateFormat?: string
    label?: string
    size?: 'sm' | 'md' | 'lg'
    placeholder?: string
    required?: boolean
    compact?: boolean
    minDate?: string | Date
    futureRanges?: boolean
    disabled?: boolean
    error?: boolean
    errorMessage?: string
}

// export interface ToastNotification {
//     success: (message: string) => void
//     error: (message: string) => void
//     warning: (message: string) => void
//     info: (message: string) => void
// }
