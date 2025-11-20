// utils/validator/schemas/user/accountSettingsSchema.ts
import type { JSONSchemaType } from 'ajv'

export interface PasswordData {
    current_password: string
    new_password: string
    new_password_confirmation: string
    logout_other_devices: boolean
}

export const accountSettingsSchema: JSONSchemaType<PasswordData> = {
    type: 'object',
    properties: {
        current_password: {
            type: 'string',
            minLength: 8,
            errorMessage: { minLength: 'validation.accountPassword.currentRequired' },
        },
        new_password: {
            type: 'string',
            minLength: 8,
            errorMessage: { minLength: 'validation.accountPassword.newMinLength' },
        },
        new_password_confirmation: {
            type: 'string',
            minLength: 8,
            errorMessage: { minLength: 'validation.accountPassword.confirmMatch' },
        },
        logout_other_devices: { type: 'boolean' },
    },
    required: ['current_password', 'new_password', 'new_password_confirmation'],
    additionalProperties: false,
    errorMessage: {
        required: {
            current_password: 'validation.accountPassword.currentRequired',
            new_password: 'validation.accountPassword.newRequired',
            new_password_confirmation: 'validation.accountPassword.confirmRequired',
        },
    },
}
