import { Component } from 'vue'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
export type ModalType = 'add' | 'delete' | 'edit' | 'view' | 'info' | 'success' | null
export interface ModalOptions {
    title?: string
    contentWidth?: string
    cancelText?: string
    okText?: string
    hideFooter?: boolean
    hideHeader?: boolean
    persistent?: boolean
    hideClose?: boolean
    okColor?: string | null
    onClose?: () => void
    onOk?: () => void
    isOpen?: boolean | null | undefined
}

export interface ModalState {
    isOpen: boolean
    type: ModalType
    component: Component | null
    componentProps: Record<string, any>
    options: ModalOptions
}
