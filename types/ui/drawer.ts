// Define props interface
export interface DrawerType {
    isOpen: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
    title?: string
    subTitle?: string
    cancelText?: string
    okText?: string
    width?: string
    showDefaultFooter?: boolean
    closeOnEscape?: boolean
    closeOnBackdrop?: boolean
}
