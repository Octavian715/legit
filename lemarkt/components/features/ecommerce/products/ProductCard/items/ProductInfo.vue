<template>
    <div class="flex flex-col gap-1 flex-wrap text-subtitle4 text-gray-800">
        <span
            v-if="privateLabel"
            class="flex items-center gap-1 px-2 py-1 bg-gray-200 border border-gray-600 xl:text-nowrap w-fit"
        >
            <svg class="w-3 h-3 flex-shrink-0">
                <use :xlink:href="`/sprite.svg#${getImageType('label')}`"></use>
            </svg>
            {{ t('product.privateLabel') }}
        </span>
    </div>
</template>

<script setup lang="ts">
    import { defineProps } from 'vue'

    const { t } = useI18n()
    // Define props interface
    interface Props {
        features: any
        privateLabel: boolean
    }

    const getImageType = (icon: string): string | string[] | undefined => {
        const iconMap: Record<string, string | string[]> = {
            pickup: 'pickup',
            delivery: 'delivery',
            label: 'label',
        }

        return iconMap[icon]
    }
    // Define props
    const props = defineProps<Props>()
</script>
