import type { Icon } from '@phosphor-icons/react'
import { useStore } from '@tanstack/react-form'
import type * as React from 'react'
import { useId, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useFieldContext } from '@/integrations/tanstack-form/form-context'

function useFieldInvalidState() {
  const field = useFieldContext<unknown>()
  const isInvalid =
    field.state.meta.isTouched && field.state.meta.errors.length > 0

  return { field, isInvalid }
}

type NumberFieldProps = {
  label: string
  description?: string
  placeholder?: string
  autoComplete?: string
  min?: number
  max?: number
  step?: number
}

type TextFieldProps = {
  label: string
  description?: string
  placeholder?: string
  autoComplete?: string
  type?: React.ComponentProps<'input'>['type']
  disabled?: boolean
}

function TextField({
  label,
  description,
  placeholder,
  autoComplete,
  type = 'text',
  disabled,
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
        disabled={disabled}
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
  onValueChange?: (value: string) => void
}

function SelectField({
  label,
  description,
  placeholder = 'Select an option',
  options,
  onValueChange,
}: SelectFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string

  const handleChange = (next: string | null) => {
    if (next) {
      field.handleChange(next)
      onValueChange?.(next)
    }
  }

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={handleChange}
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

type RadioOption = {
  value: string
  label: string
}

type RadioGroupFieldProps = {
  label: string
  description?: string
  options: RadioOption[]
}

function RadioGroupField({
  label,
  description,
  options,
}: RadioGroupFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string
  const legendId = useId()

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldSet className="gap-3 border-0 p-0">
        <FieldLegend id={legendId} variant="label">
          {label}
        </FieldLegend>
        <RadioGroup
          aria-labelledby={legendId}
          name={field.name}
          value={value}
          onValueChange={field.handleChange}
          className="flex flex-row flex-wrap gap-4"
          data-slot="radio-group"
        >
          {options.map((option) => (
            <label
              key={option.value}
              htmlFor={`${field.name}-${option.value}`}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <RadioGroupItem
                id={`${field.name}-${option.value}`}
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </FieldSet>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

export type RadioChoiceCardOption = {
  value: string
  title: string
  description?: string
  icon?: Icon
}

type RadioChoiceCardFieldProps = {
  label: string
  description?: string
  options: RadioChoiceCardOption[]
  onValueChange?: (value: string) => void
}

function RadioChoiceCardField({
  label,
  description,
  options,
  onValueChange,
}: RadioChoiceCardFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as string
  const legendId = useId()

  const handleChange = (next: string) => {
    field.handleChange(next)
    onValueChange?.(next)
  }

  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldSet className="gap-3 border-0 p-0">
        <FieldLegend id={legendId} variant="label">
          {label}
        </FieldLegend>
        <RadioGroup
          aria-labelledby={legendId}
          name={field.name}
          value={value}
          onValueChange={handleChange}
          className="flex flex-col gap-2"
          data-slot="radio-group"
        >
          {options.map((option) => (
            <FieldLabel
              key={option.value}
              htmlFor={`${field.name}-${option.value}`}
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    {option.icon ? (
                      <option.icon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                    {option.title}
                  </FieldTitle>
                  {option.description ? (
                    <FieldDescription>{option.description}</FieldDescription>
                  ) : null}
                </FieldContent>
                <RadioGroupItem
                  value={option.value}
                  id={`${field.name}-${option.value}`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

type DateRangeFieldProps = {
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
// form field for numbers
function NumberField({
  label,
  description,
  placeholder,
  autoComplete,
}: NumberFieldProps) {
  const { field, isInvalid } = useFieldInvalidState()
  const value = field.state.value as number
  return (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="number"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.valueAsNumber)}
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

function DateRangeField({
  endFieldName,
  label,
  startLabel = 'Check-in',
  endLabel = 'Check-out',
  description,
  minDate,
  disabledDates,
}: DateRangeFieldProps) {
  const field = useFieldContext<string>()
  const form = field.form

  const { submissionAttempts, endValue, endErrors } = useStore(
    form.store,
    (state) => ({
      submissionAttempts: state.submissionAttempts,
      endValue: (state.values as Record<string, string>)[endFieldName] ?? '',
      endErrors: state.fieldMeta[endFieldName]?.errors ?? [],
    }),
  )

  const startIsInvalid =
    (field.state.meta.isTouched || submissionAttempts > 0) &&
    field.state.meta.errors.length > 0
  const endIsInvalid = submissionAttempts > 0 && endErrors.length > 0
  const isInvalid = startIsInvalid || endIsInvalid

  const startDate = field.state.value ? new Date(field.state.value) : null
  const endDate = endValue ? new Date(endValue) : null

  const [month, setMonth] = useState<Date>(() => startDate ?? new Date())

  const handleRangeChange = (start: Date | null, end: Date | null) => {
    const nextStart = toIsoDate(start)
    const nextEnd = toIsoDate(end)
    if (nextStart) field.handleChange(nextStart)
    form.setFieldValue(
      endFieldName as (typeof form.setFieldValue)['0'],
      nextEnd,
    )
    field.handleBlur()
    if (start) setMonth(start)
  }

  return (
    <Field data-invalid={isInvalid || undefined}>
      <div className="flex items-baseline justify-between">
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
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
      {startIsInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
      {endIsInvalid ? <FieldError errors={endErrors} /> : null}
    </Field>
  )
}

export {
  CheckboxField,
  DateRangeField,
  NumberField,
  RadioChoiceCardField,
  RadioGroupField,
  SelectField,
  TextareaField,
  TextField,
}
