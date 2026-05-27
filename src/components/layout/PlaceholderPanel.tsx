type PlaceholderPanelProps = {
  title?: string
  description?: string
}

export function PlaceholderPanel({
  title = 'Coming soon',
  description = 'This feature is under development and will be implemented in a follow-up task.',
}: PlaceholderPanelProps) {
  return (
    <div className="block-card flex flex-col gap-2 p-6">
      <p className="font-body text-sm font-medium text-foreground m-0">
        {title}
      </p>
      <p className="font-body text-sm text-muted-foreground m-0">
        {description}
      </p>
    </div>
  )
}
