<template>
    <div class="flex items-center gap-2">
        <span class="text-body text-gray-950 truncate" :title="displayText">
            {{ displayText }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface BusinessTypeOption {
        id: string | number
        name: string
        category?: string
        icon?: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: {
                showIcon?: boolean
                showBadge?: boolean
                businessTypes?: BusinessTypeOption[]
            }
            cellValue?: string | number | BusinessTypeOption
        }>(),
        {
            cellOptions: () => ({
                showIcon: true,
                showBadge: false,
                businessTypes: [],
            }),
            cellValue: '',
        }
    )

    const businessType = computed(() => {
        let value = props.cellValue

        if (typeof value === 'object' && value !== null) {
            return value as BusinessTypeOption
        }

        // Try to find in options if cellValue is string/number
        if (props.cellOptions?.businessTypes?.length) {
            return props.cellOptions.businessTypes.find(
                (type) => type.id === value || type.name === value
            )
        }

        return null
    })

    const displayText = computed(() => {
        if (businessType.value) {
            return businessType.value.name
        }

        if (typeof props.cellValue === 'string' && props.cellValue) {
            return props.cellValue
        }

        return '-'
    })

    const businessTypeIcon = computed(() => {
        if (!props.cellOptions?.showIcon) return null

        if (businessType.value?.icon) {
            return businessType.value.icon
        }

        // Default icons based on common business types
        const iconMap: Record<string, string> = {
            supplier: 'factory',
            manufacturer: 'factory',
            distributor: 'truck',
            retailer: 'store',
            restaurant: 'restaurant',
            hotel: 'hotel',
            catering: 'catering',
            wholesale: 'warehouse',
            import: 'import',
            export: 'export',
        }

        const typeKey = displayText.value.toLowerCase()
        return Object.keys(iconMap).find((key) => typeKey.includes(key))
            ? iconMap[Object.keys(iconMap).find((key) => typeKey.includes(key))!]
            : 'business'
    })

    const businessTypeCategory = computed(() => {
        return businessType.value?.category
    })

    const showBadge = computed(() => {
        return props.cellOptions?.showBadge && businessTypeCategory.value
    })

    const categoryColor = computed(() => {
        if (!businessTypeCategory.value) return 'gray'

        const colorMap: Record<string, string> = {
            food_service: 'blue',
            retail: 'green',
            manufacturing: 'purple',
            distribution: 'orange',
            hospitality: 'pink',
            agriculture: 'emerald',
        }

        return colorMap[businessTypeCategory.value.toLowerCase()] || 'gray'
    })
</script>
