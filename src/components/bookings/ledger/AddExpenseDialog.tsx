import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

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

const addExpenseFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
})

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
      amount: '',
      description: '',
    },
    ...dynamicSchemaValidators(addExpenseFormSchema),
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        bookingId,
        amount: value.amount,
        description: value.description.trim(),
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
                <field.TextField
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                />
              )}
            </form.AppField>
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
