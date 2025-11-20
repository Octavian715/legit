<template>
    <div class="bg-white rounded-md p-4 space-y-4">
        <!-- Revenue -->
        <div v-if="revenue" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.revenue') }}</span>
            <div class="text-title1 font-bold text-gray-950">{{ revenue }}</div>
        </div>

        <!-- Number of Employees -->
        <div v-if="employees" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.numberOfEmployees') }}</span>
            <div class="text-subtitle3 text-gray-950">{{ employees }}</div>
        </div>

        <!-- Location of Registration -->
        <div v-if="locationOfRegistration" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{
                $t('company.locationOfRegistration')
            }}</span>
            <div class="text-subtitle3 text-gray-950">{{ locationOfRegistration }}</div>
        </div>

        <!-- Street -->
        <div v-if="street" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.street') }}</span>
            <div class="text-subtitle3 text-gray-950">{{ street }}</div>
        </div>

        <!-- Business Type -->
        <div v-if="businessType" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.businessType') }}</span>
            <div class="text-subtitle3 text-gray-950">{{ businessType }}</div>
        </div>

        <!-- Spoken Languages -->
        <div v-if="spokenLanguages?.length" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.spokenLanguages') }}</span>
            <div class="text-subtitle3 text-gray-950">{{ spokenLanguages.join(', ') }}</div>
        </div>

        <!-- Phone Numbers -->
        <div v-if="phoneNumbers?.length" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.phoneNumber') }}</span>
            <div class="space-y-1">
                <a
                    v-for="(phone, index) in phoneNumbers"
                    :key="index"
                    :href="`tel:${phone}`"
                    class="block text-subtitle3 text-blue-600 hover:text-blue-800 transition-colors"
                >
                    {{ phone }}
                </a>
            </div>
        </div>

        <!-- Fax -->
        <div v-if="fax" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.fax') }}</span>
            <a
                :href="`tel:${fax}`"
                class="block text-subtitle3 text-blue-600 hover:text-blue-800 transition-colors"
            >
                {{ fax }}
            </a>
        </div>

        <!-- Email -->
        <div v-if="email" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.email') }}</span>
            <a
                :href="`mailto:${email}`"
                class="block text-subtitle3 text-blue-600 hover:text-blue-800 transition-colors break-all"
            >
                {{ email }}
            </a>
        </div>

        <!-- Website -->
        <div v-if="website" class="space-y-1">
            <span class="text-subtitle4 text-gray-800">{{ $t('company.website') }}</span>
            <a
                :href="website"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-subtitle3 text-blue-600 hover:text-blue-800 transition-colors break-all"
            >
                {{ formatWebsite(website) }}
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        revenue?: string
        employees?: string
        locationOfRegistration?: string
        street?: string
        businessType?: string
        spokenLanguages?: string[]
        phoneNumbers?: string[]
        fax?: string
        email?: string
        website?: string
    }

    defineProps<Props>()

    const formatWebsite = (url: string) => {
        return url.replace(/^https?:\/\//, '')
    }
</script>
