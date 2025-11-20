<template>
    <div class="space-y-6 bg-white p-6 pt-9">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="i in 4"
                :key="i"
                class="shadow relative p-3 border border-transparent rounded-sm"
            >
                <div class="flex flex-col items-center space-y-3">
                    <div class="w-16 h-16 bg-gray-300 rounded animate-pulse"></div>

                    <div class="flex flex-col items-center space-y-2 w-full">
                        <div class="flex items-center gap-2 w-full justify-center">
                            <div class="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
                            <div class="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                        </div>
                        <div class="h-3 bg-gray-300 rounded w-40 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-center pt-4">
            <div class="h-10 bg-gray-300 rounded-sm w-32 animate-pulse"></div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style>
    .shadow {
        box-shadow:
            0 4px 5px 0 rgba(90, 93, 101, 0.12),
            0 2px 4px 0 rgba(90, 93, 101, 0.14);
    }
</style>
