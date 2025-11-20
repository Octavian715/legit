<template>
    <div class="flex flex-col items-center text-center px-5">
        <div
            v-if="showIcon"
            class="w-20 h-20 rounded-full flex items-center justify-center mb-8"
            :class="iconBgClass"
        >
            <component :is="iconComponent" class="w-8 h-8" :class="iconColorClass" />
        </div>

        <p v-if="message" class="text-subtitle1 text-bold text-gray-950">
            {{ message }}
        </p>

        <div v-if="details && details.length > 0" class="space-y-3 my-6 w-full">
            <div
                v-for="(detail, index) in details"
                :key="index"
                class="flex items-center justify-center gap-8"
            >
                <span class="text-subtitle2 text-gray-800"> {{ detail.label }}: </span>
                <span class="text-subtitle2 font-bold text-gray-950">
                    {{ detail.value }}
                </span>
            </div>
        </div>

        <p v-if="warningText" class="text-subtitle3 text-gray-800">
            {{ warningText }}
        </p>
    </div>
</template>

<script setup lang="ts">
    import { computed, h } from 'vue'

    interface DetailItem {
        label: string
        value: string
    }

    interface Props {
        title?: string
        message?: string
        details?: DetailItem[]
        warningText?: string
        confirmText?: string
        cancelText?: string
        confirmColor?: 'blue' | 'red' | 'green' | 'yellow' | 'gray'
        iconType?: 'warning' | 'danger' | 'success' | 'info' | 'question'
        showIcon?: boolean
        isProcessing?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        title: '',
        message: '',
        details: () => [],
        warningText: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmColor: 'blue',
        iconType: 'warning',
        showIcon: true,
        isProcessing: false,
    })

    const iconComponent = computed(() => {
        const svgProps = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }

        switch (props.iconType) {
            case 'danger':
            case 'warning':
                return {
                    render: () =>
                        h('svg', svgProps, [
                            h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                            }),
                        ]),
                }
            case 'success':
                return {
                    render: () =>
                        h('svg', svgProps, [
                            h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                            }),
                        ]),
                }
            case 'info':
                return {
                    render: () =>
                        h('svg', svgProps, [
                            h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                            }),
                        ]),
                }
            case 'question':
                return {
                    render: () =>
                        h('svg', svgProps, [
                            h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                            }),
                        ]),
                }
            default:
                return {
                    render: () =>
                        h('svg', svgProps, [
                            h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': '2',
                                d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                            }),
                        ]),
                }
        }
    })

    const iconBgClass = computed(() => {
        switch (props.iconType) {
            case 'danger':
                return 'bg-red-50'
            case 'warning':
                return 'bg-[#FFF9E6]'
            case 'success':
                return 'bg-green-50'
            case 'info':
                return 'bg-blue-50'
            case 'question':
                return 'bg-purple-50'
            default:
                return 'bg-[#FFF9E6]'
        }
    })

    const iconColorClass = computed(() => {
        switch (props.iconType) {
            case 'danger':
                return 'text-red-600'
            case 'warning':
                return 'text-[#F5C842]'
            case 'success':
                return 'text-green-600'
            case 'info':
                return 'text-blue-600'
            case 'question':
                return 'text-purple-600'
            default:
                return 'text-[#F5C842]'
        }
    })
</script>
