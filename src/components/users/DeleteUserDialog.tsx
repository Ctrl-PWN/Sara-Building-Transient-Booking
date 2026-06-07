import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { userMutations } from '@/lib/users/users.mutations'

type UserRow = {
  id: string
  name: string
}

type DeleteUserDialogProps = {
  user: UserRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const queryClient = useQueryClient()
  const deleteUser = useMutation(userMutations.delete(queryClient))

  async function handleDelete() {
    if (!user) return
    await deleteUser.mutateAsync({ userId: user.id })
    onOpenChange(false)
  }

  if (!user) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 data-ending-style:opacity-0 data-starting-style:opacity-0">
          <DialogPrimitive.Title className="text-base font-medium text-foreground">
            Delete user
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">{user.name}</span>?
            This action cannot be undone.
          </DialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-2">
            <DialogPrimitive.Close render={<Button variant="outline" />}>
              Cancel
            </DialogPrimitive.Close>
            <Button
              variant="destructive"
              onClick={() => {
                void handleDelete()
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
