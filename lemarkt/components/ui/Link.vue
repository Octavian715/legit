<template>
    <component
        :is="componentType"
        :to="isInternalLink ? to : undefined"
        :href="isExternalLink ? href : undefined"
        :class="linkClasses"
        :aria-label="title"
        :target="isExternal ? '_blank' : undefined"
        :rel="isExternal ? 'noopener noreferrer' : undefined"
        :active-class="isInternalLink ? activeClass : undefined"
        @click="handleClick"
    >
        <span>
            <slot>{{ title }}</slot>
        </span>
    </component>
</template>

<script setup lang="ts">
    import { computed, withDefaults, defineProps } from 'vue'
    import { NuxtLink } from '#components'
    import type { LinkProps } from '@/types/ui/link'

    const emit = defineEmits<{
        (e: 'click'): void
    }>()

    const props = withDefaults(defineProps<LinkProps>(), {
        title: '',
        size: 'base',
        color: 'primary',
        activeClass: 'font-bold',
        type: 'link',
        wrap: false,
        containerClass: '',
    })

    const componentType = computed(() => {
        const componentMap = {
            tel: 'a',
            email: 'a',
            button: 'button',
            link: NuxtLink,
        }
        return componentMap[props.type]
    })

    const isInternalLink = computed(() => props.type === 'link')
    const isExternalLink = computed(() => ['tel', 'email'].includes(props.type))

    const href = computed(() => {
        const hrefMap = {
            tel: `tel:${props.to}`,
            email: `mailto:${props.to}`,
        }
        return hrefMap[props.type as keyof typeof hrefMap]
    })

    const isExternal = computed(() => {
        return props.to?.startsWith('http') || props.to?.startsWith('https')
    })

    const sizeClasses = computed(() => {
        const sizeMap = {
            sm: 'text-subtitle3',
            base: 'text-subtitle2',
            md: 'text-subtitle1',
            lg: 'text-title3',
            custom: '',
        }
        return sizeMap[props.size]
    })

    const colorClasses = computed(() => {
        const colorMap = {
            primary: 'text-blue-500 hover:text-blue-700',
            secondary: 'text-purple-500 hover:text-purple-700',
            success: 'text-green-500 hover:text-green-700',
            warning: 'text-yellow-500 hover:text-yellow-700',
            danger: 'text-red-500 hover:text-red-700',
            gray: 'text-gray-500 hover:text-gray-700',
        }
        return colorMap[props.color]
    })

    const linkClasses = computed(() => [
        'transition-colors duration-200 cursor-pointer',
        sizeClasses.value,
        colorClasses.value,
        {
            'whitespace-nowrap': props.wrap,
        },
        props.containerClass,
    ])

    const handleClick = () => {
        if (props.type === 'button') {
            emit('click')
        }
    }
</script>
