export interface CheckboxType {
    modelValue: boolean
    label?: string
    name?: string
    disabled?: boolean
    wrap?: boolean
    indeterminate?: boolean
    size?: 'sm' | 'md' | 'lg'
    checkedLabelColor?: string
    info?: boolean
    icon?: string
    infoMessage?: string
    hintMessage?: string
}
