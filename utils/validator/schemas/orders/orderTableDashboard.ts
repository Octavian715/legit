import type { JSONSchemaType } from '~/utils/validator'
import type { OrderTableFilters } from '~/types/orderTableDashboard'

// Schema pentru validarea filtrelor din OrderTableDashboard
export const orderTableFiltersSchema: JSONSchemaType<OrderTableFilters> = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['order', 'offer', 'delivery_note', 'invoice', 'correction_invoice'],
            nullable: true,
            errorMessage: {
                enum: 'documentTypeInvalid',
            },
        },
        status_ids: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            nullable: true,
            errorMessage: {
                type: 'statusIdsInvalid',
                items: 'statusIdInvalid',
            },
        },
        payment_status_ids: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            nullable: true,
            errorMessage: {
                type: 'paymentStatusIdsInvalid',
                items: 'paymentStatusIdInvalid',
            },
        },
        currency_ids: {
            type: 'array',
            items: {
                type: 'integer',
                minimum: 1,
            },
            nullable: true,
            errorMessage: {
                type: 'currencyIdsInvalid',
                items: 'currencyIdInvalid',
            },
        },
        amount_min: {
            type: 'number',
            minimum: 0,
            nullable: true,
            errorMessage: {
                minimum: 'amountMinInvalid',
            },
        },
        amount_max: {
            type: 'number',
            minimum: 0,
            nullable: true,
            errorMessage: {
                minimum: 'amountMaxInvalid',
            },
        },
        date_from: {
            type: 'string',
            format: 'date',
            nullable: true,
            errorMessage: {
                format: 'dateFromInvalid',
            },
        },
        date_to: {
            type: 'string',
            format: 'date',
            nullable: true,
            errorMessage: {
                format: 'dateToInvalid',
            },
        },
        search: {
            type: 'string',
            maxLength: 255,
            nullable: true,
            errorMessage: {
                maxLength: 'searchTooLong',
            },
        },
        sort_by: {
            type: 'string',
            enum: [
                'date',
                'total',
                'number',
                'type',
                'buyer_name',
                'buyer_country',
                'currency',
                'supplier_name',
                'supplier_country',
            ],
            nullable: true,
            errorMessage: {
                enum: 'sortFieldInvalid',
            },
        },
        sort_order: {
            type: 'string',
            enum: ['asc', 'desc'],
            nullable: true,
            errorMessage: {
                enum: 'sortOrderInvalid',
            },
        },
        per_page: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            nullable: true,
            errorMessage: {
                minimum: 'perPageTooSmall',
                maximum: 'perPageTooLarge',
            },
        },
        page: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            errorMessage: {
                minimum: 'pageInvalid',
            },
        },
    },
    required: [],
    additionalProperties: false,

    // Custom validation rules using AJV keywords
    if: {
        properties: {
            amount_min: { type: 'number' },
            amount_max: { type: 'number' },
        },
    },
    then: {
        properties: {
            amount_max: {
                type: 'number',
                minimum: { $data: '1/amount_min' },
            },
        },
        errorMessage: {
            properties: {
                amount_max: 'amountMaxLessThanMin',
            },
        },
    },

    // Date range validation
    allOf: [
        {
            if: {
                properties: {
                    date_from: { type: 'string' },
                    date_to: { type: 'string' },
                },
            },
            then: {
                properties: {
                    date_to: {
                        type: 'string',
                        formatMinimum: { $data: '1/date_from' },
                    },
                },
                errorMessage: {
                    properties: {
                        date_to: 'dateToBeforeDateFrom',
                    },
                },
            },
        },
    ],

    errorMessage: {
        type: 'filtersInvalid',
        additionalProperties: 'unknownFilterProperty',
    },
}

// Schema pentru validarea unei singure înregistrări de order
export const orderTableDataSchema: JSONSchemaType<{
    buyer_name: string
    currency_id: number
    amount: number
    date: string
}> = {
    type: 'object',
    properties: {
        buyer_name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            errorMessage: {
                minLength: 'buyerNameRequired',
                maxLength: 'buyerNameTooLong',
            },
        },
        currency_id: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                minimum: 'currencyRequired',
            },
        },
        amount: {
            type: 'number',
            minimum: 0.01,
            maximum: 999999.99,
            errorMessage: {
                minimum: 'amountTooSmall',
                maximum: 'amountTooLarge',
            },
        },
        date: {
            type: 'string',
            format: 'date',
            errorMessage: {
                format: 'dateInvalid',
            },
        },
    },
    required: ['buyer_name', 'currency_id', 'amount', 'date'],
    additionalProperties: false,
    errorMessage: {
        required: {
            buyer_name: 'buyerNameRequired',
            currency_id: 'currencyRequired',
            amount: 'amountRequired',
            date: 'dateRequired',
        },
    },
}

// Schema pentru validarea paginării
export const paginationSchema: JSONSchemaType<{
    page: number
    per_page: number
}> = {
    type: 'object',
    properties: {
        page: {
            type: 'integer',
            minimum: 1,
            errorMessage: {
                minimum: 'pageInvalid',
            },
        },
        per_page: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            errorMessage: {
                minimum: 'perPageTooSmall',
                maximum: 'perPageTooLarge',
            },
        },
    },
    required: ['page', 'per_page'],
    additionalProperties: false,
}
