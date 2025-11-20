<template>
    <div class="otp-input">
        <div class="flex gap-2">
            <input
                v-for="(_digit, index) in totalDigits"
                :key="index"
                :ref="(el) => (inputRefs[index] = el as HTMLInputElement)"
                v-model="otpValues[index]"
                type="text"
                maxlength="1"
                class="w-12 h-12 px-3 py-4 border rounded text-center text-subtitle2 focus:outline-none transition-all duration-200 focus:border-blue-500 outline-none"
                :class="{
                    'border-gray-300': !error,
                    'border-red-500': error,
                }"
                @input="handleInput(index)"
                @keydown="handleKeydown($event, index)"
                @paste="handlePaste"
            />
        </div>
        <p v-if="error" class="mt-2 text-red-500 text-caption1">
            {{ error }}
        </p>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted } from 'vue'
    import type { OtpType } from '~/types/ui/input'

    const props = withDefaults(defineProps<OtpType>(), {
        totalDigits: 6,
        error: '',
        modelValue: '',
    })

    const emit = defineEmits<{
        (e: 'update:modelValue', value: string): void
    }>()

    const otpValues = ref<string[]>(Array(props.totalDigits).fill(''))
    const inputRefs = ref<HTMLInputElement[]>([])

    const updateModelValue = () => {
        emit('update:modelValue', otpValues.value.join(''))
    }

    const handleInput = (index: number) => {
        otpValues.value[index] = otpValues.value[index].slice(0, 1)

        if (otpValues.value[index] && index < props.totalDigits - 1) {
            inputRefs.value[index + 1]?.focus()
        }

        updateModelValue()
    }

    const handleKeydown = (event: KeyboardEvent, index: number) => {
        if (event.key === 'Backspace' && !otpValues.value[index] && index > 0) {
            otpValues.value[index - 1] = ''
            inputRefs.value[index - 1]?.focus()
            updateModelValue()
        }
    }

    const handlePaste = (event: ClipboardEvent) => {
        event.preventDefault()
        const pastedData = event.clipboardData?.getData('text')
        if (!pastedData) return

        const digits = pastedData.slice(0, props.totalDigits).split('')
        digits.forEach((digit, index) => {
            if (index < props.totalDigits) {
                otpValues.value[index] = digit
            }
        })

        const lastFilledIndex = otpValues.value.findLastIndex((val) => val !== '')
        const focusIndex =
            lastFilledIndex < props.totalDigits - 1 ? lastFilledIndex + 1 : lastFilledIndex
        inputRefs.value[focusIndex]?.focus()

        updateModelValue()
    }

    onMounted(() => {
        if (props.modelValue) {
            const digits = props.modelValue.slice(0, props.totalDigits).split('')
            digits.forEach((digit: string, index: number) => {
                otpValues.value[index] = digit
            })
        }
    })
</script>
