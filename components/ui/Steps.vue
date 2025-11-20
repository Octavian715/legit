<template>
    <div class="stepper flex items-center justify-between mb-8">
        <component
            :is="isStepAccessible(step, index) ? 'NuxtLink' : 'div'"
            v-for="(step, index) in steps"
            :key="step.value"
            :to="isStepAccessible(step, index) ? step.to : undefined"
            class="relative flex flex-col items-center flex-1 group"
            :class="{
                'cursor-pointer': isStepAccessible(step, index),
                'cursor-not-allowed': !isStepAccessible(step, index),
            }"
            @click="handleStepClick(step, index, $event)"
        >
            <!-- Connector Line -->
            <div
                v-if="index > 0"
                class="absolute top-2 left-0 -translate-x-1/2 w-full h-0.5"
                :class="{
                    'bg-blue-500': index <= activeStep,
                    'bg-gray-600': index > activeStep,
                }"
            ></div>

            <!-- Step Circle -->
            <div
                class="relative z-[1] flex items-center justify-center rounded-full"
                :class="{
                    'bg-blue-500 text-white': index < activeStep,
                    'bg-blue-600 text-white': index === activeStep,
                    'bg-gray-600 text-white': index > activeStep,
                    'w-4 h-4': true,
                    'group-hover:bg-blue-400 group-hover:scale-110':
                        isStepAccessible(step, index) && index !== activeStep,
                }"
            ></div>

            <!-- Step Label -->
            <span
                class="step-label absolute top-5 text-center text-caption1 font-normal max-w-20"
                :class="{
                    'text-blue-500': index <= activeStep,
                    'text-gray-800': index > activeStep,
                }"
            >
                {{ step.title || step.label }}
            </span>
        </component>
    </div>
</template>

<script setup lang="ts">
    import type { StepperProps, StepperEmits, Step } from '~/types/ui/step'

    const props = withDefaults(defineProps<StepperProps>(), {
        activeStep: 0,
    })

    const emit = defineEmits<StepperEmits>()

    const isStepAccessible = (step: Step, index: number): boolean => {
        if (step.disabled) return false
        if (index <= props.activeStep) return true
        if (step.completed) return true
        return false
    }

    const handleStepClick = (step: Step, index: number, event: Event) => {
        if (!isStepAccessible(step, index)) {
            event.preventDefault()
            return
        }

        emit('stepClick', step, index)

        if (index !== props.activeStep) {
            emit('stepChange', props.activeStep, index)
        }
    }
</script>

<style scoped>
    .step-label {
        display: none;
    }

    @screen sm {
        .step-label {
            display: block;
        }
    }
</style>
