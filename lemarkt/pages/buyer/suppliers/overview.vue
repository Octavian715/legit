<template>
    <div class="flex flex-col gap-3">
        <Breadcrumbs :items="breadcrumbs" />

        <div class="">
            <div class="charts-grid grid grid-cols-1 gap-3">
                <!-- Suppliers by Business Type Chart -->
                <SuppliersBusinessTypeChart />

                <!-- Suppliers by Country Chart -->
                <SuppliersCountryChart />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    definePageMeta({
        layout: 'app',
        middleware: ['buyer'],
    })

    const { t } = useI18n()
    const localePath = useLocalePath()

    const breadcrumbs = computed(() => [
        { label: t('home'), to: localePath('/buyer/dashboard') },
        { label: t('navigation.suppliers'), to: localePath('/buyer/suppliers') },
        { label: t('navigation.overview'), to: localePath('/buyer/suppliers/overview') },
    ])
</script>
