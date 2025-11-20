<template>
    <div :class="classes" :data-test="test">
        <ClientOnly>
            <img
                v-if="imageUrl && !imageError"
                :src="imageUrl"
                :alt="`Avatar ${initials}`"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="handleImageError"
                @load="handleImageLoad"
            />
            <template #fallback>
                <span :class="['flex items-center justify-center w-full h-full', textColor]">
                    {{ displayText }}
                </span>
            </template>
        </ClientOnly>

        <!-- Fallback for SSR or when no image/image failed -->
        <span
            v-if="!imageUrl || imageError"
            :class="['flex items-center justify-center w-full h-full', textColor]"
        >
            {{ displayText }}
        </span>

        <!-- Optional loading state -->
        <span
            v-if="imageUrl && isLoading && !imageError"
            :class="[
                'absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50',
                textColor,
            ]"
        >
            <span class="loader-avatar"></span>
        </span>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue'
    import type { AvatarProps } from '~/types/ui/avatar'

    const props = withDefaults(defineProps<AvatarProps>(), {
        color: 'bg-gray-300',
        textColor: 'text-black',
        initials: '',
        placeholder: '?',
        imageUrl: '',
        test: 'test',
        rounded: true,
        size: 'md',
    })

    // Image state management
    const imageError = ref(false)
    const isLoading = ref(false)

    /**
     * Handle image load errors
     * Falls back to initials/placeholder
     */
    const handleImageError = () => {
        imageError.value = true
        isLoading.value = false
        console.warn('[Avatar] Failed to load image:', props.imageUrl)
    }

    /**
     * Handle successful image load
     */
    const handleImageLoad = () => {
        imageError.value = false
        isLoading.value = false
    }

    /**
     * Watch for imageUrl changes to reset error state
     */
    watch(
        () => props.imageUrl,
        (newUrl) => {
            if (newUrl) {
                imageError.value = false
                isLoading.value = true
            }
        }
    )

    const sizeClasses = {
        xs: 'w-4 h-4 text-subtitle4',
        sm: 'w-6 h-6 text-subtitle4',
        base: 'w-8 h-8 text-subtitle4',
        md: 'w-10 h-10 text-subtitle4',
        lg: 'w-12 h-12 text-subtitle4 font-bold',
    }

    const classes = computed(() => [
        'relative flex items-center justify-center overflow-hidden font-bold',
        sizeClasses[props.size],
        props.rounded ? 'rounded-full' : 'rounded-lg',
        props.color,
    ])

    const displayText = computed(() => props.initials || props.placeholder)
</script>

<style scoped lang="scss">
    /* Optional: Smooth image fade-in */
    img {
        @apply transition-opacity duration-300;
        opacity: 0;
        animation: fadeInAvatar 0.3s ease-in forwards;
    }

    @keyframes fadeInAvatar {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Optional: Loading spinner for avatar */
    .loader-avatar {
        @apply w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
