<template>
    <div class="flex flex-col gap-2 lg:items-end lg:justify-center" style="animation-delay: 200ms">
        <div class="flex gap-2 w-full">
            <!-- Chat Button -->
            <Button
                v-tooltip="`${t('chatWithUser', { user: userName })}`"
                container-classes="flex-1"
                color="gray"
                variant="filled"
                size="md"
                font-weight="normal"
                :disabled="isChatLoading"
                @click="$emit('chat-click')"
            >
                <div class="flex gap-2 items-center justify-center">
                    <svg class="w-4 h-4">
                        <use xlink:href="/sprite.svg#message"></use>
                    </svg>
                    {{ isChatLoading ? t('profile.loading') : t('profile.chat') }}
                </div>
            </Button>

            <!-- Follow Button -->
            <FollowButton
                classes="flex-1"
                :user-id="userId"
                :loading="isFollowLoading"
                :supplier-name="userName"
                size="md"
                font-width="normal"
                :is-follow="socialState.is_following"
                :controlled="true"
                @set-follow="$emit('follow-toggle', $event)"
            />

            <!-- Connect Button -->
            <Button
                :color="connectionButtonColor"
                container-classes="flex-1"
                variant="filled"
                size="md"
                font-weight="normal"
                :disabled="isConnectLoading"
                @click="$emit('connect-toggle')"
            >
                <span class="flex items-center gap-2 justify-center">
                    <!-- Connect Icon (when not connected and not pending) -->
                    <svg
                        v-if="!connectionState.isConnected && !connectionState.isPending"
                        class="w-3 h-3"
                    >
                        <use xlink:href="/sprite.svg#connected"></use>
                    </svg>

                    <!-- Disconnect Icon (when connected) -->
                    <svg v-if="connectionState.isConnected" class="w-3 h-3">
                        <use xlink:href="/sprite.svg#disconnect"></use>
                    </svg>

                    {{ isConnectLoading ? t('pending') : connectionButtonText }}
                </span>
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { ProfileSocialData } from '~/types/profile'

    interface Props {
        userId: number
        userName: string
        socialState: ProfileSocialData
        connectionState: { isConnected: boolean; isPending: boolean; connectionId?: number }
        connectionButtonColor: string
        connectionButtonText: string
        isFollowLoading: boolean
        isConnectLoading: boolean
        isChatLoading: boolean
    }

    defineProps<Props>()

    defineEmits<{
        (e: 'follow-toggle', value: boolean): void
        (e: 'connect-toggle'): void
        (e: 'chat-click'): void
    }>()

    const { t } = useI18n()
</script>
