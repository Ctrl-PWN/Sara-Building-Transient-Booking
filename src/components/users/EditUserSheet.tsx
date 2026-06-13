import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppForm } from '@/integrations/tanstack-form'
import { updateUserSchema } from '@/lib/users/schemas'
import { userMutations } from '@/lib/users/users.mutations'

type UserRow = {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  role?: string
}

type EditUserSheetProps = {
  user: UserRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserSheet({
  user,
  open,
  onOpenChange,
}: EditUserSheetProps) {
  const queryClient = useQueryClient()
  const updateUser = useMutation(userMutations.update(queryClient))

  const form = useAppForm({
    defaultValues: {
      userId: '',
      data: {} as { firstName?: string; lastName?: string },
    },
    validators: { onSubmit: updateUserSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateUser.mutateAsync(value)
        toast.success('User updated successfully')
        onOpenChange(false)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update user',
        )
      }
    },
  })

  useEffect(() => {
    if (user && open) {
      const fallbackNameParts = user.name.trim().split(/\s+/)
      const defaultFirstName = user.firstName ?? fallbackNameParts.at(0) ?? ''
      const defaultLastName =
        user.lastName ?? fallbackNameParts.slice(1).join(' ')

      form.reset()
      form.setFieldValue('userId', user.id)
      form.setFieldValue('data.firstName', defaultFirstName)
      form.setFieldValue('data.lastName', defaultLastName)
    }
  }, [user, open, form.setFieldValue, form.reset])

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit user</SheetTitle>
          <SheetDescription>
            Update account details for {user.name}.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-col gap-4 px-4"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.AppForm>
            <form.AppField name="data.firstName">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0

                return (
                  <Field data-invalid={isInvalid || undefined}>
                    <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value as string}
                      placeholder="Jane"
                      maxLength={15}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid || undefined}
                    />
                    <FieldDescription>
                      Letters and spaces only, max 15 characters
                    </FieldDescription>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )
              }}
            </form.AppField>

            <form.AppField name="data.lastName">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0

                return (
                  <Field data-invalid={isInvalid || undefined}>
                    <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value as string}
                      placeholder="Doe"
                      maxLength={15}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid || undefined}
                    />
                    <FieldDescription>
                      Letters and spaces only, max 15 characters
                    </FieldDescription>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )
              }}
            </form.AppField>

            <div className="flex justify-end gap-2 pt-2">
              <form.ResetButton label="Cancel" />
              <form.SubmitButton label="Save changes" />
            </div>
          </form.AppForm>
        </form>
      </SheetContent>
    </Sheet>
  )
}
