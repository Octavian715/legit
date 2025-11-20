<template>
    <div>
        <!-- Header -->
        <div class="text-center space-y-2">
            <h2 class="text-title1 font-bold text-gray-950">
                {{ t('chooseEntryMethod') }}
            </h2>
            <p class="text-subtitle2 text-gray-800">
                {{ t('chooseEntryMethodSubtitle') }}
            </p>
        </div>

        <!-- Method Options -->
        <div
            class="flex flex-col md:flex-row gap-4 justify-center items-center mt-6 max-w-xl mx-auto flex-1"
        >
            <!-- Manual Entry -->
            <MethodCard
                icon="plus"
                :title="t('addSkuTitle')"
                :description="t('addSkuDescription')"
                button-color="red"
                class="flex-1"
                :button-label="t('addSkuTitle')"
                :selected="selectedMethod === 'manual'"
                @select="selectMethod('manual')"
            />

            <!-- Excel Import -->
            <MethodCard
                icon="excel"
                :title="t('addExcelSkuTitle')"
                :description="t('addExcelSkuDescription')"
                button-color="blue"
                class="flex-1"
                :button-label="t('importExcel')"
                :selected="selectedMethod === 'excel'"
                @select="selectMethod('excel')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        stepData?: {
            type?: string
        }
        loading?: boolean
        errors?: Record<string, any>
    }

    const props = withDefaults(defineProps<Props>(), {
        stepData: () => ({ type: null }),
        loading: false,
        errors: () => ({}),
    })

    const emit = defineEmits<{
        update: [data: any]
        next: []
        previous: []
        'method-selected': [method: string]
    }>()

    const { t } = useI18n()

    const selectedMethod = ref(props.stepData?.type || null)

    const selectMethod = (method: string) => {
        selectedMethod.value = method
        const stepData = { type: method }

        emit('update', stepData)

        // Auto-trigger method selection for immediate navigation
        nextTick(() => {
            emit('method-selected', method)
        })
    }

    // Watch for external stepData changes (useful for data persistence)
    watch(
        () => props.stepData?.type,
        (newType) => {
            if (newType && newType !== selectedMethod.value) {
                selectedMethod.value = newType
            }
        },
        { immediate: true }
    )

    // Validation state - emit validation updates
    const isValid = computed(() => !!selectedMethod.value)

    watch(
        isValid,
        (newValid) => {
            emit('update', {
                type: selectedMethod.value,
                isValid: newValid,
            })
        },
        { immediate: true }
    )

    // Handle external navigation events (from StepControlPanel)
    const handleNext = () => {
        if (selectedMethod.value) {
            emit('method-selected', selectedMethod.value)
        }
    }

    const handlePrevious = () => {
        emit('previous')
    }

    // Expose methods for parent component if needed
    defineExpose({
        handleNext,
        handlePrevious,
        isValid,
        selectedMethod: readonly(selectedMethod),
    })
</script>
