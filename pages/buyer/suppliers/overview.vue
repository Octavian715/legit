<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div v-if="error && !isRetrying" class="bg-white rounded-sm shadow p-8 text-center">
            <div class="mx-auto w-16 h-16 text-red-500 mb-4">
                <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 class="text-title1 font-bold text-gray-950 mb-2">
                {{ t('dashboardUser.errors.generic') }}
            </h3>
            <p class="text-subtitle1 text-gray-700 mb-6">{{ error.message }}</p>
            <Button color="red" variant="filled" @click="handleRetry">
                {{ t('dashboardUser.messages.tryAgain') }}
            </Button>
        </div>

        <div v-else class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <div v-if="!hasLoadedOnce" class="space-y-3">
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>

                <template v-else>
                    <SuppliersBusinessTypeChart
                        :period="currentPeriod"
                        :date-range="currentDateRange"
                        @period-change="handlePeriodChange"
                    />

                    <SuppliersCountryChart
                        :period="currentPeriod"
                        :date-range="currentDateRange"
                        @period-change="handlePeriodChange"
                    />
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { PeriodType, DateRange } from '~/types/chart'

    definePageMeta({
        layout: 'app',
        middleware: ['buyer'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()

    const currentPeriod = ref<PeriodType>('lastMonth')
    const currentDateRange = ref<DateRange | undefined>()
    const error = ref<Error | null>(null)
    const isRetrying = ref(false)
    const hasLoadedOnce = ref(false)

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/buyer/dashboard') },
        { label: t('navigation.suppliers'), to: localePath('/buyer/suppliers') },
        { label: t('navigation.overview'), to: localePath('/buyer/suppliers/overview') },
    ])

    const handlePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        currentPeriod.value = period
        currentDateRange.value = dateRange
    }

    const handleRetry = async () => {
        isRetrying.value = true
        error.value = null
        hasLoadedOnce.value = false

        try {
            await nextTick()
            hasLoadedOnce.value = true
        } catch (err: any) {
            error.value = err
        } finally {
            isRetrying.value = false
        }
    }

    onMounted(() => {
        setTimeout(() => {
            hasLoadedOnce.value = true
        }, 100)
    })
</script>
