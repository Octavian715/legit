/**
 * Input Component Type Definitions
 * Supports standard text inputs, password, email, number with strict validation options
 */

export interface InputType {
    modelValue?: string | number | null | undefined
    name?: string
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
    label?: string
    size?: 'sm' | 'md' | 'lg'
    background?: string
    required?: boolean
    disabled?: boolean
    error?: string | boolean
    errorMessage?: string
    explain?: string
    maxlength?: number
    min?: number
    max?: number
    step?: number
    copy?: boolean
    showPasswordToggle?: boolean
    autocomplete?: string | null
    placeholder?: string

    // Strict number validation options
    /**
     * Maximum number of decimal places allowed for number inputs
     * @example decimalPlaces: 2 // Allows 10.99 but truncates 10.999 to 10.99
     */
    decimalPlaces?: number

    /**
     * Allow negative numbers
     * @default true
     */
    allowNegative?: boolean

    /**
     * Enable strict number mode - blocks 'e', 'E', '+' characters (scientific notation)
     * Perfect for monetary values, percentages, and other strict numeric inputs
     * @default false
     * @example strictNumber: true // Blocks input like "1e2" or "+10"
     */
    strictNumber?: boolean
}

export interface OtpType {
    totalDigits?: number
    error?: string
    modelValue?: string
}
