// ~/composables/usePlanChangeEvents.ts
import { ref } from 'vue'

// ✅ GLOBAL SHARED STATE - OUTSIDE funcției!
// Astfel plugin-ul și page-ul văd ACELAȘI counter!
const planChangeCounter = ref(0)
const lastPlanChange = ref<{
    from: string | null
    to: string
    timestamp: number
} | null>(null)

export const usePlanChangeEvents = () => {
    /**
     * Emit plan change event
     * Incrementează counter-ul global → trigger reactivity
     */
    const emitPlanChange = (from: string | null, to: string) => {
        planChangeCounter.value++
        lastPlanChange.value = {
            from,
            to,
            timestamp: Date.now(),
        }
    }

    /**
     * Watch for plan changes
     * Returns a reactive ref that updates when plan changes
     */
    const planChangeKey = computed(() => planChangeCounter.value)

    /**
     * Get last plan change info
     */
    const getLastPlanChange = () => lastPlanChange.value

    return {
        emitPlanChange,
        planChangeKey,
        getLastPlanChange,
    }
}
