<template>
    <div
        class="flex items-start gap-3 rounded-sm rounded-l-md bg-white p-3 pl-4 min-w-[320px] border-l-4 max-w-[464px] shadow-[0_3px_14px_3px_rgba(90,93,101,0.12),0_8px_10px_1px_rgba(90,93,101,0.14)]"
        :class="{
            'border-teal-500': props.type === 'success',
            'border-red-500': props.type === 'error',
            'border-yellow-500': props.type === 'warning',
            'border-blue-500': props.type === 'info',
        }"
    >
        <!-- Icon (from design image) -->
        <div class="flex-shrink-0">
            <svg
                class="w-6 h-6"
                :class="{
                    'text-teal-500': props.type === 'success',
                    'text-red-500': props.type === 'error',
                    'text-yellow-500': props.type === 'warning',
                    'text-blue-500': props.type === 'info',
                }"
            >
                <use
                    :xlink:href="`/sprite.svg#${props.type === 'success' ? 'check' : 'alert'}`"
                ></use>
            </svg>
        </div>

        <!-- Content -->
        <div class="flex flex-col gap-1 flex-grow">
            <h3
                v-if="title"
                class="text-gray-950 font-semibold text-subtitle1"
                :class="{
                    'text-teal-500': props.type === 'success',
                    'text-red-500': props.type === 'error',
                    'text-yellow-500': props.type === 'warning',
                    'text-blue-500': props.type === 'info',
                }"
            >
                {{ title }}
            </h3>
            <p class="text-gray-950 text-body">{{ message }}</p>
        </div>

        <ButtonClose size="sm" icon-size="sm" @click="closeToast" />
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import type { ToastType } from '~/types/ui/toast'

    const { $toast } = useNuxtApp()

    // Define props using the interface with defineProps
    const props = withDefaults(defineProps<ToastType>(), {
        title: '',
        onClose: () => {},
        toastId: undefined,
    })

    // Define emits
    const emit = defineEmits<{
        (e: 'close'): void
    }>()

    // Function to close the toast
    const closeToast = () => {
        if (props.toastId !== undefined) {
            // Close the specific toast if we have its ID
            $toast.dismiss(props.toastId)
        } else {
            // If no ID is provided, emit the close event for backward compatibility
            emit('close')
        }
    }
</script>

<style lang="scss" scoped></style>
