<template>
    <div class="border rounded p-3 bg-white">
        <h4 v-if="title" class="py-4 text-title3 font-bold pb-4 text-gray-900 pt-1">
            {{ title }}
        </h4>
        <div class="ui-card__body">
            <slot></slot>
        </div>
        <div class="ui-card__footer mt-4">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
    withDefaults(
        defineProps<{
            title: string
        }>(),
        {
            title: '',
        }
    )
</script>
