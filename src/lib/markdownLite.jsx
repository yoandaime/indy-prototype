// Minimal markdown-ish renderer for INDY Assistant chat replies — supports
// paragraphs, **bold**, "- " bullet lists and "1. " numbered lists. Not a
// general-purpose markdown parser; just enough for the mock chat content.

function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    )
  )
}

export function MarkdownLite({ text }) {
  const blocks = text.trim().split(/\n\n+/)

  return blocks.map((block, bi) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    const isBulletList = lines.length > 0 && lines.every((l) => l.startsWith("- "))
    const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s/.test(l))

    if (isBulletList) {
      return (
        <ul key={bi} className="list-disc space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^- /, ""), `${bi}-${li}`)}</li>
          ))}
        </ul>
      )
    }

    if (isNumberedList) {
      return (
        <ol key={bi} className="list-decimal space-y-1 pl-5">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\d+\.\s/, ""), `${bi}-${li}`)}</li>
          ))}
        </ol>
      )
    }

    return (
      <p key={bi} className="leading-6">
        {renderInline(block, `${bi}`)}
      </p>
    )
  })
}
