<template>
    <div class="dashboard-skeleton space-y-6">
        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ChartSkeleton v-for="i in 4" :key="`chart-${i}`" />
        </div>

        <!-- Products Table -->
        <TableSkeleton :rows="10" :columns="8" />

        <!-- Buyers/Suppliers Table (conditional) -->
        <TableSkeleton v-if="showSecondTable" :rows="5" :columns="6" />
    </div>
</template>

<script setup lang="ts">
    interface Props {
        showSecondTable?: boolean
    }

    withDefaults(defineProps<Props>(), {
        showSecondTable: true,
    })
</script>
