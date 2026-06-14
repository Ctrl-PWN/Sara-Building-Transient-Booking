import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type z from 'zod'
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

  const defaultValues: z.input<typeof updateUserSchema> = {
    userId: '',
    firstName: '',
    lastName: '',
  }

  const form = useAppForm({
    defaultValues,
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
      form.setFieldValue('firstName', defaultFirstName)
      form.setFieldValue('lastName', defaultLastName)
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
            <form.AppField name="firstName">
              {(field) => (
                <field.TextField
                  label="First name"
                  placeholder="Jane"
                  description="Letters and spaces only, max 15 characters"
                  maxLength={15}
                />
              )}
            </form.AppField>

            <form.AppField name="lastName">
              {(field) => (
                <field.TextField
                  label="Last name"
                  placeholder="Doe"
                  description="Letters and spaces only, max 15 characters"
                  maxLength={15}
                />
              )}
            </form.AppField>

            <div className="flex justify-end gap-2 pt-2">
              <form.SubmitButton label="Save changes" />
            </div>
          </form.AppForm>
        </form>
      </SheetContent>
    </Sheet>
  )
}
