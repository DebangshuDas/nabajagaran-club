type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded border border-dashed border-line bg-white px-6 py-10 text-sm text-muted">
      {message}
    </div>
  );
}
