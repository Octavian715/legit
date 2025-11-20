<template>
    <Transition name="slide-down">
        <div
            v-if="hasErrors"
            class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            role="alert"
            aria-live="assertive"
        >
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                    <use xlink:href="/sprite.svg#alert-circle" />
                </svg>
                <div class="flex-1">
                    <h4 class="text-red-800 font-semibold mb-2">
                        {{ title || $t('product.validationErrors') }}
                    </h4>
                    <ul class="space-y-1">
                        <li
                            v-for="(error, key) in errors"
                            :key="key"
                            class="text-red-700 text-sm flex items-start gap-2"
                        >
                            <span class="text-red-500 mt-1">•</span>
                            <span>{{ error }}</span>
                        </li>
                    </ul>
                </div>
                <button
                    v-if="dismissible"
                    type="button"
                    class="text-red-400 hover:text-red-600 transition-colors"
                    :aria-label="$t('close')"
                    @click="$emit('dismiss')"
                >
                    <svg class="w-5 h-5">
                        <use xlink:href="/sprite.svg#x" />
                    </svg>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
    interface Props {
        errors: Record<string, string>
        title?: string
        dismissible?: boolean
    }

    const props = withDefaults(defineProps<Props>(), {
        title: '',
        dismissible: false,
    })

    defineEmits<{
        dismiss: []
    }>()

    const hasErrors = computed(() => Object.keys(props.errors).length > 0)
</script>

<style scoped>
    .slide-down-enter-active,
    .slide-down-leave-active {
        transition: all 0.3s ease-out;
    }

    .slide-down-enter-from {
        opacity: 0;
        transform: translateY(-10px);
    }

    .slide-down-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }
</style>
