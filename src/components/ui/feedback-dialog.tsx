import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

type FeedbackDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  message: string | null
  type?: 'success' | 'error'
}

export function FeedbackDialog({
  open,
  onClose,
  title,
  message,
  type = 'success',
}: FeedbackDialogProps) {
  const icon =
    type === 'success' ? (
      <CheckCircle className="size-10 text-green-600" weight="fill" />
    ) : (
      <XCircle className="size-10 text-destructive" weight="fill" />
    )

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <div className="flex flex-col items-center gap-3 pt-2">
          {icon}
          <DialogHeader>
            <DialogTitle
              className={cn(
                'text-center',
                type === 'error' && 'text-destructive',
              )}
            >
              {title}
            </DialogTitle>
          </DialogHeader>
          {message && (
            <p className="text-center text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>
        <DialogFooter className="justify-center sm:justify-center">
          <Button
            variant={type === 'error' ? 'destructive' : 'default'}
            onClick={onClose}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
