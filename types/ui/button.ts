// ~/types/ui/button.ts

// PĂSTRĂM exact tipurile tale existente
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonVariant = 'filled' | 'outline' | 'ghost'

// PĂSTRĂM exact culorile tale
export type ButtonColor = 'blue' | 'red' | 'gray' | 'green' | 'black' | 'white' | 'yellow' | 'mix'

export type ButtonFontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

export interface ButtonType {
    label?: string
    size?: ButtonSize
    square?: boolean
    variant?: ButtonVariant
    color?: ButtonColor
    fontWeight?: ButtonFontWeight
    disabled?: boolean
    wrap?: boolean
    loading?: boolean
    showLoadingText?: boolean
    containerClasses?: string

    // Enhanced props
    tag?: 'button' | 'a' | 'NuxtLink'
    type?: 'button' | 'submit' | 'reset'
    href?: string
    to?: string | object
    external?: boolean

    iconBefore?: any
    iconAfter?: any

    ariaLabel?: string
    shape?: any
    showLabelOnSquare?: boolean
    ripple?: boolean
}

// Button group types for LeMarkt
export interface ButtonGroupType {
    buttons: ButtonType[]
    orientation?: 'horizontal' | 'vertical'
    variant?: ButtonVariant
    size?: ButtonSize
    spacing?: 'none' | 'sm' | 'md' | 'lg'
    fullWidth?: boolean
}

// Action button specific types for LeMarkt B2B actions
export type LeMarktActionType =
    | 'addToCart'
    | 'requestQuote'
    | 'contactSupplier'
    | 'saveProduct'
    | 'compareProduct'
    | 'downloadCatalog'
    | 'placeOrder'
    | 'approveOrder'
    | 'rejectOrder'

export interface ActionButtonType extends ButtonType {
    action: LeMarktActionType
    badge?: string | number
    notification?: boolean
}

// Button with dropdown for complex B2B actions
export interface DropdownButtonType extends ButtonType {
    dropdownItems: Array<{
        label: string
        action: string
        icon?: any
        disabled?: boolean
        divider?: boolean
    }>
    dropdownPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}

// Floating Action Button for mobile-first B2B
export interface FABType extends Omit<ButtonType, 'size' | 'variant'> {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    size?: 'sm' | 'md' | 'lg'
    extended?: boolean // Extended FAB with label
}

// Toast action buttons
export interface ToastButtonType extends ButtonType {
    toastAction: 'dismiss' | 'undo' | 'retry' | 'view'
}

// Stepper buttons for multi-step processes (like registration)
export interface StepperButtonType extends ButtonType {
    step: 'previous' | 'next' | 'finish' | 'skip'
    currentStep?: number
    totalSteps?: number
    showProgress?: boolean
}
