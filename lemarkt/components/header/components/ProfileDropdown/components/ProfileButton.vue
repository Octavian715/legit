<template>
    <component
        :is="isLink ? NuxtLink : 'button'"
        :to="href"
        :type="isLink ? undefined : 'button'"
        :aria-current="isLink && isActive ? 'page' : undefined"
        class="flex items-center gap-2 p-3 text-gray-950 border hover:text-red-500 hover:border-red-500 hover:bg-red-50 active:text-red-700 active:scale-95 rounded-md transition-colors"
        :class="[
            isActive ? 'bg-red-50 text-red-500 border-red-500' : 'border-gray-600',
            { 'cursor-pointer': !disabled },
        ]"
        :disabled="disabled"
        @click="handleClick"
    >
        <!-- Icon slot -->
        <slot name="icon">
            <svg
                v-if="showDefaultIcon"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        </slot>

        <!-- Content slot -->
        <slot>
            <span
                class="truncate text-subtitle1 font-medium"
                :class="{
                    'font-bold': isActive,
                }"
                >{{ label }}
            </span>
        </slot>
    </component>
</template>

<script setup lang="ts">
    import type { NuxtLink } from '#components'

    const props = withDefaults(
        defineProps<{
            isActive?: boolean
            href?: string
            disabled?: boolean
            showDefaultIcon?: boolean
            label: string
        }>(),
        {
            isActive: false,
            disabled: false,
            showDefaultIcon: true,
            label: '',
        }
    )

    const emit = defineEmits<{
        (e: 'click', event: MouseEvent): void
    }>()

    const isLink = computed(() => Boolean(props.href))
    const NuxtLink = resolveComponent('NuxtLink')

    const handleClick = (event: MouseEvent) => {
        if (!props.disabled) {
            emit('click', event)
        }
    }
</script>
