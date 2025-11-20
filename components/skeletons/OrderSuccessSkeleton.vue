<template>
    <div>
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
            <div class="bg-gray-200 h-48"></div>

            <div class="p-6 lg:p-8">
                <div class="bg-gray-200 rounded-xl h-24 mb-6"></div>

                <div class="flex justify-center mb-8">
                    <div class="bg-gray-200 rounded-lg h-12 w-64"></div>
                </div>

                <div class="grid sm:grid-cols-2 gap-3">
                    <div class="bg-gray-200 rounded-lg h-12"></div>
                    <div class="bg-gray-200 rounded-lg h-12"></div>
                </div>
            </div>
        </div>

        <div class="mt-8 bg-white rounded-xl shadow-sm p-6 lg:p-8 animate-pulse">
            <div class="bg-gray-200 h-6 w-48 mb-6 rounded"></div>

            <div class="space-y-4">
                <div v-for="i in 3" :key="i" class="flex items-start">
                    <div class="bg-gray-200 w-10 h-10 rounded-full mr-4"></div>
                    <div class="flex-1">
                        <div class="bg-gray-200 h-5 w-32 mb-2 rounded"></div>
                        <div class="bg-gray-200 h-4 w-full rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6 bg-gray-100 rounded-xl p-6 animate-pulse">
            <div class="flex items-start space-x-3">
                <div class="bg-gray-200 w-6 h-6 rounded-full"></div>
                <div class="flex-1">
                    <div class="bg-gray-200 h-5 w-32 mb-2 rounded"></div>
                    <div class="bg-gray-200 h-4 w-48 rounded"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts"></script>
