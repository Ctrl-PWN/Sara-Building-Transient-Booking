import type { PaymentMethod } from '@/db/schema/enums'
import type { useAppForm } from '@/integrations/tanstack-form'

import { paymentMethodOptions } from '../create-booking/create-booking-form.constants'

export type LedgerPaymentFormValues = {
  paymentMethod: PaymentMethod
  referenceNumber: string
}

type LedgerPaymentForm = ReturnType<typeof useAppForm<LedgerPaymentFormValues>>

type LedgerPaymentFieldsSectionProps = {
  form: LedgerPaymentForm
  disabled?: boolean
}

export function LedgerPaymentFieldsSection({
  form,
  disabled = false,
}: LedgerPaymentFieldsSectionProps) {
  return (
    <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-50">
      <form.AppField name="paymentMethod">
        {(field) => (
          <field.RadioChoiceCardField
            label="Payment method"
            options={[...paymentMethodOptions]}
            onValueChange={(method) => {
              if (method === 'CASH') {
                form.setFieldValue('referenceNumber', '')
              }
            }}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.paymentMethod}>
        {(paymentMethod) => (
          <form.AppField name="referenceNumber">
            {(field) => (
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
