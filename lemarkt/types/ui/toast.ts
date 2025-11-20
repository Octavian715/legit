export interface ToastType {
    type: 'success' | 'error' | 'warning' | 'info'
    title?: string
    message: string
    toastId?: string | number | undefined
}
