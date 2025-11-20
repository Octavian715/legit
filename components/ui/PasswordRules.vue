<template>
    <transition-group
        v-if="passwordRules?.length"
        name="rule-fade"
        tag="div"
        class="ml-1 space-y-1"
    >
        <div
            v-for="(rule, index) in passwordRules"
            :key="index"
            class="flex items-center gap-1 text-caption1"
            :class="isRuleValid(rule) ? 'text-green-600' : 'text-gray-600'"
        >
            <svg class="w-3 h-3">
                <use xlink:href="/sprite.svg#warn-error"></use>
            </svg>
            <span>{{ rule.message }}</span>
        </div>
    </transition-group>
</template>

<script setup lang="ts">
    import type { InputPasswordType, PasswordRule } from '~/types/ui/input'

    const props = withDefaults(defineProps<InputPasswordType>(), {
        passwordRules: () => [],
    })

    const isRuleValid = (rule: PasswordRule) => {
        const value = String(props.modelValue || '')
        return typeof rule.validator === 'function'
            ? rule.validator(value)
            : rule.validator.test(value)
    }
</script>

<style scoped>
    .rule-fade-enter-active,
    .rule-fade-leave-active {
        transition: all 0.3s ease;
    }

    .rule-fade-enter-from,
    .rule-fade-leave-to {
        opacity: 0;
        transform: translateY(-5px);
    }
</style>
