import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PaymentMethod } from '@/db/schema/enums'
import {
  dynamicSchemaValidators,
  useAppForm,
} from '@/integrations/tanstack-form'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import { ledgerMutations } from '@/lib/ledger/ledger.mutations'
import { ledgerPaymentFieldsSchema } from '@/lib/ledger/schemas'
import type { LedgerTransactionListItem } from '@/lib/ledger/types'

import { LedgerPaymentFieldsSection } from './LedgerPaymentFieldsSection'

type PayExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: number
  transaction: LedgerTransactionListItem | null
}

export function PayExpenseDialog({
  open,
  onOpenChange,
  bookingId,
  transaction,
}: PayExpenseDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation(
    ledgerMutations.payExpense(queryClient, bookingId),
  )

  const form = useAppForm({
    defaultValues: {
      paymentMethod: 'CASH' as PaymentMethod,
      referenceNumber: '',
    },
    ...dynamicSchemaValidators(ledgerPaymentFieldsSchema),
    onSubmit: async ({ value }) => {
      if (!transaction) return
      await mutation.mutateAsync({
        id: transaction.id,
        paymentMethod: value.paymentMethod,
        referenceNumber: value.referenceNumber,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        {transaction ? (
          <form
            className="space-y-4 py-2"
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <form.AppForm>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {transaction.description ?? 'Charge'}
                </p>
                <p className="text-muted-foreground">
                  Amount due: {formatPeso(Number(transaction.amount))}
                </p>
              </div>
              <LedgerPaymentFieldsSection form={form} />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <form.SubmitButton label="Record payment" />
              </DialogFooter>
            </form.AppForm>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
