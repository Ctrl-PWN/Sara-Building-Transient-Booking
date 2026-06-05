import type { PaymentMethod } from '@/db/schema/enums'
import type { useAppForm } from '@/integrations/tanstack-form'

import { paymentMethodOptions } from '../create-booking/create-booking-form.constants'

export type LedgerPaymentFormValues = {
  paymentMethod: PaymentMethod
  referenceNumber: string
}

type LedgerPaymentForm = ReturnType<
  typeof useAppForm<LedgerPaymentFormValues>
>

type LedgerPaymentFieldsSectionProps = {
  form: LedgerPaymentForm
}

export function LedgerPaymentFieldsSection({
  form,
}: LedgerPaymentFieldsSectionProps) {
  return (
    <div className="grid gap-4">
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
                placeholder="Required for GCash and bank transfer"
                disabled={paymentMethod === 'CASH'}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>
    </div>
  )
}
