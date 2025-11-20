<template>
    <div class="flex items-center gap-1">
        <!-- <img :src="" :alt="companyData.name" width="16px" height="16px" /> -->
        <Avatar
            size="sm"
            :initials="companyData.code"
            :image-url="companyData.flag_url || companyData.icon"
            class="flex-shrink-0"
        />
        <!-- <NuxtImg :src="companyData.icon" :alt="companyData.name" width="16" height="16" /> -->
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
        icon?: string
        code?: string
    }

    const props = withDefaults(
        defineProps<{
            cellOptions?: object
            cellValue?: CompanyData | string
        }>(),
        {
            cellOptions: () => ({}),
            cellValue: () => ({ name: '', icon: '' }),
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
