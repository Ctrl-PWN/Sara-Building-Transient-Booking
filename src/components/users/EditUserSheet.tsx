import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppForm } from '@/integrations/tanstack-form'
import { userMutations } from '@/lib/users/users.mutations'
import { updateUserSchema } from '@/lib/users/schemas'

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

type UserUpdateData = {
  name?: string
  firstName?: string
  lastName?: string
  role?: string
}

const defaultValues: {
  userId: string
  data: UserUpdateData
} = {
  userId: '',
  data: {},
}

export function EditUserSheet({
  user,
  open,
  onOpenChange,
}: EditUserSheetProps) {
  const queryClient = useQueryClient()
  const updateUser = useMutation(userMutations.update(queryClient))

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: updateUserSchema },
    onSubmit: async ({ value }) => {
      await updateUser.mutateAsync(value)
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (user && open) {
      form.reset()
      form.setFieldValue('userId', user.id)
    }
  }, [user, open])

  if (!user) return null

  const fallbackNameParts = user.name.trim().split(/\s+/)
  const defaultFirstName = user.firstName ?? fallbackNameParts.at(0) ?? ''
  const defaultLastName =
    user.lastName ?? fallbackNameParts.slice(1).join(' ')

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
            <form.AppField name="data">
              {(field) => (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">First name</label>
                    <input
                      type="text"
                      defaultValue={defaultFirstName}
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const nextFirstName = e.target.value
                        const lastName =
                          typeof field.state.value.lastName === 'string'
                            ? field.state.value.lastName
                            : defaultLastName

                        field.handleChange({
                          ...field.state.value,
                          name: `${nextFirstName} ${lastName}`.trim(),
                          firstName: nextFirstName,
                        })
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Last name</label>
                    <input
                      type="text"
                      defaultValue={defaultLastName}
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const nextLastName = e.target.value
                        const firstName =
                          typeof field.state.value.firstName === 'string'
                            ? field.state.value.firstName
                            : defaultFirstName

                        field.handleChange({
                          ...field.state.value,
                          name: `${firstName} ${nextLastName}`.trim(),
                          lastName: nextLastName,
                        })
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      defaultValue={user.role ?? 'STAFF'}
                      onValueChange={(val) => {
                        if (val)
                          field.handleChange({
                            ...field.state.value,
                            role: val,
                          })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
