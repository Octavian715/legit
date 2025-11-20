import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { PageState, PageMeta, ApiError } from '~/types/page'

interface UsePageWrapperOptions {
    meta?: PageMeta
    fetchFn: () => Promise<any>
    dependencies?: (Ref<any> | any)[]
    onSuccess?: (data: any) => void
    onError?: (error: ApiError) => void
    immediate?: boolean
}

export const usePageWrapper = (options: UsePageWrapperOptions) => {
    const { meta = {}, fetchFn, dependencies = [], onSuccess, onError, immediate = true } = options

    const state = ref<PageState>({
        isLoading: immediate, // Set initial loading to true if immediate fetch
        isInitialLoad: true,
        isRefreshing: false,
        error: null,
        lastUpdated: null,
        retryCount: 0,
    })

    const data = ref(null)
    let refreshTimer: NodeJS.Timeout | null = null

    const isIdle = computed(
        () => !state.value.isLoading && !state.value.isRefreshing && !state.value.error
    )

    const canRetry = computed(
        () => state.value.error && state.value.retryCount < (meta.maxRetries || 3)
    )

    const shouldShowSkeleton = computed(
        () =>
            (state.value.isInitialLoad || state.value.isRefreshing) &&
            state.value.isLoading &&
            meta.skeleton !== false
    )

    const shouldShowSpinner = computed(
        () => state.value.isRefreshing || (state.value.isLoading && !state.value.isInitialLoad)
    )

    const executeFetch = async (isRetry = false) => {
        try {
            if (!isRetry) {
                state.value.isLoading = true
                if (!state.value.isInitialLoad) {
                    state.value.isRefreshing = true
                }
                state.value.error = null
            }

            const result = await fetchFn()

            data.value = result
            state.value.lastUpdated = Date.now()
            state.value.isInitialLoad = false
            state.value.retryCount = 0

            if (onSuccess) {
                onSuccess(result)
            }

            if (meta.refreshInterval && meta.refreshInterval > 0) {
                if (refreshTimer) {
                    clearTimeout(refreshTimer)
                }
                refreshTimer = setTimeout(() => refresh(), meta.refreshInterval)
            }
        } catch (error: any) {
            console.error('❌ PageWrapper - Fetch error:', error)

            state.value.error = {
                message: error.message || 'An error occurred',
                code: error.code || 'UNKNOWN_ERROR',
                details: error.details,
            }

            if (onError) {
                onError(state.value.error)
            }

            if (isRetryableError(error) && state.value.retryCount < (meta.maxRetries || 3)) {
                state.value.retryCount++
                const delay = getRetryDelay(state.value.retryCount)

                setTimeout(() => executeFetch(true), delay)
            } else {
                state.value.isInitialLoad = false
            }
        } finally {
            state.value.isLoading = false
            state.value.isRefreshing = false
        }
    }

    const retry = () => {
        if (canRetry.value) {
            state.value.retryCount = 0
            executeFetch()
        }
    }

    const refresh = () => {
        executeFetch()
    }

    const isRetryableError = (error: any): boolean => {
        return [408, 429, 500, 502, 503, 504].includes(error.status)
    }

    const getRetryDelay = (retryCount: number): number => {
        return Math.min(1000 * Math.pow(2, retryCount), 10000) + Math.random() * 1000
    }

    // Fixed dependencies watch - ensure we're watching reactive sources
    if (dependencies.length > 0) {
        const watchSources = dependencies.map((dep) => {
            // If it's already a ref, return it
            if (isRef(dep)) {
                return dep
            }
            // If it's a computed, return it
            if (dep && typeof dep === 'object' && '__v_isReadonly' in dep) {
                return dep
            }
            // If it's a primitive value, create a ref
            return ref(dep)
        })

        watch(
            watchSources,
            (newDeps, oldDeps) => {
                if (
                    !state.value.isInitialLoad &&
                    JSON.stringify(newDeps) !== JSON.stringify(oldDeps)
                ) {
                    refresh()
                }
            },
            { deep: true }
        )
    }

    onMounted(() => {
        if (immediate) {
            executeFetch()
        }
    })

    onUnmounted(() => {
        if (refreshTimer) {
            clearTimeout(refreshTimer)
        }
    })

    return {
        state,
        data,
        isIdle,
        canRetry,
        shouldShowSkeleton,
        shouldShowSpinner,
        fetch: executeFetch,
        retry,
        refresh,
        setData: (newData: any) => {
            data.value = newData
        },
        clearError: () => {
            state.value.error = null
        },
    }
}

// Helper function to check if something is a ref
const isRef = (val: any): val is Ref => {
    return val && val.__v_isRef === true
}
