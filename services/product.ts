// services/product.ts

import type {
    ProductStep1Payload,
    ProductStatusResponse,
    ProductStaticData,
    ProductDirectEditPayload,
    ProductDirectEditResponse,
    ProductImportResponse,
} from '~/types/product'
import { TokenService } from './token'
import axios from 'axios'

interface ApiErrorResponse {
    statusCode: number
    message?: string
    data?: {
        message?: string
        errors?: Record<string, string | string[]>
    }
}

const extractErrorDetails = (error: any): ApiErrorResponse => {
    const statusCode = error.response?.status || error.statusCode || 500
    const data = error.response?.data || error.data || {}

    return {
        statusCode,
        message: data.message || error.message || 'An error occurred',
        data: {
            message: data.message,
            errors: data.errors || {},
        },
    }
}

export class ProductService {
    private readonly baseURL: string

    constructor() {
        const config = useRuntimeConfig()
        this.baseURL = config.public.apiBaseURL
    }

    private async apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
        try {
            const isFormData = options.body instanceof FormData

            const headers: Record<string, string> = {
                ...TokenService.getRequestHeaders(),
            }

            if (!isFormData && options.method !== 'GET') {
                headers['Content-Type'] = 'application/json'
            }

            if (options.headers) {
                Object.keys(options.headers).forEach((key) => {
                    if (isFormData && key.toLowerCase() === 'content-type') {
                        return
                    }
                    headers[key] = options.headers[key]
                })
            }

            const response = await $fetch<T>(endpoint, {
                baseURL: this.baseURL,
                headers,
                ...options,
            })

            return response
        } catch (error: any) {
            const errorDetails = extractErrorDetails(error)

            if (errorDetails.statusCode === 401 || errorDetails.statusCode === 403) {
                TokenService.clearAllTokens()
            }

            throw errorDetails
        }
    }

    async fetchProductStatus(id: number): Promise<ProductStatusResponse> {
        // Request full product with all relations including prices
        const response = await this.apiFetch<any>(`/backoffice/products/${id}`, {
            method: 'GET',
        })

        if (response.id) {
            return {
                product: response,
                current_step: response.current_step || 8,
                next_step: response.next_step || 8,
                is_complete: response.is_complete !== undefined ? response.is_complete : true,
            } as ProductStatusResponse
        }

        throw new Error('Invalid product response structure')
    }

    async createProduct(payload: ProductStep1Payload): Promise<ProductStatusResponse> {
        return await this.apiFetch<ProductStatusResponse>('/products/steps/1', {
            method: 'POST',
            body: payload,
        })
    }

    async updateProductStep(id: number, step: number, data: any): Promise<ProductStatusResponse> {
        const isFormData = data instanceof FormData

        if (isFormData) {
            data.append('_method', 'PATCH')

            const headers: Record<string, string> = {
                ...TokenService.getRequestHeaders(),
            }

            try {
                const response = await axios({
                    method: 'POST',
                    url: `${this.baseURL}/products/${id}/steps/${step}`,
                    data: data,
                    headers: headers,
                    transformRequest: [(data) => data],
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                })

                return response.data
            } catch (error: any) {
                const errorDetails = extractErrorDetails(error)
                throw errorDetails
            }
        }

        // Clean payload: remove empty arrays, null, undefined
        const cleanedData = cleanPayload(data)

        return await this.apiFetch<ProductStatusResponse>(`/products/${id}/steps/${step}`, {
            method: 'PATCH',
            body: cleanedData,
        })
    }

    async directEditProduct(
        id: number,
        payload: ProductDirectEditPayload
    ): Promise<ProductDirectEditResponse> {
        if (!payload || Object.keys(payload).length === 0) {
            throw {
                statusCode: 400,
                message: 'product.validation.emptyPayload',
                data: { errors: {} },
            }
        }

        try {
            const response = await this.apiFetch<ProductDirectEditPayload>(
                `/products/${id}/direct-edit`,
                {
                    method: 'PATCH',
                    body: payload,
                }
            )
            return response.data || response
        } catch (error: any) {
            throw extractErrorDetails(error)
        }
    }

    async downloadProductPDF(id: number, brendName: string, originalTitle: string): Promise<Blob> {
        const response = await this.apiFetch<any>(`/products/${id}/pdf`, {
            method: 'GET',
            headers: {
                ...TokenService.getRequestHeaders(),
                Accept: 'application/pdf',
            },
        })

        const blob = new Blob([response], { type: 'application/pdf' })

        if (process.client) {
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${brendName}-${originalTitle}-${id}.pdf`
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)
        }

        return blob
    }

    async fetchStaticData(): Promise<ProductStaticData> {
        try {
            const response = await this.apiFetch<ProductStaticData>(
                '/general/static-data/product',
                {
                    method: 'GET',
                }
            )
            return response.data || response
        } catch (error: any) {
            throw extractErrorDetails(error)
        }
    }

    async getAISuggestions(id: number): Promise<any[]> {
        return await this.apiFetch<any[]>(`/products/${id}/generate-keywords`, {
            method: 'POST',
        })
    }

    async downloadTemplate(): Promise<Blob> {
        try {
            const response = await this.apiFetch<Blob>('/products/template/download', {
                method: 'GET',
                responseType: 'blob',
            })

            return response
        } catch (error: any) {
            throw extractErrorDetails(error)
        }
    }

    async importProducts(formData: FormData): Promise<ProductImportResponse> {
        const headers: Record<string, string> = {
            ...TokenService.getRequestHeaders(),
        }

        try {
            const response = await axios({
                method: 'POST',
                url: `${this.baseURL}/products/template/import`,
                data: formData,
                headers: headers,
                transformRequest: [(data) => data],
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            })

            return response.data
        } catch (error: any) {
            const errorDetails = extractErrorDetails(error)
            throw errorDetails
        }
    }

    async deleteProduct(id: number | string): Promise<{ success: boolean }> {
        const headers: Record<string, string> = {
            ...TokenService.getRequestHeaders(),
        }

        try {
            const response = await axios({
                method: 'DELETE',
                url: `${this.baseURL}/products/${id}`,
                headers: headers,
            })

            return response.data
        } catch (error: any) {
            const errorDetails = extractErrorDetails(error)
            throw errorDetails
        }
    }
}
