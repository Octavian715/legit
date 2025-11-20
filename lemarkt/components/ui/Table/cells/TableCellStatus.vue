<template>
    <div class="flex items-center justify-center">
        <span
            class="inline-flex items-center px-1 py-0.5 rounded text-subtitle3"
            :class="statusClasses"
        >
            {{ statusLabel }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface StatusData {
        label: string
        color: 'success' | 'warning' | 'error' | 'gray' | string
        status: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: StatusData | string
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: () => ({ label: '', color: 'gray', status: '' }),
        }
    )

    const statusData = computed((): StatusData => {
        let value = props.cellValue

        if (typeof value === 'string') {
            return { label: value, color: 'gray', status: value }
        }

        if (typeof value === 'object' && value !== null) {
            return value as StatusData
        }

        return { label: '', color: 'gray', status: '' }
    })

    const statusLabel = computed(() => {
        return statusData.value.label || statusData.value.status || '-'
    })

    const statusClasses = computed(() => {
        const color = statusData.value.color

        const colorClasses = {
            success: 'bg-green-50 text-green-600',
            warning: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-50 text-red-500',
            gray: 'bg-gray-500 text-gray-800',
            blue: 'bg-blue-100 text-blue-800',
            purple: 'bg-purple-100 text-purple-800',
            pink: 'bg-pink-100 text-pink-800',
            orange: 'bg-orange-100 text-orange-800',
        }

        return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
    })
</script>
