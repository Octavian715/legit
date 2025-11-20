<template>
    <div class="bg-white rounded-lg">
        <table class="min-w-full">
            <thead class="border-b border-gray-200">
                <tr>
                    <th v-for="i in 8" :key="i" class="px-3 py-3">
                        <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in 10" :key="row" class="border-b border-gray-100">
                    <td v-for="col in 8" :key="col" class="px-3 py-4">
                        <div class="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
