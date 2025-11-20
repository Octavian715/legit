import type { ToastType } from '~/types/ui/toast'
import Toast from '~/components/ui/Toast.vue'

interface ToastOptions {
    title?: string
    timeout?: number
    closeOnClick?: boolean
    pauseOnHover?: boolean
    hideProgressBar?: boolean
    position?:
        | 'top-right'
        | 'top-center'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-center'
        | 'bottom-left'
    [key: string]: any
}

export const useToastNotification = () => {
    const { $toast } = useNuxtApp()

    const getDefaultTimeout = (type: ToastType['type']): number => {
        switch (type) {
            case 'success':
                return 3000
            case 'error':
                return 5000
            case 'warning':
                return 4000
            case 'info':
                return 3000
            default:
                return 3000
        }
    }

    const showToast = (
        type: ToastType['type'],
        message: string,
        title?: string,
        options: ToastOptions = {}
    ) => {
        const timeout = options.timeout || getDefaultTimeout(type)

        const toastId = $toast(
            {
                component: Toast,
                props: {
                    title: title || '',
                    type,
                    message,
                    toastId: undefined,
                },
                listeners: {
                    close: () => $toast.dismiss(toastId),
                },
            },
            {
                timeout,
                closeOnClick: options.closeOnClick !== undefined ? options.closeOnClick : true,
                pauseOnHover: options.pauseOnHover !== undefined ? options.pauseOnHover : true,
                hideProgressBar:
                    options.hideProgressBar !== undefined ? options.hideProgressBar : true,
                position: options.position || 'top-right',
                ...options,
            }
        )

        setTimeout(() => {
            const toastElement = document.querySelector(
                `.vue-toastification__toast[data-toastid="${toastId}"]`
            )
            if (toastElement) {
                const vueComponent = (toastElement as any).__vue__
                if (vueComponent && vueComponent.props) {
                    vueComponent.props.toastId = toastId
                }
            }
        }, 50)

        return toastId
    }

    const success = (message: string, title = 'Success', options: ToastOptions = {}) => {
        return showToast('success', message, title, options)
    }

    const error = (message: string, title = 'Error', options: ToastOptions = {}) => {
        return showToast('error', message, title, options)
    }

    const warning = (message: string, title = 'Warning', options: ToastOptions = {}) => {
        return showToast('warning', message, title, options)
    }

    const info = (message: string, title = 'Info', options: ToastOptions = {}) => {
        return showToast('info', message, title, options)
    }

    const dismiss = (toastId?: string | number) => {
        if (toastId !== undefined) {
            $toast.dismiss(toastId)
        }
    }

    const clear = () => {
        $toast.clear()
    }

    const update = (
        toastId: string | number,
        options: {
            type?: ToastType['type']
            message?: string
            title?: string
        }
    ) => {
        const toastElement = document.querySelector(
            `.vue-toastification__toast[data-toastid="${toastId}"]`
        )

        if (toastElement) {
            const vueComponent = (toastElement as any).__vue__
            if (vueComponent && vueComponent.props) {
                if (options.type) vueComponent.props.type = options.type
                if (options.message) vueComponent.props.message = options.message
                if (options.title) vueComponent.props.title = options.title
            }
        }
    }

    return {
        success,
        error,
        warning,
        info,
        showToast,
        dismiss,
        clear,
        update,
    }
}
