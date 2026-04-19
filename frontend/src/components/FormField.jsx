export default function FormField({ label, required, error, children, className }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      <label
        className={`text-[11px] font-bold tracking-[0.1em] uppercase font-mono ${
          error ? 'text-ui-danger' : 'text-ui-muted'
        }`}
      >
        {label}
        {required && <span className="text-ui-danger"> *</span>}
      </label>

      {children}

      {error && (
        <span className="text-[12px] text-ui-danger font-medium">
          {error}
        </span>
      )}
    </div>
  );
}