import type { AxiosInstance } from 'axios'

export interface ApiResponse<T = any> {
    data: T
    message?: string
}

export interface ApiError {
    statusCode: number
    statusMessage: string
    data?: any
    errors?: Record<string, string[]> | string[]
}
declare module '#app' {
    interface NuxtApp {
        $axios: AxiosInstance
    }
}

// Add type augmentation for Nuxt
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $axios: AxiosInstance
    }
}
