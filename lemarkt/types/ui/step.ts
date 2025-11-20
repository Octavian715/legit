export interface Step {
    value: string | number
    title?: string
    label?: string
    to: string
    disabled?: boolean
    completed?: boolean
}

export interface StepperProps {
    steps: Step[]
    activeStep: number
}

export interface StepperEmits {
    (e: 'stepClick', step: Step, index: number): void
    (e: 'stepChange', from: number, to: number): void
}
