// Lightweight regex-based SQL syntax highlighter for the Rules Catalog's
// query template preview — mirrors the JS highlighter pattern used for the
// Kafka consumer script in CustomerDataOpsPage.jsx, adapted to the ClickHouse
// dialect used by ruleCatalog.js templates.

const SQL_KEYWORDS = new Set([
  "with",
  "select",
  "from",
  "where",
  "group",
  "by",
  "as",
  "and",
  "or",
  "left",
  "join",
  "on",
  "distinct",
  "interval",
  "day",
  "between",
  "is",
  "not",
  "null",
])

const SQL_FUNCTIONS = new Set([
  "count",
  "countif",
  "countdistinct",
  "round",
  "if",
  "todate",
  "datediff",
  "max",
  "avg",
  "abs",
  "trim",
  "match",
  "now",
])

const SQL_TOKEN_REGEX =
  /(--.*$)|('(?:[^'\\]|\\.)*')|(\{[a-z_]+\})|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)/gim

const SQL_TOKEN_CLASS = {
  comment: "text-neutral-500",
  string: "text-emerald-700",
  variable: "text-fuchsia-700",
  number: "text-amber-700",
  keyword: "text-blue-700",
  function: "text-violet-700",
}

export default function SqlCodeBlock({ code }) {
  return code.split("\n").map((line, i) => {
    const nodes = []
    let lastIndex = 0
    let match
    let key = 0
    SQL_TOKEN_REGEX.lastIndex = 0
    while ((match = SQL_TOKEN_REGEX.exec(line)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>)
      }
      const [text, comment, str, variable, num, ident] = match
      const lower = ident?.toLowerCase()
      const type = comment
        ? "comment"
        : str
          ? "string"
          : variable
            ? "variable"
            : num
              ? "number"
              : SQL_KEYWORDS.has(lower)
                ? "keyword"
                : SQL_FUNCTIONS.has(lower)
                  ? "function"
                  : null
      nodes.push(
        type ? (
          <span key={key++} className={SQL_TOKEN_CLASS[type]}>
            {text}
          </span>
        ) : (
          <span key={key++}>{text}</span>
        )
      )
      lastIndex = SQL_TOKEN_REGEX.lastIndex
    }
    if (lastIndex < line.length) {
      nodes.push(<span key={key++}>{line.slice(lastIndex)}</span>)
    }
    return <div key={i}>{nodes.length > 0 ? nodes : " "}</div>
  })
}
