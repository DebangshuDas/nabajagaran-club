type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading data..." }: LoadingStateProps) {
  return (
    <div className="rounded border border-line bg-white px-6 py-10 text-center text-sm text-muted">
      {message}
    </div>
  );
}
