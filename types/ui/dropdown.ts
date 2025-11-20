export interface DropdownItem {
    label: string
    value: any
    disabled?: boolean
    divider?: boolean
    icon?: string
    description?: string
    meta?: Record<string, any>
}

export interface DropdownProps {
    id?: string
    label?: string
    items?: DropdownItem[]
    modelValue?: boolean
    triggerClass?: string
    menuClass?: string
    rounded?: boolean
    trigger?: 'click' | 'hover' | 'both'
    menuAlignment?: 'left' | 'right' | 'center'
    menuWidth?: 'trigger' | 'max-content' | string
    transition?: string
    closeOnClick?: boolean
    closeOnClickOutside?: boolean
    focusOnShow?: boolean
    disableKeyboard?: boolean
    disableCloseOnEscape?: boolean
    noDefaultStyles?: boolean
    placement?: 'top' | 'bottom' | 'auto'
    autoAlign?: boolean
}

export interface DropdownEmits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'show'): void
    (e: 'hide'): void
    (e: 'after-show'): void
    (e: 'after-hide'): void
    (e: 'select', value: any): void
}

export interface DropdownTriggerSlot {
    isOpen: boolean
    toggle: () => void
    open: () => void
    close: () => void
}
