<template>
    <div class="flex flex-col">
        <label class="text-gray-950 font-semibold text-body mb-1">
            {{ label }}
        </label>
        <p class="text-gray-800 break-words text-body">
            {{ value || '-' }}
        </p>
    </div>
</template>

<script setup lang="ts">
    defineProps<{ label: string; value: string | number | null }>()
</script>

<style scoped>
    /* Optional scoped styles */
</style>
