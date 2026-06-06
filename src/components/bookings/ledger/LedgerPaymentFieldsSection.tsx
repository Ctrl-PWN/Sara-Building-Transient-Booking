import type { PaymentMethod } from '@/db/schema/enums'

import { paymentMethodOptions } from '../create-booking/create-booking-form.constants'

export type LedgerPaymentFormValues = {
  paymentMethod: PaymentMethod
  referenceNumber: string
}

type LedgerPaymentFieldsSectionProps = {
  // biome-ignore lint/suspicious/noExplicitAny: form must be any to accept various typed forms from callers
  form: any
  disabled?: boolean
}

export function LedgerPaymentFieldsSection({
  form,
  disabled = false,
}: LedgerPaymentFieldsSectionProps) {
  return (
    <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-50">
      <form.AppField name="paymentMethod">
        {/* biome-ignore lint/suspicious/noExplicitAny: field API is complex, cannot narrow */}
        {(field: any) => (
          <field.RadioChoiceCardField
            label="Payment method"
            options={[...paymentMethodOptions]}
            onValueChange={(method: string) => {
              if (method === 'CASH') {
                form.setFieldValue('referenceNumber', '')
              }
            }}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={/* biome-ignore lint/suspicious/noExplicitAny: form state shape varies by caller */
        (state: any) => state.values.paymentMethod}>
        {(paymentMethod: string) => (
          <form.AppField name="referenceNumber">
            {/* biome-ignore lint/suspicious/noExplicitAny: field API is complex, cannot narrow */}
            {(field: any) => (
              <field.TextField
                label="Reference number"
                placeholder="e.g. GCash-1234567890"
                description="Required for GCash and bank transfer"
                disabled={paymentMethod === 'CASH'}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>
    </fieldset>
  )
}
