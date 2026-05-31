import type * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

export { CheckboxField, TextareaField, TextField }
