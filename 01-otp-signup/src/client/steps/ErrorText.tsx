export function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="error" role="alert">
      {message}
    </p>
  );
}
