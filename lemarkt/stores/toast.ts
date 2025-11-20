import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNuxtApp } from '#app'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default'

interface Toast {
    id: number
    title: string
    message: string
    type: ToastType
    duration?: number
}

export const useToastStore = defineStore('toast', () => {
    const toasts = ref<Toast[]>([])
    const counter = ref(0)
    const timeouts = new Map<number, NodeJS.Timeout>()
    const { $toast } = useNuxtApp()
    const show = (
        title: string,
        message: string,
        type: ToastType = 'info',
        duration: number = 5000
    ) => {
        const toastId = ++counter.value
        toasts.value.push({ id: toastId, title, message, type, duration })

        $toast[type](message, {
            timeout: duration,
            title: title,
        })

        if (duration > 0) {
            const timeout = setTimeout(() => dismiss(toastId), duration)
            timeouts.set(toastId, timeout)
        }
    }

    const dismiss = (id: number) => {
        const timeout = timeouts.get(id)
        if (timeout) {
            clearTimeout(timeout)
            timeouts.delete(id)
        }
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    const clear = () => {
        timeouts.forEach((timeout) => clearTimeout(timeout))
        timeouts.clear()
        toasts.value = []
    }

    return { toasts, show, dismiss, clear }
})
