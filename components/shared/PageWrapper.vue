<template>
    <div class="page-wrapper">
        <!-- Loading Skeleton -->
        <div v-if="shouldShowSkeleton" class="page-skeleton" :class="skeletonClass">
            <slot name="skeleton" />
        </div>

        <!-- Error State -->
        <div v-else-if="state.error && !state.isRefreshing" class="page-error" :class="errorClass">
            <slot name="error" :error="state.error" />
        </div>

        <!-- Empty State - when data exists but is empty -->
        <div
            v-else-if="!state.isInitialLoad && !state.isLoading && isEmptyData"
            class="page-empty"
            :class="emptyClass"
        >
            <slot name="empty" />
        </div>

        <!-- Main Content -->
        <div
            v-else-if="data && !state.isInitialLoad && !isEmptyData"
            class="page-content"
            :class="{ 'is-refreshing': state.isRefreshing }"
        >
            <!-- Refresh Indicator -->
            <Transition name="fade">
                <div v-if="shouldShowSpinner" class="refresh-indicator" :class="spinnerClass">
                    <slot name="spinner">
                        <div
                            class="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-lg"
                        >
                            <div
                                class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"
                            ></div>
                            <span class="text-sm text-gray-600">{{ t('refreshing') }}</span>
                        </div>
                    </slot>
                </div>
            </Transition>

            <!-- Content Slot -->
            <slot :data="data" />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useI18n } from 'vue-i18n'
    import type { PageMeta } from '~/types/page'
    import type { Ref } from 'vue'

    interface Props {
        meta?: PageMeta
        fetchFn: () => Promise<any>
        dependencies?: (Ref<any> | any)[]
        skeletonType?: 'list' | 'grid' | 'detail' | 'dashboard'
        skeletonClass?: string
        errorClass?: string
        spinnerClass?: string
        emptyClass?: string
        immediate?: boolean
        emptyCheck?: (data: any) => boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        immediate: true,
        skeletonType: 'list',
        meta: () => ({}),
        dependencies: () => [],
        emptyCheck: (data: any) =>
            !data || (typeof data === 'object' && Object.keys(data).length === 0),
    })

    const emit = defineEmits<{
        success: [data: any]
        error: [error: any]
        stateChange: [state: any]
    }>()

    const { t } = useI18n()

    const isEmptyData = computed(() => {
        if (!data.value) return false
        return props.emptyCheck(data.value)
    })

    const { state, data, shouldShowSkeleton, shouldShowSpinner, canRetry, retry, refresh, fetch } =
        usePageWrapper({
            meta: props.meta,
            fetchFn: props.fetchFn,
            dependencies: props.dependencies,
            immediate: props.immediate,
            onSuccess: (data) => emit('success', data),
            onError: (error) => emit('error', error),
        })

    watch(
        state,
        (newState) => {
            emit('stateChange', newState)
        },
        { deep: true }
    )

    defineExpose({
        refresh,
        retry,
        fetch,
        state,
        data,
    })
</script>

<style scoped>
    .page-wrapper {
        @apply relative;
    }

    .page-skeleton {
        @apply animate-pulse;
    }

    .page-content {
        @apply relative;
        transition: opacity 0.3s ease;
    }

    .page-content.is-refreshing {
        @apply opacity-90;
    }

    .refresh-indicator {
        @apply absolute top-4 right-4 z-10;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
