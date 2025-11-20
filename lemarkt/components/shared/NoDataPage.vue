<template>
    <div
        class="flex flex-col items-center justify-center min-h-[400px] py-16 bg-white rounded-b-sm"
    >
        <img
            v-if="image"
            :src="image || '/images/content/market-no-product.svg'"
            :width="imageWidth"
            :height="imageHeight"
            class="mb-6"
            loading="lazy"
            :alt="title"
        />
        <h3 class="text-title1 font-bold text-gray-950 mb-3 text-center">
            {{ displayTitle }}
        </h3>
        <p class="text-body text-gray-800 text-center max-w-md mb-3">
            {{ displayDescription }}
        </p>
        <Button
            v-if="showButton"
            :label="displayButtonLabel"
            :size="buttonSize"
            :variant="buttonVariant"
            :color="buttonColor"
            @click="emit('action')"
        />
    </div>
</template>

<script lang="ts" setup>
    const { t } = useI18n()

    interface Props {
        title?: string
        description?: string
        image?: string
        imageWidth?: string
        imageHeight?: string
        showButton?: boolean
        buttonLabel?: string
        buttonSize?: 'sm' | 'md' | 'lg'
        buttonVariant?: 'filled' | 'outlined' | 'text'
        buttonColor?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        image: '/images/content/market-no-product.svg',
        imageWidth: '250px',
        imageHeight: '200px',
        showButton: true,
        buttonSize: 'lg',
        buttonVariant: 'filled',
        buttonColor: 'blue',
        title: null,
    })

    const emit = defineEmits(['action'])

    // Computed properties for i18n fallbacks
    const displayTitle = computed(() => (props.title ? props.title : t('filters.noProductsFound')))
    const displayDescription = computed(
        () => props.description || t('filters.errorNoProductsDescription')
    )
    const displayButtonLabel = computed(() => props.buttonLabel || t('filters.clearFilters'))
</script>
