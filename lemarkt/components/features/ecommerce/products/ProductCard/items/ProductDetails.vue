<template>
    <div class="space-y-2 sm:space-y-1" :class="containerClasses">
        <div
            v-for="field in productFields"
            :key="field.key"
            class="grid grid-cols-[100px_1fr] gap-1"
        >
            <span class="text-subtitle4 text-gray-800 max-w-24 break-words">
                {{ field.label }}:
            </span>

            <!-- Link field -->
            <Link
                v-if="field.type === 'link'"
                v-tooltip="`${t('openCategory', { category: field.value })}`"
                size="sm"
                class="w-fit"
                :container-class="field.bold ? 'font-semibold' : ''"
                :to="field.routePath"
            >
                {{ field.value }}
            </Link>

            <!-- Storage conditions with icons -->
            <ul
                v-else-if="field.type === 'icon'"
                class="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4"
            >
                <li class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-blue-500 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#${getImageType(field.value.code)}`"></use>
                    </svg>
                    <p class="text-subtitle4 text-gray-950">
                        {{ field.value.name }}
                    </p>
                </li>
                <li class="flex items-center gap-1">
                    <svg class="w-3 h-3 text-blue-500 flex-shrink-0">
                        <use :xlink:href="`/sprite.svg#${getImageType('temp')}`"></use>
                    </svg>
                    <p class="text-subtitle4 text-gray-950">
                        {{ field.value.temperature }}
                    </p>
                </li>
            </ul>

            <!-- List field (comma separated) -->
            <p v-else-if="field.type === 'list'" class="text-subtitle4 text-gray-950">
                {{ Array.isArray(field.value) ? field.value.join(', ') : field.value }}
            </p>

            <!-- Badge list for keywords/features -->
            <div v-else-if="field.type === 'badge-list'" class="flex flex-wrap gap-1">
                <span
                    v-for="item in field.value"
                    :key="item"
                    class="inline-flex items-center px-2 py-1 rounded-md text-subtitle4 font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                    {{ item }}
                </span>
            </div>

            <!-- Regular text field -->
            <p
                v-else
                class="text-subtitle4 text-gray-950 capitalize"
                :class="{ 'font-bold': field.bold, [field.class || '']: field.class }"
            >
                {{ field.value }}
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { useI18n } from 'vue-i18n'
    import { useLocalePath } from '#imports'
    import Link from '~/components/ui/Link.vue'
    import type { ProductListing, StorageCondition } from '~/types/products'

    interface Props {
        mode?: 'compact' | 'extended'
        trademark?: string
        productSlug?: string | number
        translationLanguages?: ProductListing['names']
        labelTranslationLanguages?: ProductListing['ingredients']
        originalTitle?: string
        englishTitle?: string
        category: ProductListing['category']
        articleNumber: number | string
        width: ProductListing['weight']
        storage: StorageCondition
        product?: ProductListing
        containerClasses?: string
    }

    const props = withDefaults(defineProps<Props>(), {
        mode: 'compact',
    })

    const { t } = useI18n()
    const localePath = useLocalePath()

    const temperatureLabel = computed(() => {
        const min = props.storage?.temperature_min
        const max = props.storage?.temperature_max

        const hasMin = min !== null && min !== undefined && !isNaN(Number(min))
        const hasMax = max !== null && max !== undefined && !isNaN(Number(max))

        if (hasMin && hasMax) {
            return `${min}/${max} °C`
        }

        if (hasMin) {
            return `${t('product.minTemperature')}: ${min} °C`
        }

        if (hasMax) {
            return `${t('product.maxTemperature')}: ${max} °C`
        }

        return '—'
    })

    const productUnitLabel = computed(() => {
        if (!props?.width) return '—'
        return `${props.width?.name} (${props.width?.symbol})`
    })

    const getLanguageNames = (translations: ProductListing['names']) => {
        if (!translations || !Array.isArray(translations)) return '—'
        return translations.map((t) => t.language.native_name).join(', ')
    }

    const getIngredientLanguages = (ingredients: ProductListing['ingredients']) => {
        if (!ingredients || !Array.isArray(ingredients)) return '—'
        return ingredients.map((i) => i.language.native_name).join(', ')
    }
    const getAllergens = (allergens: ProductListing['allergens']) => {
        if (!allergens || !Array.isArray(allergens)) return '—'
        return allergens.map((i) => i.name).join(', ')
    }

    interface ProductField {
        key: string
        label: string
        value: string | { code: string; name: string; temperature: string } | any
        bold?: boolean
        type: string
        routePath?: string
    }

    const productFields = computed(() => {
        const items: ProductField[] = [
            {
                key: 'trademark',
                label: t('product.trademark'),
                value: props.trademark,
                bold: true,
                type: 'text',
            },
            {
                key: 'originalTitle',
                label: t('product.originalTitle'),
                value: props.originalTitle,
                bold: true,
                routePath: localePath(
                    `/marketplace/product/${encodeURIComponent(props.productSlug || '')}`
                ),
                type: props.mode === 'extended' ? 'text' : 'link',
            },
        ]

        if (props.mode === 'extended' && props.product) {
            const extendedFields = [
                {
                    key: 'englishTitle',
                    label: t('languages.english'),
                    value: props.englishTitle || '—',
                    bold: true,
                    type: 'text',
                },
                {
                    key: 'titleTranslations',
                    label: t('product.titleTranslations'),
                    value: getLanguageNames(props.translationLanguages),
                    type: 'text',
                },
                {
                    key: 'ingredientLanguages',
                    label: t('product.labelTranslations'),
                    value: getIngredientLanguages(props.labelTranslationLanguages),
                    type: 'text',
                },
            ]

            items.push(...extendedFields)
        }

        items.push({
            key: 'category',
            label: t('category', 1),
            value: props.category?.name || '—',
            routePath: localePath(
                `/marketplace/category/${encodeURIComponent(props.category?.slug || '')}`
            ),
            type: 'link',
        })

        if (props.mode === 'extended' && props.product) {
            const extendedFields = [
                {
                    key: 'countryOrigin',
                    label: t('product.countryOfOrigin'),
                    value: props.product.country_origin?.name || '—',
                    type: 'text',
                },
            ]

            items.push(...extendedFields)
        }

        const baseItems = [
            {
                key: 'articleNumber',
                label: t('product.articleNumber', { n: 1 }),
                value: props.articleNumber || '—',
                type: 'text',
            },
            {
                key: 'unit',
                label: t('unit', { n: 1 }),
                value: productUnitLabel.value,
                type: 'text',
            },
        ]

        items.push(...baseItems)

        if (props.mode === 'compact') {
            items.push({
                key: 'conditions',
                label: t('conditions'),
                value: {
                    code: props.storage?.name?.toLowerCase() || 'ambient',
                    name: props.storage?.name || '—',
                    temperature: temperatureLabel.value,
                },
                type: 'icon',
            })
        }

        if (props.mode === 'extended' && props.product) {
            const extendedFields = [
                {
                    key: 'productId',
                    label: t('product.productId', 0),
                    value: props.product.id || '—',
                    type: 'text',
                },
                {
                    key: 'bbd',
                    label: t('product.bbd'),
                    value: props.product.shelf_life_days ? props.product.shelf_life_days : '—',
                    type: 'text',
                },
                {
                    key: 'conditions',
                    label: t('conditions'),
                    value: {
                        code: props.storage?.name?.toLowerCase() || 'ambient',
                        name: props.storage?.name || '—',
                        temperature: temperatureLabel.value,
                    },
                    type: 'icon',
                },
                {
                    key: 'ingredients',
                    label: t('product.ingredients'),
                    value: props.labelTranslationLanguages[0]?.content || '—',
                    type: 'text',
                },
                // {
                //     key: 'businessTypes',
                //     label: t('product.businessTypes'),
                //     value: getBusinessTypeNames(props.product.business_types),
                //     type: 'list',
                // },
                // {
                //     key: 'incoterms',
                //     label: t('product.incoterms'),
                //     value: getIncotermCodes(props.product.incoterms),
                //     type: 'list',
                // },
            ]

            // Add allergens if available
            if (props.product.allergens.length > 0) {
                extendedFields.push({
                    key: 'allergens',
                    label: t('allergens', { n: 0 }),
                    value: getAllergens(props.product.allergens),
                })
            }

            items.push(...extendedFields)
        }

        return items.filter(
            (item) => item.value !== '—' && item.value !== '' && item.value !== null
        )
    })

    const getImageType = (icon: string): string => {
        const iconMap: Record<string, string> = {
            temp: 'termometer',
            ambient: 'ambient',
            frozen: 'snowflake',
            controlled: 'controlled',
            chilled: 'chilled',
            dry: 'dry',
        }

        return iconMap[icon] || iconMap.ambient
    }
</script>
