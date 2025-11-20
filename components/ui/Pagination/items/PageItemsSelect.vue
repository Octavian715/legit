<template>
    <div class="page__items">
        <label :for="dropdownId" class="page__items-label">
            {{ t('showResults', 'Show results') }}
        </label>
        <Dropdown
            :id="dropdownId"
            :label="currentOptionLabel"
            :items="dropdownItems"
            trigger="click"
            menu-alignment="right"
            menu-width="120px"
            class="page__items-dropdown"
            :aria-label="t('itemsPerPageAriaLabel', 'Select items per page')"
            @select="handleSelect"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, computed } from 'vue'
    import type { PropType } from 'vue'
    import Dropdown from '~/components/ui/Dropdown.vue'
    import type { DropdownItem } from '~/types/ui/dropdown'

    interface PageOption {
        label: string
        value: number
    }

    const props = defineProps({
        itemsPerPage: {
            type: Number,
            required: true,
            validator: (value: number) => value > 0,
        },
        name: {
            type: String,
            default: 'page-items',
        },
        pageOptions: {
            type: Array as PropType<PageOption[]>,
            default: () => [
                { label: '5', value: 5 },
                { label: '10', value: 10 },
                { label: '20', value: 20 },
                { label: '30', value: 30 },
                { label: '50', value: 50 },
                { label: '100', value: 100 },
            ],
        },
    })

    const { t } = useI18n()

    const emit = defineEmits<{
        (e: 'update:itemsPerPage', value: number): void
    }>()

    const dropdownId = computed(() => `${props.name}-dropdown`)

    const localItemsPerPage = ref(props.itemsPerPage)

    const dropdownItems = computed((): DropdownItem[] => {
        return props.pageOptions.map((option) => ({
            label: option.label,
            value: option.value,
            disabled: false,
        }))
    })

    const currentOptionLabel = computed(() => {
        const currentOption = props.pageOptions.find(
            (option) => option.value === localItemsPerPage.value
        )
        return currentOption?.label || props.pageOptions[0]?.label || '10'
    })

    watch(
        () => props.itemsPerPage,
        (newVal) => {
            if (newVal !== localItemsPerPage.value) {
                localItemsPerPage.value = newVal
            }
        }
    )

    const handleSelect = (value: any) => {
        const numValue = typeof value === 'number' ? value : parseInt(value, 10)
        if (!isNaN(numValue) && isValidPageOption(numValue)) {
            localItemsPerPage.value = numValue
            emit('update:itemsPerPage', numValue)
        }
    }

    const isValidPageOption = (value: number) => {
        return props.pageOptions.some((option) => option.value === value)
    }

    if (!isValidPageOption(localItemsPerPage.value)) {
        localItemsPerPage.value = props.pageOptions[0]?.value || 10
    }
</script>

<style scoped lang="scss">
    .page__items {
        @apply flex items-center gap-3;

        &-label {
            @apply text-body text-gray-700 whitespace-nowrap;
        }

        &-dropdown {
            @apply min-w-[80px];

            :deep(.dropdown-trigger) {
                @apply text-body;
            }
        }
    }

    @media (max-width: 640px) {
        .page__items {
            @apply gap-2;

            &-label {
                @apply text-subtitle3;
            }
        }
    }
</style>
