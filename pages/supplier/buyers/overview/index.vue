<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <!-- Buyers by Business Type Chart -->
                <BuyersBusinessTypeChart
                    :period="currentPeriod"
                    :date-range="currentDateRange"
                    @period-change="handlePeriodChange"
                />

                <!-- Buyers by Country Chart -->
                <BuyersCountryChart
                    :period="currentPeriod"
                    :date-range="currentDateRange"
                    @period-change="handlePeriodChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { PeriodType, DateRange } from '~/types/chart'

    definePageMeta({
        layout: 'app',
        middleware: ['supplier'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()

    const currentPeriod = ref<PeriodType>('lastMonth')
    const currentDateRange = ref<DateRange | undefined>()

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.buyers'), to: localePath('/supplier/buyers') },
        { label: t('navigation.overview'), to: localePath('/supplier/buyers/overview') },
    ])

    const handlePeriodChange = (period: PeriodType, dateRange?: DateRange) => {
        currentPeriod.value = period
        currentDateRange.value = dateRange
    }
</script>
