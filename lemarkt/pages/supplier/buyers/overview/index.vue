<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <!-- Buyers by Business Type Chart -->
                <BuyersBusinessTypeChart />

                <!-- Buyers by Country Chart -->
                <BuyersCountryChart />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    definePageMeta({
        layout: 'app',
        middleware: ['supplier'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/supplier/dashboard') },
        { label: t('navigation.buyers'), to: localePath('/supplier/buyers') },
        { label: t('navigation.overview'), to: localePath('/supplier/buyers/overview') },
    ])
</script>
