import { useState } from 'react'
import type * as React from 'react'
import { useStore } from '@tanstack/react-form'

import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFieldContext } from '@/integrations/tanstack-form/form-context'

function useFieldInvalidState() {
  const field = useFieldContext<unknown>()
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0

  return { field, isInvalid }
}

type TextFieldProps = {
  label: string
  description?: string
  placeholder?: string
  autoComplete?: string
  type?: React.ComponentProps<'input'>['type']
}

function TextField({
  label,
  description,
  placeholder,
  autoComplete,
  type = 'text',
}: TextFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={description ? `${field.name}-description` : undefined}
      />
      {description ? (
        <p
          id={`${field.name}-description`}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

type TextareaFieldProps = {
  label: string
  description?: string
  placeholder?: string
  rows?: number
}

function TextareaField({
  label,
  description,
  placeholder,
  rows = 4,
}: TextareaFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={description ? `${field.name}-description` : undefined}
      />
      {description ? (
        <p
          id={`${field.name}-description`}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

type CheckboxFieldProps = {
  label: string
  description?: string
}

function CheckboxField({ label, description }: CheckboxFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const checked = field.state.value as boolean

  return (
    <Field data-invalid={isInvalid || undefined} orientation="horizontal">
      <Checkbox
        id={field.name}
        name={field.name}
        checked={checked}
        onBlur={field.handleBlur}
        onCheckedChange={(value) => field.handleChange(value)}
        aria-invalid={isInvalid || undefined}
      />
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={field.name} className="font-normal">
          {label}
        </FieldLabel>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
      </div>
    </Field>
  )
}

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectFieldProps = {
  label: string
  description?: string
  placeholder?: string
  options: SelectOption[]
}

function SelectField({
  label,
  description,
  placeholder = 'Select an option',
  options,
}: SelectFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={field.handleChange}
        items={options.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: option.disabled,
        }))}
      >
        <SelectTrigger
          id={field.name}
          aria-invalid={isInvalid || undefined}
          aria-describedby={
            description ? `${field.name}-description` : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? (
        <p
          id={`${field.name}-description`}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

// We accept any form whose store can be read by useStore. The actual form
// type's setFieldValue is generic over the form's field-name union, so we use
// a permissive `form: any` on the prop to avoid re-typing the entire form
// schema here.
type DateRangeFieldProps = {
  form: any
  startFieldName: string
  endFieldName: string
  label: string
  startLabel?: string
  endLabel?: string
  description?: string
  minDate?: Date
  disabledDates?: (date: Date) => boolean
}

function formatRangeLabel(start: Date | null, end: Date | null) {
  if (!start && !end) return 'Select dates'
  if (start && !end) {
    return start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  if (start && end) {
    const sameYear = start.getFullYear() === end.getFullYear()
    const startStr = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    const endStr = end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return sameYear
      ? `${startStr} → ${endStr}`
      : `${startStr}, ${start.getFullYear()} → ${endStr}`
  }
  return 'Select dates'
}

function toIsoDate(date: Date | null) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function DateRangeField({
  form,
  startFieldName,
  endFieldName,
  label,
  startLabel = 'Check-in',
  endLabel = 'Check-out',
  description,
  minDate,
  disabledDates,
}: DateRangeFieldProps) {
  const { checkInDate, checkOutDate } = useStore(
    form.store,
    (state: unknown) => {
      const values = (state as { values: Record<string, unknown> }).values
      const checkIn = values[startFieldName] as string | undefined
      const checkOut = values[endFieldName] as string | undefined
      return {
        checkInDate: checkIn ?? '',
        checkOutDate: checkOut ?? '',
      }
    },
  )

  const startDate = checkInDate ? new Date(checkInDate) : null
  const endDate = checkOutDate ? new Date(checkOutDate) : null

  const [month, setMonth] = useState<Date>(() => startDate ?? new Date())

  const handleRangeChange = (start: Date | null, end: Date | null) => {
    const nextStart = toIsoDate(start)
    const nextEnd = toIsoDate(end)
    if (nextStart) form.setFieldValue(startFieldName, nextStart)
    form.setFieldValue(endFieldName, nextEnd)
    if (start) setMonth(start)
  }

  return (
    <Field>
      <div className="flex items-baseline justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-xs text-muted-foreground">
          {formatRangeLabel(startDate, endDate)}
        </span>
      </div>
      <div className="rounded-md border border-input bg-transparent p-1">
        <Calendar
          month={month}
          onMonthChange={setMonth}
          rangeStart={startDate}
          rangeEnd={endDate}
          onRangeChange={handleRangeChange}
          minDate={minDate}
          disabledDates={disabledDates}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{startLabel}:</span>{' '}
          {startDate ? startDate.toLocaleDateString() : 'Not selected'}
        </span>
        <span>
          <span className="font-medium text-foreground">{endLabel}:</span>{' '}
          {endDate ? endDate.toLocaleDateString() : 'Not selected'}
        </span>
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </Field>
  )
}

export { CheckboxField, TextField, TextareaField, SelectField, DateRangeField }
