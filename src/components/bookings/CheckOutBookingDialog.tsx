import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogOutsideScroll,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  dynamicSchemaValidators,
  useAppForm,
} from '@/integrations/tanstack-form'
import { bookingMutations } from '@/lib/bookings/bookings.mutations'
import { formatPeso } from '@/lib/bookings/stay-pricing'
import type { BookingWithRoom } from '@/lib/bookings/types'
import { ledgerMutations } from '@/lib/ledger/ledger.mutations'
import { ledgerQueries } from '@/lib/ledger/ledger.queries'
import {
  ledgerPaymentFieldsSchema,
  paymentReferenceRefine,
} from '@/lib/ledger/schemas'
import type { LedgerTransactionListItem } from '@/lib/ledger/types'
import type { PaymentMethod } from '@/db/schema/enums'

import { BookingLedgerTable } from './BookingLedgerTable'
import { LedgerBalanceSummary } from './ledger/LedgerBalanceSummary'
import { LedgerPaymentFieldsSection } from './ledger/LedgerPaymentFieldsSection'

type SettlementMode = 'unified' | 'separate'

type SeparatePaymentLine = {
  id: number
  paymentMethod: PaymentMethod
  referenceNumber: string
}

type CheckOutBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingWithRoom
  bookingId: number
}

const separateLineSchema = z
  .object({
    id: z.number(),
    paymentMethod: z.enum(['CASH', 'GCASH', 'BANK_TRANSFER']),
    referenceNumber: z.string(),
  })
  .superRefine(paymentReferenceRefine)

function buildSeparateDefaults(
  unpaid: LedgerTransactionListItem[],
): SeparatePaymentLine[] {
  return unpaid.map((row) => ({
    id: row.id,
    paymentMethod: 'CASH',
    referenceNumber: '',
  }))
}

function SeparatePaymentLines({
  unpaid,
  lines,
  onChange,
}: {
  unpaid: LedgerTransactionListItem[]
  lines: SeparatePaymentLine[]
  onChange: (lines: SeparatePaymentLine[]) => void
}) {
  const updateLine = (
    id: number,
    patch: Partial<
      Pick<SeparatePaymentLine, 'paymentMethod' | 'referenceNumber'>
    >,
  ) => {
    onChange(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    )
  }

  return (
    <div className="space-y-4">
      {unpaid.map((row) => {
        const line = lines.find((item) => item.id === row.id)
        if (!line) return null

        return (
          <div key={row.id} className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium text-sm">
                {row.description ?? 'Charge'}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPeso(Number(row.amount))}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <RadioGroup
                value={line.paymentMethod}
                onValueChange={(value) => {
                  const method = value as PaymentMethod
                  updateLine(row.id, {
                    paymentMethod: method,
                    referenceNumber:
                      method === 'CASH' ? '' : line.referenceNumber,
                  })
                }}
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="CASH" />
                  Cash
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="GCASH" />
                  GCash
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="BANK_TRANSFER" />
                  Bank transfer
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`ref-${row.id}`}>Reference number</Label>
              <input
                id={`ref-${row.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={line.referenceNumber}
                disabled={line.paymentMethod === 'CASH'}
                placeholder="Required for GCash and bank transfer"
                onChange={(event) =>
                  updateLine(row.id, { referenceNumber: event.target.value })
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CheckOutBookingDialog({
  open,
  onOpenChange,
  booking,
  bookingId,
}: CheckOutBookingDialogProps) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<SettlementMode>('unified')
  const [separateLines, setSeparateLines] = useState<SeparatePaymentLine[]>([])
  const [settleError, setSettleError] = useState<string | null>(null)

  const { data: details } = useQuery({
    ...ledgerQueries.details(bookingId),
    enabled: open,
  })
  const { data: transactions = [] } = useQuery({
    ...ledgerQueries.transactions(bookingId),
    enabled: open,
  })

  const unpaid = useMemo(
    () => transactions.filter((row) => !row.isPaid),
    [transactions],
  )

  const unifiedTotal = useMemo(
    () => unpaid.reduce((sum, row) => sum + Number(row.amount), 0),
    [unpaid],
  )

  const bulkMutation = useMutation(
    ledgerMutations.payExpensesBulk(queryClient, bookingId),
  )
  const separateMutation = useMutation(
    ledgerMutations.payExpenses(queryClient, bookingId),
  )
  const checkOutMutation = useMutation(
    bookingMutations.checkOut(queryClient, bookingId),
  )

  const unifiedForm = useAppForm({
    defaultValues: {
      paymentMethod: 'CASH' as const,
      referenceNumber: '',
    },
    ...dynamicSchemaValidators(ledgerPaymentFieldsSchema),
    onSubmit: async () => {},
  })

  useEffect(() => {
    if (open) {
      setMode('unified')
      setSettleError(null)
      unifiedForm.reset()
      setSeparateLines(buildSeparateDefaults(unpaid))
    }
  }, [open, unpaid, unifiedForm])

  const validateSeparateLines = (): SeparatePaymentLine[] | null => {
    for (const line of separateLines) {
      const result = separateLineSchema.safeParse(line)
      if (!result.success) {
        setSettleError(
          result.error.issues[0]?.message ?? 'Invalid payment details',
        )
        return null
      }
    }
    setSettleError(null)
    return separateLines
  }

  const handleSettle = async () => {
    setSettleError(null)

    if (unpaid.length === 0) return

    try {
      if (mode === 'unified') {
        const state = unifiedForm.state.values
        const parsed = ledgerPaymentFieldsSchema.safeParse(state)
        if (!parsed.success) {
          setSettleError(
            parsed.error.issues[0]?.message ?? 'Invalid payment details',
          )
          return
        }
        await bulkMutation.mutateAsync({
          bookingId,
          paymentMethod: parsed.data.paymentMethod,
          referenceNumber: parsed.data.referenceNumber,
        })
        unifiedForm.reset()
      } else {
        const validLines = validateSeparateLines()
        if (!validLines) return
        await separateMutation.mutateAsync({
          bookingId,
          items: validLines.map((line) => ({
            id: line.id,
            paymentMethod: line.paymentMethod,
            referenceNumber: line.referenceNumber,
          })),
        })
      }
    } catch (error) {
      setSettleError(
        error instanceof Error ? error.message : 'Failed to settle payments',
      )
    }
  }

  const handleCheckOut = async () => {
    setSettleError(null)
    try {
      await checkOutMutation.mutateAsync({ bookingRef: booking.bookingRef })
      onOpenChange(false)
    } catch (error) {
      setSettleError(
        error instanceof Error ? error.message : 'Failed to check out',
      )
    }
  }

  const ledgerDetails = details ?? {
    total: 0,
    payments: 0,
    remainingBalance: 0,
  }
  const remainingBalance = ledgerDetails.remainingBalance
  const isSettling = bulkMutation.isPending || separateMutation.isPending
  const canCheckOut = remainingBalance === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOutsideScroll className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Check out guest</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Guest:</span>{' '}
              {booking.firstName} {booking.lastName}
            </p>
            <LedgerBalanceSummary details={ledgerDetails} />
          </div>

          <div className="space-y-2">
            <Label>Ledger</Label>
            <BookingLedgerTable
              transactions={transactions}
              bookingStatus={booking.status}
            />
          </div>

          {unpaid.length > 0 ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <Label className="mb-3 block">Settlement</Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as SettlementMode)}
                  className="grid gap-3"
                >
                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value="unified" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        One payment for all unpaid
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Apply a single payment method and reference to every
                        unpaid line ({formatPeso(unifiedTotal)}).
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value="separate" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Separate payment per line
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Record different payment details for each unpaid charge.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {mode === 'unified' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    Total to settle: {formatPeso(unifiedTotal)}
                  </p>
                  <LedgerPaymentFieldsSection form={unifiedForm} />
                </div>
              ) : (
                <SeparatePaymentLines
                  unpaid={unpaid}
                  lines={separateLines}
                  onChange={setSeparateLines}
                />
              )}

              <Button
                type="button"
                onClick={() => void handleSettle()}
                disabled={isSettling}
              >
                {isSettling ? 'Settling…' : 'Settle payments'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              All charges are paid. You can complete check-out.
            </p>
          )}

          {settleError ? (
            <p className="text-sm text-destructive">{settleError}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCheckOut()}
            disabled={!canCheckOut || checkOutMutation.isPending}
          >
            {checkOutMutation.isPending
              ? 'Checking out…'
              : 'Complete check-out'}
          </Button>
        </DialogFooter>
      </DialogOutsideScroll>
    </Dialog>
  )
}
