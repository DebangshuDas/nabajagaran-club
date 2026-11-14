type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-6 py-10 text-sm text-red-700">
      {message}
    </div>
  );
}
