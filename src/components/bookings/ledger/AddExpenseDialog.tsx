import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  dynamicSchemaValidators,
  useAppForm,
} from '@/integrations/tanstack-form'
import { ledgerMutations } from '@/lib/ledger/ledger.mutations'
import { addExpenseFormSchema } from '@/lib/ledger/schemas'

import { LedgerPaymentFieldsSection } from './LedgerPaymentFieldsSection'

type AddExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: number
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  bookingId,
}: AddExpenseDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation(ledgerMutations.createExpense(queryClient))

  const form = useAppForm({
    defaultValues: {
      amount: 0,
      description: '',
      isPaid: false,
      paymentMethod: undefined,
      referenceNumber: '',
    },
    ...dynamicSchemaValidators(addExpenseFormSchema),
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        bookingId,
        amount: value.amount,
        description: value.description.trim(),
        isPaid: value.isPaid,
        paymentMethod: value.isPaid ? value.paymentMethod : undefined,
        referenceNumber: value.isPaid ? value.referenceNumber : undefined,
      })
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add charge</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <form.AppForm>
            <form.AppField name="description">
              {(field) => (
                <field.TextField
                  label="Description"
                  placeholder="e.g. Extra towels, minibar"
                />
              )}
            </form.AppField>
            <form.AppField name="amount">
              {(field) => (
                <field.NumberField
                  label="Amount"
                  placeholder="0.00"
                  min={0}
                />
              )}
            </form.AppField>
            <form.AppField name="isPaid">
              {(field) => (
                <field.CheckboxField label="Mark as paid" />
              )}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.isPaid}>
              {(isPaid) =>
                isPaid ? <LedgerPaymentFieldsSection form={form} /> : null
              }
            </form.Subscribe>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <form.SubmitButton label="Add charge" />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  )
}
