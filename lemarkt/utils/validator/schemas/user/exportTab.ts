// utils/validator/schemas/user/exportTab.ts
import type { JSONSchemaType } from 'ajv'

export interface ExportTabFormData {
    doesExport: boolean
    exportSinceYear?: string | null
    exportCountries?: number[]
    userExportPercentageId?: number | null
    exportPorts?: string[]
}

export const exportTabSchema: JSONSchemaType<ExportTabFormData> = {
    type: 'object',
    properties: {
        doesExport: {
            type: 'boolean',
            errorMessage: {
                type: 'validation.export.doesExportRequired',
            },
        },
        exportSinceYear: {
            type: 'string',
            nullable: true,
            pattern: '^[0-9]{4}$',
            errorMessage: {
                pattern: 'validation.export.exportSinceYearInvalid',
            },
        },
        exportCountries: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            minItems: 1,
            maxItems: 50,
            nullable: true,
            errorMessage: {
                minItems: 'validation.export.exportCountriesRequired',
                maxItems: 'validation.export.exportCountriesTooMany',
                type: 'validation.export.exportCountriesInvalid',
            },
        },
        userExportPercentageId: {
            type: 'integer',
            nullable: true,
            minimum: 1,
            errorMessage: {
                type: 'validation.export.userExportPercentageIdInvalid',
                minimum: 'validation.export.userExportPercentageIdInvalid',
            },
        },
        exportPorts: {
            type: 'array',
            items: {
                type: 'string',
                minLength: 2,
                maxLength: 255,
            },
            nullable: true,
            errorMessage: {
                type: 'validation.export.exportPortsInvalid',
            },
        },
    },
    required: ['doesExport'],
    additionalProperties: false,
}
