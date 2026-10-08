export default function SummaryCard({ title, children, className = "" }) {
  return (
    <div className={`flex flex-col rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ${className}`}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  )
}
