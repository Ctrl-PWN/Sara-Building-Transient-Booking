import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'
import { useRef } from 'react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function DialogRoot(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger {...props} />
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal {...props} />
}

function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/40 data-ending-style:fade-out data-starting-style:fade-in data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:duration-150 data-[starting-style]:duration-150',
        className,
      )}
      {...props}
    />
  )
}

function DialogPopup({ className, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg data-[ending-style]:fade-out data-[starting-style]:fade-in data-[ending-style]:zoom-out data-[starting-style]:zoom-in data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:duration-150 data-[starting-style]:duration-150',
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close {...props} />
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & { className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background p-6 shadow-lg data-[ending-style]:fade-out data-[starting-style]:fade-in data-[ending-style]:zoom-out data-[starting-style]:zoom-in data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:duration-150 data-[starting-style]:duration-150',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogOutsideScroll({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & { className?: string }) {
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop className="supports-[-webkit-touch-callout:none]:absolute" />
      <DialogPrimitive.Viewport className="group/dialog fixed inset-0 z-50">
        <ScrollAreaPrimitive.Root
          style={{ position: undefined }}
          className="h-full overscroll-contain group-data-[ending-style]/dialog:pointer-events-none"
        >
          <ScrollAreaPrimitive.Viewport className="h-full overscroll-contain group-data-[ending-style]/dialog:pointer-events-none">
            <ScrollAreaPrimitive.Content className="flex min-h-full items-center justify-center">
              <DialogPrimitive.Popup
                ref={popupRef}
                initialFocus={popupRef}
                className={cn(
                  'relative mx-auto my-16 w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-lg outline-0 data-[ending-style]:fade-out data-[starting-style]:fade-in data-[ending-style]:zoom-out data-[starting-style]:zoom-in data-[ending-style]:animate-out data-[starting-style]:animate-in data-[ending-style]:duration-150 data-[starting-style]:duration-150',
                  className,
                )}
                {...props}
              >
                {children}
              </DialogPrimitive.Popup>
            </ScrollAreaPrimitive.Content>
          </ScrollAreaPrimitive.Viewport>
          <ScrollAreaPrimitive.Scrollbar className="pointer-events-none absolute m-1.5 flex w-1 justify-center rounded-2xl opacity-0 transition-opacity duration-250 data-[scrolling]:pointer-events-auto data-[scrolling]:opacity-100 data-[scrolling]:duration-75 data-[scrolling]:delay-0 hover:pointer-events-auto hover:opacity-100 hover:duration-75 hover:delay-0 md:w-1.75 group-data-[ending-style]/dialog:opacity-0 group-data-[ending-style]/dialog:duration-300">
            <ScrollAreaPrimitive.Thumb className="w-full rounded-[inherit] bg-border before:absolute before:top-1/2 before:left-1/2 before:h-[calc(100%+1rem)] before:w-[calc(100%+1rem)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
          </ScrollAreaPrimitive.Scrollbar>
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogContent,
  DialogOutsideScroll,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
