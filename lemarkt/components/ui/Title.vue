<template>
    <h3 class="py-4 text-title3 font-bold text-gray-900">{{ title }}</h3>
</template>

<script setup lang="ts">
    defineProps<{
        title: string
    }>
</script>
