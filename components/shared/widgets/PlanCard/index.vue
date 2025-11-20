<template>
    <div
        class="flex-1 border rounded-sm px-4 pt-8 pb-6 flex flex-col relative bg-white animate-scale-up-center"
        :class="{
            'border-red-500 shadow-[0_0_0_1px_#f56565]':
                plan.highlighted && !isSelected && !isCurrent,
            'border-blue-500 shadow-[0_0_0_1px_#3182ce]':
                (plan.highlighted && isSelected) || isCurrent,
            'border-blue-500 shadow-[0_0_0_2px_#3182ce]': isSelected && !isCurrent,
            'border-gray-600': !plan.highlighted && !isSelected && !isCurrent,
        }"
    >
        <!-- Discount Badge - TOP RIGHT -->
        <div
            v-if="plan.discountPercentage && plan.discountPercentage > 0"
            class="absolute -top-5 -right-5 z-10 text-white animate-scale-up-center"
        >
            <svg class="w-16 h-16 text-red-500">
                <use xlink:href="/sprite.svg#badge" />
            </svg>
            <span class="absolute top-6 right-3 text-subtitle2 font-bold leading-none"
                >-{{ plan.discountPercentage }}%</span
            >
        </div>

        <!-- Plan Label (Recommended/FREE) -->
        <div
            v-if="plan.label"
            class="absolute top-0 left-1/2 transform -translate-x-1/2 px-3 py-1.5 text-caption1 text-white first-line:font-semibold uppercase rounded-b"
            :class="[isSelected ? 'bg-blue-500' : 'bg-red-500']"
        >
            {{ plan.label }}
        </div>

        <!-- Plan Header -->
        <div class="mb-6 flex flex-col gap-1 justify-center items-center">
            <h3
                class="text-subtitle1 font-bold text-gray-950 flex items-center justify-center gap-1"
            >
                <svg class="w-5 h-5 text-red-500">
                    <use xlink:href="/sprite.svg#logo_sm" />
                </svg>

                {{ plan.title }}
            </h3>

            <!-- Old Price with Clear Label -->

            <!-- Current Price -->
            <div v-if="plan.monthlyPrice === 0">
                <span class="text-h3 font-bold align-middle">{{ t('free') }}</span>
            </div>
            <div v-else class="flex items-center">
                <span class="text-h3 font-bold align-middle">{{ plan.currency }}</span>
                <span class="text-h3 font-bold align-middle">{{
                    formatPrice(plan.monthlyPrice)
                }}</span>

                <div
                    v-if="plan.oldPrice && plan.oldPrice > 0"
                    class="text-title3 line-through font-bold text-gray-800 flex items-center gap-1"
                >
                    {{ plan.currency }}{{ formatPrice(plan.oldPrice) }}
                </div>
                <span class="text-subtitle2 text-gray-850 font-normal">
                    / {{ $t('date.month', 0).toLowerCase() }}
                </span>
            </div>

            <!-- Yearly Price - only for paid plans -->
            <div v-if="plan.monthlyPrice > 0" class="text-body text-gray-950">
                {{
                    $t('forTemplate', {
                        prefix: `${plan.currency}${formatPrice(calculateYearlyPrice())}`,
                        postfix: t('date.month', { n: 12 }).toLowerCase(),
                    })
                }}
            </div>
            <div v-else class="text-body text-gray-950">
                {{ t('referralOnly') }}
            </div>

            <!-- Savings Message -->
            <div
                v-if="plan.oldPrice && plan.oldPrice > 0 && plan.monthlyPrice > 0"
                class="text-subtitle3 text-green-600 font-semibold"
            >
                {{ $t('save') }} {{ plan.currency }}{{ formatPrice(calculateYearlySavings()) }}
                {{ $t('perYear') }}
            </div>
        </div>

        <!-- Divider Line -->
        <!-- <div class="border-t border-gray-200 mb-4"></div> -->

        <!-- Plan Features -->
        <div class="flex-1 space-y-3 mb-6">
            <div
                v-for="(feature, index) in plan.features"
                :key="index"
                class="flex items-start mx-3"
            >
                <div class="flex-shrink-0 mr-2">
                    <svg :class="['w-3 h-3', feature.included ? 'text-green-500' : 'text-red-500']">
                        <use :xlink:href="getIcon(feature.included)" />
                    </svg>
                </div>
                <div class="flex flex-col">
                    <div class="text-subtitle3 text-gray-950 mb-1">
                        <span
                            class="font-semibold"
                            :class="[feature.included ? 'text-gray-950' : 'text-red-500']"
                        >
                            {{ feature.title }} </span
                        >:
                        <!-- Show text only if different from title -->
                        <template v-if="feature.text && feature.text !== feature.title">
                            <span :class="[feature.included ? 'text-gray-950' : 'text-red-500']">
                                {{ feature.text }}
                            </span>
                        </template>
                    </div>

                    <span v-if="feature.hint" class="text-subtitle4 text-gray-700">
                        {{ feature.hint }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Plan Action -->
        <div class="mt-auto">
            <Button
                :color="isSelected || isCurrent ? 'blue' : 'red'"
                variant="filled"
                container-classes="w-full"
                :label="labelBtn"
                :disabled="disabled || isCurrent"
                @click="$emit('select-plan', plan)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'

    interface PlanFeature {
        title: string
        text: string
        included: boolean
        hint?: string | null
    }

    interface Plan {
        id: number
        title: string
        currency: string
        monthlyPrice: number
        oldPrice?: number | null
        discountPercentage?: number
        discountedPrice?: number // Deprecated
        highlighted: boolean
        label?: string | null
        features: PlanFeature[]
    }

    interface Props {
        plan: Plan
        isSelected?: boolean
        isCurrent?: boolean
        buttonLabel?: string
        disabled?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        isSelected: false,
        isCurrent: false,
        buttonLabel: '',
        disabled: false,
    })

    const { t } = useI18n()

    const emit = defineEmits<{
        (e: 'select-plan', plan: Plan): void
    }>()

    const labelBtn = computed(() => {
        if (props.isCurrent) {
            return t('currentPlan')
        }
        if (props.buttonLabel.length) {
            return t(props.buttonLabel)
        }
        return props.isSelected ? t('currentPlan') : t('selectPlan')
    })

    const getIcon = (value: boolean) => {
        return value ? '/sprite.svg#check' : '/sprite.svg#close'
    }

    const formatPrice = (price: number): string => {
        return price.toFixed(2)
    }

    const calculateYearlyPrice = (): number => {
        return props.plan.monthlyPrice * 12
    }

    const calculateYearlySavings = (): number => {
        if (!props.plan.oldPrice || props.plan.oldPrice <= 0) return 0
        return (props.plan.oldPrice - props.plan.monthlyPrice) * 12
    }
</script>

<style scoped>
    .animate-bounce-left {
        animation: bounce-left 0.9s ease-out both;
    }

    @keyframes bounce-left {
        0% {
            transform: translateX(48px);
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        70% {
            transform: translateX(10px);
        }
        85% {
            transform: translateX(5px);
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>
