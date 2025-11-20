<!-- components/ui/table/cells/TableCellCertificateDate.vue -->
<template>
    <div class="flex items-center space-x-2">
        <!-- Date Display -->
        <span v-tooltip="tooltipText" class="whitespace-nowrap" :class="dateClasses">
            {{ formattedValue }}
        </span>

        <!-- Status Indicator -->
        <div v-if="statusIndicator" class="flex-shrink-0">
            <div
                v-tooltip="statusTooltip"
                class="w-2 h-2 rounded-full"
                :class="statusClasses"
            ></div>
        </div>

        <!-- Warning Icon for expiring certificates -->
        <svg
            v-if="isExpiringSoon && !isExpired"
            v-tooltip="$t('certificates.expiringSoon', 'Certificate expiring soon')"
            class="w-4 h-4 text-yellow-500 flex-shrink-0"
        >
            <use xlink:href="/sprite.svg#warn"></use>
        </svg>

        <!-- Error Icon for expired certificates -->
        <svg
            v-if="isExpired"
            v-tooltip="$t('certificates.expired', 'Certificate expired')"
            class="w-4 h-4 text-red-500 flex-shrink-0"
        >
            <use xlink:href="/sprite.svg#warn-error"></use>
        </svg>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useDate } from '~/composables/useDate'
    import { useI18n } from 'vue-i18n'

    const props = withDefaults(
        defineProps<{
            cellOptions?: {
                dateType?: 'issue' | 'expiry'
                showStatus?: boolean
                showRelative?: boolean
            }
            cellValue?: string | number | Date | null
        }>(),
        {
            cellOptions: () => ({
                dateType: 'expiry',
                showStatus: true,
                showRelative: true,
            }),
            cellValue: null,
        }
    )

    const { t } = useI18n()
    const {
        formatDate,
        isCertificateExpired,
        isCertificateExpiringSoon,
        getRelativeTime,
        isValidDate,
    } = useDate()

    const formattedValue = computed(() => {
        if (!props.cellValue) return '-'

        try {
            return formatDate(props.cellValue, 'dd.MM.yyyy')
        } catch (e) {
            console.warn('Invalid date value:', props.cellValue)
            return '-'
        }
    })

    const isExpired = computed(() => {
        if (!props.cellValue || props.cellOptions?.dateType !== 'expiry') return false

        try {
            return isCertificateExpired(props.cellValue)
        } catch (e) {
            return false
        }
    })

    const isExpiringSoon = computed(() => {
        if (!props.cellValue || props.cellOptions?.dateType !== 'expiry') return false

        try {
            return isCertificateExpiringSoon(props.cellValue, 30)
        } catch (e) {
            return false
        }
    })

    const dateClasses = computed(() => {
        const baseClasses = 'text-gray-950'

        if (props.cellOptions?.dateType !== 'expiry') {
            return baseClasses
        }

        if (isExpired.value) {
            return `${baseClasses} text-red-600 font-medium`
        }

        if (isExpiringSoon.value) {
            return `${baseClasses} text-yellow-600 font-medium`
        }

        return `${baseClasses} text-green-600`
    })

    const statusIndicator = computed(() => {
        return props.cellOptions?.showStatus && props.cellOptions?.dateType === 'expiry'
    })

    const statusClasses = computed(() => {
        if (isExpired.value) {
            return 'bg-red-500'
        }

        if (isExpiringSoon.value) {
            return 'bg-yellow-500'
        }

        return 'bg-green-500'
    })

    const statusTooltip = computed(() => {
        if (isExpired.value) {
            return t('certificates.expired', 'Certificate expired')
        }

        if (isExpiringSoon.value) {
            return t('certificates.expiringSoon', 'Certificate expiring soon')
        }

        return t('certificates.valid', 'Certificate valid')
    })

    const tooltipText = computed(() => {
        if (!props.cellValue || !props.cellOptions?.showRelative) {
            return formattedValue.value
        }

        try {
            const relative = getRelativeTime(props.cellValue)
            return `${formattedValue.value} (${relative})`
        } catch (e) {
            return formattedValue.value
        }
    })
</script>
