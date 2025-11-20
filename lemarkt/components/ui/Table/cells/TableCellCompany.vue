<template>
    <div class="flex items-center min-w-0">
        <!-- Company Name Only -->
        <span class="text-body text-gray-950 truncate" :title="companyData.name">
            {{ companyData.name }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'

    interface CompanyData {
        id?: string | number
        name: string
        email?: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: CompanyData | string
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: () => ({ name: '' }),
        }
    )

    const companyData = computed((): CompanyData => {
        let value = props.cellValue

        if (typeof value === 'string') {
            return { name: value }
        }

        if (typeof value === 'object' && value !== null) {
            return value as CompanyData
        }

        return { name: '' }
    })
</script>
