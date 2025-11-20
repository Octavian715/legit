<template>
    <div class="w-full mx-auto">
        <!-- Tabs Header -->
        <div class="flex flex-wrap px-3">
            <!-- <div class="flex border-b flex-wrap border-gray-400 mb-4 px-3"> -->
            <button
                v-for="(tab, index) in tabs"
                :key="index"
                :class="[
                    'relative',
                    'flex',
                    'text-subtitle3',
                    'flex-col',
                    {
                        'cursor-pointer': tab.active && !disabled,
                        'cursor-not-allowed': !tab.active || disabled,
                    },
                ]"
                :disabled="!tab.active || disabled"
                @click="selectTab(index)"
            >
                <span
                    :class="[
                        'px-2.5 py-4 font-medium border-b-2 border-transparent Transition-colors duration-300',
                        tab.active ? 'hover:text-blue-600' : 'text-gray-400',
                        selectedIndex === index ? 'text-blue-400' : 'text-gray-900',
                    ]"
                >
                    {{ tab.label }}
                </span>
                <span
                    :class="{
                        'absolute -bottom-px w-full h-1 bg-blue-400 rounded-t delay-100	':
                            selectedIndex === index && tab.active,
                    }"
                ></span>
            </button>
        </div>

        <!-- Tabs Content -->
        <Transition name="tab-fade" mode="out-in">
            <div
                v-if="tabs[selectedIndex]"
                :key="tabs[selectedIndex].id"
                class="text-gray-900 bg-white shadow-sm rounded-b-sm"
            >
                <slot :name="tabs[selectedIndex].name"></slot>
            </div>
        </Transition>
    </div>
</template>
<script setup lang="ts">
    import { ref, withDefaults } from 'vue'
    import type { TabsType } from '~/types/ui/tabs'

    const props = withDefaults(defineProps<TabsType>(), {
        disabled: false,
        defaultActive: 0,
    })

    const emit = defineEmits<{
        (e: 'selectTab', index: number): void
    }>()

    const selectedIndex = ref(props.defaultActive)

    const selectTab = (index: number) => {
        if (props.tabs[index]?.active || !props.disabled) {
            selectedIndex.value = index
            emit('selectTab', index)
        }
    }
</script>
<style scoped>
    .tab-fade-enter-active,
    .tab-fade-leave-active {
        transition:
            opacity 0.3s ease,
            transform 0.3s ease;
    }

    .tab-fade-enter-from {
        opacity: 0;
        transform: translateY(-10px);
    }

    .tab-fade-enter-to {
        opacity: 1;
        transform: translateY(0);
    }

    .tab-fade-leave-from {
        opacity: 1;
        transform: translateY(0);
    }

    .tab-fade-leave-to {
        opacity: 0;
        transform: translateY(10px);
    }
</style>
