import { useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  Terminal,
  Copy,
  Check,
  Pencil,
  KeyRound,
  Trash2,
  Info,
  X,
  Loader2,
  Users,
  Rss,
  LayoutGrid,
  LayoutDashboard,
  Table2,
  Clock,
  ChevronDown,
  History,
} from "lucide-react"
import {
  APPLICATIONS,
  CATEGORIES,
  HOST_OPTIONS,
  LAYER_ID_OPTIONS,
  SUBSCRIPTION_TABLES,
  INITIAL_SUBSCRIBED_IDS,
  DQ_DIMENSIONS,
  getTableDimensionMetric,
} from "@/data/subscriptionTables"
import {
  ADMIN_USERS,
  getAdminOverviewStats,
  getUserSubscribedTables,
  getUserEmbedKey,
  getUserKeyGeneratedMinutesAgo,
  formatRelativeTime,
  getTableSubscribers,
  getPlatformActivityStats,
  getAllSubscriptionActivity,
  getAllTokenActivity,
  getAllApiActivity,
  formatAbsoluteDateTime,
} from "@/data/subscriptionAdminData"
import PlatformActivitySummary from "@/components/subscription/PlatformActivitySummary"
import UserDetailView from "@/components/subscription/UserDetailView"
import DimensionBarChart from "@/components/subscription/DimensionBarChart"
import { TagRow, SubscriptionActivityRow, TokenActivityRow } from "@/components/subscription/shared"
import { TAILWIND_SHADES } from "@/lib/chartColors"
import { ticketAuthorInitials, ticketAuthorAvatarUrl } from "@/data/ticketingData"
import indyLogo from "@/assets/indy-logo.svg"
import extensionButtonLogo from "@/assets/Icon + Text Logo.png"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { useAccess } from "@/context/AccessContext"

const EMBED_BASE_URL =
  "https://indy.example.com/content-mangement/embed/dashboard/tables"

const EMBED_KEY_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

function isValidWebhookUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function generateEmbedKey() {
  let key = ""
  for (let i = 0; i < 24; i++) {
    key += EMBED_KEY_CHARS[Math.floor(Math.random() * EMBED_KEY_CHARS.length)]
  }
  return key
}

// Representative dimension used for the per-table integration payloads below
// (API/Kafka sections show one current score per table, not all 5 dimensions).
const INTEGRATION_DIMENSION_INDEX = 0

function statusForTier(tier) {
  if (tier === "poor") return "critical"
  if (tier === "average") return "warning"
  return "healthy"
}

function buildTablePayload(table, { withTopic = false } = {}) {
  const metric = getTableDimensionMetric(table, INTEGRATION_DIMENSION_INDEX)
  const base = {
    table: table.name,
    dimension: DQ_DIMENSIONS[INTEGRATION_DIMENSION_INDEX].toLowerCase(),
    score: metric.score,
    status: statusForTier(metric.tier),
    message: metric.insight,
  }
  return withTopic ? { topic: `dq-change-event.${table.name}`, ...base } : base
}

function buildKafkaConsumerScript(table, embedKey) {
  const topic = `dq-change-event.${table.name}`
  const password = embedKey || "<YourEmbedCode>"

  return `const { Kafka } = require('kafkajs');

// 1. Initialize the Kafka client with credentials
const kafka = new Kafka({
  clientId: 'my-simple-consumer',
  brokers: ['192.0.2.23:9092'],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: '2331234',
    password: '${password}'
  },
});

// 2. Create the consumer instance
const consumer = kafka.consumer({ groupId: 'my-simple-group' });

// 3. Connect, subscribe, and listen immediately using a top-level async IIFE
(async () => {
  console.log('Connecting to Kafka...');
  await consumer.connect();

  console.log('Subscribing to topic...');
  await consumer.subscribe({ topic: '${topic}', fromBeginning: true });

  console.log('Consumer is running and listening for messages...');
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(\`Received message: \${message.value.toString()}\`);
    },
  });
})().catch(err => {
  console.error('Error running consumer:', err);
});`
}

function SearchField({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex h-8 min-h-8 w-full items-center gap-1.5 rounded-[8px] border bg-white px-2 py-[5.5px] shadow-xs has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-auto min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
      />
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
    </div>
  )
}

function SubscribedTableRow({ table, justSaved }) {
  // Freshly-saved rows arrive with a highlighted background that fades back
  // to transparent, layered on top of the entrance animation below — a
  // "moved into this list" cue rather than an instant, silent appearance.
  const [highlighted, setHighlighted] = useState(justSaved)

  useEffect(() => {
    if (!justSaved) return
    const timeout = setTimeout(() => setHighlighted(false), 500)
    return () => clearTimeout(timeout)
  }, [justSaved])

  return (
    <div
      className={cn(
        "-mx-1.5 flex w-full items-center rounded-md border-b px-1.5 pb-2.5 transition-colors duration-700",
        justSaved && "animate-in fade-in slide-in-from-top-2 duration-500",
        highlighted ? "bg-primary/10" : "bg-transparent"
      )}
    >
      <div className="flex flex-col items-start gap-0.5">
        <p className="text-[14px] leading-tight font-medium text-foreground">{table.name}</p>
        <TagRow
          app={table.app}
          category={table.category}
          schema={table.schema}
          granularity={table.granularity}
        />
      </div>
    </div>
  )
}

function SubscribedBadge() {
  return (
    <span className="flex shrink-0 animate-in items-center gap-1 rounded-[8px] bg-[#eff6ff] px-2 py-0.5 zoom-in-90 fade-in duration-300">
      <Check className="size-3 shrink-0 text-[#1d4ed8]" />
      <span className="text-xs leading-4 font-semibold text-[#1d4ed8]">
        Subscribed
      </span>
    </span>
  )
}

function CellSelection({ checked, indeterminate, onCheckedChange, isEditMode }) {
  if (!isEditMode) return null

  return (
    <div className="flex h-[22px] w-4 shrink-0 items-center justify-center">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={onCheckedChange}
        className="size-4"
      />
    </div>
  )
}

function SelectAllRow({
  checked,
  indeterminate,
  onChange,
  canBulkSubscribe,
  canBulkUnsubscribe,
  onBulkSubscribe,
  onBulkUnsubscribe,
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <CellSelection checked={checked} indeterminate={indeterminate} onCheckedChange={onChange} isEditMode />
        <p className="text-sm font-medium text-foreground">Select all</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={!canBulkUnsubscribe}
          onClick={onBulkUnsubscribe}
        >
          Unsubscribe
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={!canBulkSubscribe}
          onClick={onBulkSubscribe}
        >
          Subscribe
        </Button>
      </div>
    </div>
  )
}

function SubscriptionRow({ table, isSubscribed, isEditMode, isChecked, onToggleChecked }) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 border-b border-[#e5e5e5] pb-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CellSelection
          checked={isChecked}
          onCheckedChange={() => onToggleChecked(table.id)}
          isEditMode={isEditMode}
        />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <p
            className="w-full truncate text-[14px] leading-tight font-medium text-[#0a0a0a]"
            title={table.name}
          >
            {table.name}
          </p>
          <TagRow
            app={table.app}
            category={table.category}
            schema={table.schema}
            granularity={table.granularity}
          />
        </div>
      </div>
      {isSubscribed && <SubscribedBadge />}
    </div>
  )
}

function DimensionTabs({ activeIndex, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-4 overflow-x-auto border-b px-3">
      {DQ_DIMENSIONS.map((dimension, index) => (
        <button
          key={dimension}
          type="button"
          onClick={() => onChange(index)}
          className={`shrink-0 border-b-2 pt-2.5 pb-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            index === activeIndex
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {dimension}
        </button>
      ))}
    </div>
  )
}

function DimensionMetricRow({ table, dimensionIndex }) {
  const { score, label, dot, text, bg, icon: TierIcon, insight } = getTableDimensionMetric(
    table,
    dimensionIndex
  )

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-foreground">{table.name}</p>
        <span className="flex items-center gap-1">
          <span className={`size-1.5 rounded-full ${dot}`} />
          <span className={`text-xs ${text}`} title={label}>
            {score}%
          </span>
        </span>
      </div>
      <div className={`flex items-start gap-1.5 rounded-lg p-1.5 ${bg}`}>
        <TierIcon className={`mt-0.5 size-3 shrink-0 ${text}`} />
        <p className={`text-xs ${text}`}>{insight}</p>
      </div>
    </div>
  )
}

function EmbedWidgetPreview({ tables }) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeDimension, setActiveDimension] = useState(0)

  return (
    <div className="flex w-full flex-col items-end gap-4">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10"
      >
        <img src={extensionButtonLogo} alt="INDY" className="size-8 object-contain" />
        <span className="sr-only">Toggle widget preview</span>
      </button>

      {isOpen && (
        <div className="flex h-[500px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl border bg-white shadow-lg">
          <div className="flex shrink-0 items-center justify-between border-b p-3">
            <img src={indyLogo} alt="INDY" className="h-5 w-auto" />
            <X className="size-4 text-muted-foreground" />
          </div>

          <DimensionTabs activeIndex={activeDimension} onChange={setActiveDimension} />

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
            {tables.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No subscribed tables yet.
              </p>
            ) : (
              tables.map((table) => (
                <DimensionMetricRow
                  key={table.id}
                  table={table}
                  dimensionIndex={activeDimension}
                />
              ))
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-neutral-50 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Avatar size="sm">
                <AvatarFallback>AN</AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground">Antonio Nusa</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span className="flex items-center gap-1">
                <Info className="size-3" />
                Last update: 30 Jul 2026
              </span>
              <span className="h-2.5 w-px bg-neutral-400" />
              <span className="underline">Go to INDY</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JsonField({ label, value, type = "string", isLast = false }) {
  return (
    <div className="pl-4">
      <span className="text-blue-700">"{label}"</span>
      <span className="text-neutral-500">: </span>
      {type === "number" ? (
        <span className="text-amber-700">{value}</span>
      ) : (
        <span className="text-emerald-700">"{value}"</span>
      )}
      {!isLast && <span className="text-neutral-500">,</span>}
    </div>
  )
}

function EmbedAttribute({ name, value }) {
  return (
    <div className="pl-4">
      <span className="text-blue-700">{name}</span>
      <span className="text-neutral-500">=</span>
      <span className="text-emerald-700">"{value}"</span>
    </div>
  )
}

function EmbedSnippetPreview({ embedUrl }) {
  return (
    <div>
      <span className="text-neutral-500">{"<"}</span>
      <span className="text-neutral-700">iframe</span>
      <EmbedAttribute name="src" value={embedUrl} />
      <EmbedAttribute name="width" value="100%" />
      <EmbedAttribute name="height" value="480" />
      <EmbedAttribute name="frameborder" value="0" />
      <div>
        <span className="text-neutral-500">{"></"}</span>
        <span className="text-neutral-700">iframe</span>
        <span className="text-neutral-500">{">"}</span>
      </div>
    </div>
  )
}

function TablePayloadBlock({ table, withTopic }) {
  const payload = buildTablePayload(table, { withTopic })

  return (
    <div>
      <div className="text-neutral-500">{`// ${table.name}`}</div>
      <div className="text-neutral-600">{"{"}</div>
      {withTopic && <JsonField label="topic" value={payload.topic} />}
      <JsonField label="table" value={payload.table} />
      <JsonField label="dimension" value={payload.dimension} />
      <JsonField label="score" value={payload.score} type="number" />
      <JsonField label="status" value={payload.status} />
      <JsonField label="message" value={payload.message} isLast />
      <div className="text-neutral-600">{"}"}</div>
    </div>
  )
}

function IntegrationSection({ description, tables, withTopic }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const payload = tables.map((table) => buildTablePayload(table, { withTopic }))
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{description}</p>

      <div className="relative min-w-0">
        <div className="max-h-[220px] min-w-0 overflow-auto rounded-lg border bg-muted p-3 pr-28 font-mono text-xs leading-5 text-foreground">
          {tables.length === 0 ? (
            <span className="text-neutral-500">No subscribed tables yet.</span>
          ) : (
            tables.map((table, i) => (
              <div key={table.id} className={i > 0 ? "mt-4" : undefined}>
                <TablePayloadBlock table={table} withTopic={withTopic} />
              </div>
            ))
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 gap-1"
          disabled={tables.length === 0}
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy
        </Button>
      </div>
    </div>
  )
}

const JS_KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "require",
  "async",
  "await",
  "function",
  "return",
  "new",
  "catch",
  "true",
  "false",
])

const JS_TOKEN_REGEX =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d+\b)|([A-Za-z_$][\w$]*)/gm

const JS_TOKEN_CLASS = {
  comment: "text-neutral-500",
  string: "text-emerald-700",
  number: "text-amber-700",
  keyword: "text-blue-700",
}

function JsCodeBlock({ code }) {
  return code.split("\n").map((line, i) => {
    const nodes = []
    let lastIndex = 0
    let match
    let key = 0
    JS_TOKEN_REGEX.lastIndex = 0
    while ((match = JS_TOKEN_REGEX.exec(line)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>)
      }
      const [text, comment, str, num, ident] = match
      const type = comment ? "comment" : str ? "string" : num ? "number" : JS_KEYWORDS.has(ident) ? "keyword" : null
      nodes.push(
        type ? (
          <span key={key++} className={JS_TOKEN_CLASS[type]}>
            {text}
          </span>
        ) : (
          <span key={key++}>{text}</span>
        )
      )
      lastIndex = JS_TOKEN_REGEX.lastIndex
    }
    if (lastIndex < line.length) {
      nodes.push(<span key={key++}>{line.slice(lastIndex)}</span>)
    }
    return <div key={i}>{nodes.length > 0 ? nodes : " "}</div>
  })
}

function KafkaScriptSection({ description, tables, embedKey }) {
  const [copied, setCopied] = useState(false)

  const script =
    tables.length > 0
      ? tables
          .map((table) => `// ${table.name}\n${buildKafkaConsumerScript(table, embedKey)}`)
          .join("\n\n")
      : null

  const handleCopy = async () => {
    if (!script) return
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{description}</p>

      <div className="relative min-w-0">
        <pre className="max-h-[220px] min-w-0 overflow-auto rounded-lg border bg-muted p-3 pr-28 font-mono text-xs leading-5 whitespace-pre text-foreground">
          {script ? <JsCodeBlock code={script} /> : <span className="text-neutral-500">No subscribed tables yet.</span>}
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 gap-1"
          disabled={!script}
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy
        </Button>
      </div>
    </div>
  )
}

function GetEmbedCodeDialog({ subscribedTables }) {
  const [embedKey, setEmbedKey] = useState(null)
  const [copied, setCopied] = useState(false)
  const [pendingAction, setPendingAction] = useState(null) // null | "generate" | "revoke"
  // The key is bound to an IP address (required); the webhook is optional.
  const [ipAddress, setIpAddress] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")

  const trimmedWebhook = webhookUrl.trim()
  const webhookInvalid = trimmedWebhook !== "" && !isValidWebhookUrl(trimmedWebhook)
  const canGenerate = ipAddress.trim() !== "" && !webhookInvalid

  const embedUrl = embedKey ? `${EMBED_BASE_URL}?embedKey=${embedKey}` : null
  const embedSnippet = embedUrl
    ? `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="480"\n  frameborder="0"\n></iframe>`
    : null

  // Stands in for the round-trip to the backend that will own key issuance/revocation.
  const simulateRequest = () => new Promise((resolve) => setTimeout(resolve, 800))

  const handleGenerate = async () => {
    if (!canGenerate) return
    setPendingAction("generate")
    await simulateRequest()
    // Only one embed key per user — generating a new one replaces the old one.
    setEmbedKey(generateEmbedKey())
    setCopied(false)
    setPendingAction(null)
  }

  const handleRevoke = async () => {
    setPendingAction("revoke")
    await simulateRequest()
    setEmbedKey(null)
    setCopied(false)
    setPendingAction(null)
  }

  const handleCopy = async () => {
    if (!embedSnippet) return
    await navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="h-8 min-h-8 w-auto gap-1.5 rounded-[8px] border-neutral-300 bg-white/10 px-3 py-1.5 text-sm font-medium text-[#0a0a0a] shadow-xs"
          >
            <Terminal className="size-3.5 text-[#0a0a0a]" />
            Get embed code
          </Button>
        }
      />
      <DialogContent
        showCloseButton={false}
        className="max-h-[85vh] w-fit max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-border bg-white p-0 shadow-sm ring-0 sm:max-w-[1100px]"
      >
        <div className="flex max-h-[85vh] items-stretch">
          <div className="flex w-[560px] shrink-0 flex-col gap-4 overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Get embed code</DialogTitle>
              <DialogDescription>
                Generate an embed link to share your subscribed tables. Only
                one embed key can be active per user — generating a new one
                revokes the previous one.
              </DialogDescription>
            </DialogHeader>

            {embedKey ? (
              <dl className="divide-y rounded-lg border text-xs">
                <div className="flex items-stretch">
                  <dt className="w-28 shrink-0 border-r bg-muted/40 px-3 py-1.5 text-muted-foreground">IP address</dt>
                  <dd className="min-w-0 flex-1 px-3 py-1.5 break-all font-medium text-foreground">
                    {ipAddress.trim()}
                  </dd>
                </div>
                <div className="flex items-stretch">
                  <dt className="w-28 shrink-0 border-r bg-muted/40 px-3 py-1.5 text-muted-foreground">Webhook URL</dt>
                  <dd className="min-w-0 flex-1 px-3 py-1.5 break-all font-medium text-foreground">
                    {trimmedWebhook || "-"}
                  </dd>
                </div>
              </dl>
            ) : (
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="embed-ip-address">
                  IP address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="embed-ip-address"
                  placeholder="e.g. 192.0.2.23"
                  value={ipAddress}
                  disabled={pendingAction !== null}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="embed-webhook-url">Webhook URL</Label>
                <Input
                  id="embed-webhook-url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={webhookUrl}
                  disabled={pendingAction !== null}
                  aria-invalid={webhookInvalid}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                {webhookInvalid && (
                  <p className="text-xs text-destructive">
                    Enter a valid URL starting with http:// or https://
                  </p>
                )}
              </div>
            </div>
            )}

            {embedSnippet ? (
              <>
                <div className="relative min-w-0">
                  <pre className="max-h-64 min-w-0 overflow-auto rounded-lg border bg-muted p-3 pr-10 font-mono text-xs leading-5 text-foreground">
                    <EmbedSnippetPreview embedUrl={embedUrl} />
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 gap-1"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    Copy
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendingAction !== null || !canGenerate}
                    onClick={handleGenerate}
                  >
                    {pendingAction === "generate" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="size-3.5" />
                    )}
                    {pendingAction === "generate" ? "Regenerating..." : "Regenerate key"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pendingAction !== null}
                    onClick={handleRevoke}
                  >
                    {pendingAction === "revoke" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    {pendingAction === "revoke" ? "Revoking..." : "Revoke key"}
                  </Button>
                </div>

                <Accordion multiple className="gap-2 rounded-lg border px-3">
                  <AccordionItem value="active">
                    <AccordionTrigger>Active — API / function</AccordionTrigger>
                    <AccordionContent>
                      <IntegrationSection
                        description="Widget calls INDY on demand and gets back the current score for each subscribed table."
                        tables={subscribedTables}
                        withTopic={false}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="passive">
                    <AccordionTrigger>Passive — Kafka topic</AccordionTrigger>
                    <AccordionContent>
                      <KafkaScriptSection
                        description="INDY publishes an event automatically whenever a subscribed table's quality score changes. Use this consumer script to listen for changes."
                        tables={subscribedTables}
                        embedKey={embedKey}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No embed key generated yet.
                  {!ipAddress.trim() && " Enter an IP address to continue."}
                </p>
                <Button
                  variant="default"
                  size="sm"
                  disabled={pendingAction !== null || !canGenerate}
                  onClick={handleGenerate}
                >
                  {pendingAction === "generate" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="size-3.5" />
                  )}
                  {pendingAction === "generate" ? "Generating..." : "Generate embed key"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex w-[520px] shrink-0 flex-col border-l bg-neutral-50">
            <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Widget preview
                </p>
                <p className="text-xs text-muted-foreground">
                  This is how the embedded widget will look on the page you
                  paste it into.
                </p>
              </div>
              <DialogClose
                render={<Button variant="ghost" size="icon-sm" className="shrink-0" />}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6">
              <EmbedWidgetPreview tables={subscribedTables} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OverviewStatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        <p className="truncate text-[18px] font-semibold text-foreground" title={String(value)}>
          {value}
        </p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  )
}

function TopBarCard({ title, description, rows, color, labelWidth }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DimensionBarChart rows={rows} color={color} labelWidth={labelWidth} />
      </CardContent>
    </Card>
  )
}

const USER_SUBSCRIPTIONS_PAGE_SIZE = 10

function UserSubscriptionRow({ user, onSelect }) {
  const tables = useMemo(() => getUserSubscribedTables(user), [user])
  const embedKey = useMemo(() => getUserEmbedKey(user), [user])
  const generatedMinutesAgo = useMemo(() => getUserKeyGeneratedMinutesAgo(user), [user])

  return (
    <TableRow className="cursor-pointer" onClick={() => onSelect(user)}>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={ticketAuthorAvatarUrl(user.name)} alt={user.name} />
            <AvatarFallback>{ticketAuthorInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-foreground">{user.name}</span>
        </div>
      </TableCell>
      <TableCell className="truncate font-mono text-xs text-muted-foreground" title={embedKey}>
        {embedKey}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatRelativeTime(generatedMinutesAgo)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{tables.length} subscriptions</Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(user)
          }}
        >
          Detail
        </Button>
      </TableCell>
    </TableRow>
  )
}

function UserSubscriptionsList({ users, onSelectUser }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => user.name.toLowerCase().includes(q))
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_SUBSCRIPTIONS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * USER_SUBSCRIPTIONS_PAGE_SIZE,
    currentPage * USER_SUBSCRIPTIONS_PAGE_SIZE
  )

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">User Subscriptions</h3>
        <p className="text-sm text-muted-foreground">Click a row to see what a user is subscribed to</p>
      </div>

      <div className="max-w-sm">
        <SearchField
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search user name..."
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Generated time</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageUsers.map((user) => (
              <UserSubscriptionRow key={user.id} user={user} onSelect={onSelectUser} />
            ))}
            {pageUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  No users match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(p)
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(totalPages, p + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

const TABLE_SUBSCRIPTIONS_PAGE_SIZE = 10

function TableSubscriptionRow({ table, isExpanded, onToggle }) {
  const subscribers = useMemo(() => getTableSubscribers(table.id), [table])
  const [search, setSearch] = useState("")

  const filteredSubscribers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return subscribers
    return subscribers.filter((user) => user.name.toLowerCase().includes(q))
  }, [subscribers, search])

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => onToggle(table.id)}>
        <TableCell>
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="truncate font-medium text-foreground" title={table.name}>
              {table.name}
            </span>
            <TagRow
              app={table.app}
              category={table.category}
              schema={table.schema}
              granularity={table.granularity}
            />
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">{table.app}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{table.category}</TableCell>
        <TableCell className="w-44">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{subscribers.length} subscribers</Badge>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={4} className="bg-muted/20 p-0">
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-foreground">Subscribers</p>
              <SearchField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user name..."
              />
              <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto">
                {filteredSubscribers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2.5 border-b pb-2 last:border-b-0">
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={ticketAuthorAvatarUrl(user.name)} alt={user.name} />
                      <AvatarFallback>{ticketAuthorInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                ))}
                {filteredSubscribers.length === 0 && (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    {subscribers.length === 0 ? "No subscribers yet." : "No subscribers match your search."}
                  </p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function TableSubscriptionsList({ tables }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tables
    return tables.filter((table) => table.name.toLowerCase().includes(q))
  }, [tables, search])

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / TABLE_SUBSCRIPTIONS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageTables = filteredTables.slice(
    (currentPage - 1) * TABLE_SUBSCRIPTIONS_PAGE_SIZE,
    currentPage * TABLE_SUBSCRIPTIONS_PAGE_SIZE
  )

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Table Subscriptions</h3>
        <p className="text-sm text-muted-foreground">Click a row to see who is subscribed to a table</p>
      </div>

      <div className="max-w-sm">
        <SearchField
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search table name..."
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-44">Subscribers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageTables.map((table) => (
              <TableSubscriptionRow
                key={table.id}
                table={table}
                isExpanded={expandedIds.has(table.id)}
                onToggle={toggleExpanded}
              />
            ))}
            {pageTables.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  No tables match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.max(1, p - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(p)
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  setPage((p) => Math.min(totalPages, p + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

function SubscriptionOverviewTab() {
  const stats = useMemo(() => getAdminOverviewStats(), [])
  const activityStats = useMemo(() => getPlatformActivityStats(), [])

  return (
    <div className="flex-1 space-y-4 bg-[#FCFCFC] p-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Subscription Summary</h3>
        <p className="text-sm text-muted-foreground">How users are subscribing to apps and tables</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <OverviewStatCard
          icon={Users}
          label="Total users"
          value={stats.totalUsers}
          sublabel="Active subscribers"
        />
        <OverviewStatCard
          icon={Rss}
          label="Total subscriptions"
          value={stats.totalSubscriptions}
          sublabel="across all users"
        />
        <OverviewStatCard
          icon={LayoutGrid}
          label="Most subscribed app"
          value={stats.mostSubscribedApp?.app ?? "—"}
          sublabel={stats.mostSubscribedApp ? `${stats.mostSubscribedApp.count} subscriptions` : undefined}
        />
        <OverviewStatCard
          icon={Table2}
          label="Most subscribed table"
          value={stats.mostSubscribedTable?.table?.name ?? "—"}
          sublabel={stats.mostSubscribedTable ? `${stats.mostSubscribedTable.count} subscribers` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopBarCard
          title="Most apps subscribed"
          description="Top applications by number of subscriptions"
          rows={stats.topApps.map((row) => ({ label: row.app, count: row.count }))}
          color={TAILWIND_SHADES.blue[2]}
        />
        <TopBarCard
          title="Most tables subscribed"
          description="Top tables by number of subscribers"
          rows={stats.topTables.map((row) => ({ label: row.table.name, count: row.count }))}
          color={TAILWIND_SHADES.rose[3]}
          labelWidth={140}
        />
      </div>

      <PlatformActivitySummary stats={activityStats} />
    </div>
  )
}

function ActivityListTab() {
  const subscriptionActivity = useMemo(() => getAllSubscriptionActivity(), [])
  const tokenActivity = useMemo(() => getAllTokenActivity(), [])
  const apiActivity = useMemo(() => getAllApiActivity(), [])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#FCFCFC] p-6 pb-10">
      <div className="flex min-h-0 shrink-0 flex-col gap-4 lg:h-[420px] lg:flex-row">
        <Card className="min-h-0 flex-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Subscription Activity</CardTitle>
            <CardDescription>Users subscribing and unsubscribing from tables</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="h-full overflow-y-auto">
              {subscriptionActivity.map((entry) => (
                <SubscriptionActivityRow key={entry.id} entry={entry} />
              ))}
              {subscriptionActivity.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 flex-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Token Activity</CardTitle>
            <CardDescription>Embed key generation, regeneration, and revocation</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="h-full overflow-y-auto">
              {tokenActivity.map((entry) => (
                <TokenActivityRow key={entry.id} entry={entry} />
              ))}
              {tokenActivity.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-0 shrink-0 shadow-sm lg:h-[420px]">
        <CardHeader>
          <CardTitle className="text-base">API Activity</CardTitle>
          <CardDescription>Audit log of recent API requests</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1">
          <div className="h-full overflow-auto rounded-lg border border-neutral-200">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Datetime</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiActivity.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.email}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.ipAddress}</TableCell>
                    <TableCell>{formatAbsoluteDateTime(entry.minutesAgo)}</TableCell>
                    <TableCell>{entry.device}</TableCell>
                  </TableRow>
                ))}
                {apiActivity.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No activity yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CustomerDataOpsPage() {
  const { role } = useAccess()
  const isAdmin = role !== "user"
  const [mainTab, setMainTab] = useState(isAdmin ? "user-management" : "subscription")
  const [userManagementTab, setUserManagementTab] = useState("overview")
  const [selectedUserId, setSelectedUserId] = useState(null)
  const selectedUser = useMemo(
    () => ADMIN_USERS.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId]
  )
  const [appFilter, setAppFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [hostFilter, setHostFilter] = useState("ALL")
  const [layerFilter, setLayerFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [subscribedSearch, setSubscribedSearch] = useState("")
  const [subscribedIds, setSubscribedIds] = useState(
    () => new Set(INITIAL_SUBSCRIBED_IDS)
  )
  // Staged subscribe/unsubscribe changes while editing — only committed to
  // subscribedIds (and reflected in "Subscribed table names") on Save.
  const [draftSubscribedIds, setDraftSubscribedIds] = useState(
    () => new Set(INITIAL_SUBSCRIBED_IDS)
  )
  const [isEditMode, setIsEditMode] = useState(false)
  const [checkedIds, setCheckedIds] = useState(() => new Set())
  // Ids that just moved into "Subscribed table names" on the last Save —
  // drives the arrival highlight, then clears itself so it never replays.
  const [justSavedIds, setJustSavedIds] = useState(() => new Set())
  const justSavedTimeoutRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(justSavedTimeoutRef.current)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SUBSCRIPTION_TABLES.filter((t) => {
      if (appFilter !== "ALL" && t.app !== appFilter) return false
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false
      if (hostFilter !== "ALL" && t.host !== hostFilter) return false
      if (layerFilter !== "ALL" && t.layerId !== layerFilter) return false
      if (q && !t.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [appFilter, categoryFilter, hostFilter, layerFilter, search])

  const subscribedTables = useMemo(
    () => SUBSCRIPTION_TABLES.filter((t) => subscribedIds.has(t.id)),
    [subscribedIds]
  )

  const filteredSubscribedTables = useMemo(() => {
    const q = subscribedSearch.trim().toLowerCase()
    if (!q) return subscribedTables
    return subscribedTables.filter((t) => t.name.toLowerCase().includes(q))
  }, [subscribedTables, subscribedSearch])

  const toggleChecked = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allFilteredChecked =
    filtered.length > 0 && filtered.every((t) => checkedIds.has(t.id))
  const someFilteredChecked = filtered.some((t) => checkedIds.has(t.id))

  const handleSelectAllChange = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredChecked) {
        filtered.forEach((t) => next.delete(t.id))
      } else {
        filtered.forEach((t) => next.add(t.id))
      }
      return next
    })
  }

  const checkedTables = useMemo(
    () => SUBSCRIPTION_TABLES.filter((t) => checkedIds.has(t.id)),
    [checkedIds]
  )
  const allCheckedSubscribed =
    checkedTables.length > 0 &&
    checkedTables.every((t) => draftSubscribedIds.has(t.id))
  const allCheckedUnsubscribed =
    checkedTables.length > 0 &&
    checkedTables.every((t) => !draftSubscribedIds.has(t.id))
  const canBulkSubscribe = checkedIds.size > 0 && allCheckedUnsubscribed
  const canBulkUnsubscribe = checkedIds.size > 0 && allCheckedSubscribed

  const hasDraftChanges =
    draftSubscribedIds.size !== subscribedIds.size ||
    [...draftSubscribedIds].some((id) => !subscribedIds.has(id))

  const bulkSubscribe = () => {
    setDraftSubscribedIds((prev) => {
      const next = new Set(prev)
      checkedIds.forEach((id) => next.add(id))
      return next
    })
  }

  const bulkUnsubscribe = () => {
    setDraftSubscribedIds((prev) => {
      const next = new Set(prev)
      checkedIds.forEach((id) => next.delete(id))
      return next
    })
  }

  const enterEditMode = () => {
    setDraftSubscribedIds(new Set(subscribedIds))
    setCheckedIds(new Set())
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setDraftSubscribedIds(new Set(subscribedIds))
    setCheckedIds(new Set())
    setIsEditMode(false)
  }

  const handleSave = () => {
    // Subscribe/unsubscribe changes only take effect — and move between
    // lists — once Save is pressed; Cancel discards the draft entirely.
    const newlySubscribed = [...draftSubscribedIds].filter((id) => !subscribedIds.has(id))
    setSubscribedIds(new Set(draftSubscribedIds))
    setCheckedIds(new Set())
    setIsEditMode(false)

    setJustSavedIds(new Set(newlySubscribed))
    clearTimeout(justSavedTimeoutRef.current)
    justSavedTimeoutRef.current = setTimeout(() => setJustSavedIds(new Set()), 1500)
  }

  const subscriptionSection = (
    <>
      <div className="flex shrink-0 items-start justify-between border-b px-6 py-[18px]">
        <div className="space-y-0.5">
          <h2 className="text-xl leading-6 font-semibold text-foreground">
            Subscription
          </h2>
          <p className="text-xs leading-4 text-neutral-600">
            All your data source subscriptions
          </p>
        </div>
        <GetEmbedCodeDialog subscribedTables={subscribedTables} />
      </div>

      <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-[7] flex-col gap-4 px-6 pt-5 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={appFilter} onValueChange={setAppFilter}>
              <SelectTrigger className="h-9 w-fit gap-2">
                <span className="text-muted-foreground">Application:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-fit gap-2">
                <span className="text-muted-foreground">Category Data:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={hostFilter} onValueChange={setHostFilter}>
              <SelectTrigger className="h-9 w-fit gap-2">
                <span className="text-muted-foreground">IP Host / Host Name:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOST_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={layerFilter} onValueChange={setLayerFilter}>
              <SelectTrigger className="h-9 w-fit gap-2">
                <span className="text-muted-foreground">Layer ID:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYER_ID_OPTIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-h-8 rounded-[8px] border-neutral-300 bg-white/10 py-2 pr-2 pl-2.5 text-sm shadow-xs"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 min-h-8 rounded-[8px] py-2 pr-2 pl-2.5 text-sm shadow-xs"
                  disabled={!hasDraftChanges}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-h-8 gap-1.5 rounded-[8px] border-neutral-300 bg-white/10 py-2 pr-2 pl-2.5 text-sm shadow-xs"
                onClick={enterEditMode}
              >
                <Pencil className="size-3.5" />
                Edit subscription
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <SearchField value={search} onChange={(e) => setSearch(e.target.value)} />
          <p className="text-xs font-medium text-neutral-600">
            Showing {filtered.length} tables
          </p>
        </div>

        {isEditMode && (
          <SelectAllRow
            checked={allFilteredChecked}
            indeterminate={someFilteredChecked && !allFilteredChecked}
            onChange={handleSelectAllChange}
            canBulkSubscribe={canBulkSubscribe}
            canBulkUnsubscribe={canBulkUnsubscribe}
            onBulkSubscribe={bulkSubscribe}
            onBulkUnsubscribe={bulkUnsubscribe}
          />
        )}

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto">
          {filtered.map((t) => (
            <SubscriptionRow
              key={t.id}
              table={t}
              isSubscribed={(isEditMode ? draftSubscribedIds : subscribedIds).has(t.id)}
              isEditMode={isEditMode}
              isChecked={checkedIds.has(t.id)}
              onToggleChecked={toggleChecked}
            />
          ))}
          {filtered.length === 0 && (
            <p className="w-full py-4 text-center text-sm text-muted-foreground">
              No tables match your filters.
            </p>
          )}
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-[3] flex-col gap-2 border-l px-6 pt-5 pb-6">
        <div className="shrink-0 space-y-0.5">
          <p className="text-lg font-medium text-foreground">
            Subscribed table names
          </p>
          <p className="text-xs text-neutral-600">
            Total: {subscribedTables.length} subscriptions
          </p>
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto">
          <div className="p-1">
            <SearchField
              value={subscribedSearch}
              onChange={(e) => setSubscribedSearch(e.target.value)}
            />
          </div>
          {filteredSubscribedTables.map((t) => (
            <SubscribedTableRow key={t.id} table={t} justSaved={justSavedIds.has(t.id)} />
          ))}
          {filteredSubscribedTables.length === 0 && (
            <p className="w-full py-4 text-sm text-muted-foreground">
              {subscribedTables.length === 0
                ? "No subscriptions yet — subscribe to a table on the left."
                : "No subscribed tables match your search."}
            </p>
          )}
        </div>
      </div>
      </div>
    </>
  )

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {isAdmin ? (
        <Tabs value={mainTab} onValueChange={setMainTab} className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="w-full shrink-0 border-b pt-4 pr-6 pl-[20px]">
            <TabsList variant="line" className="justify-start gap-1">
              <TabsTrigger value="user-management">User Management</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="user-management" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
            {selectedUser ? (
              <div className="p-6">
                <UserDetailView
                  key={selectedUser.id}
                  user={selectedUser}
                  onBack={() => setSelectedUserId(null)}
                />
              </div>
            ) : (
              <>
                <div className="shrink-0 space-y-3 border-b bg-white px-6 py-[18px]">
                  <div className="space-y-0.5">
                    <h2 className="text-xl leading-6 font-semibold text-foreground">User Management</h2>
                    <p className="text-xs leading-4 text-neutral-600">
                      Admin summary of users, their subscriptions, and subscribed tables
                    </p>
                  </div>
                  <Tabs value={userManagementTab} onValueChange={setUserManagementTab}>
                    <TabsList>
                      <TabsTrigger value="overview">
                        <LayoutDashboard />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="list-user">
                        <Users />
                        List User
                      </TabsTrigger>
                      <TabsTrigger value="list-table">
                        <Table2 />
                        List Table
                      </TabsTrigger>
                      <TabsTrigger value="list-activity">
                        <History />
                        List Activity
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {userManagementTab === "overview" && <SubscriptionOverviewTab />}
                {userManagementTab === "list-user" && (
                  <div className="p-6">
                    <UserSubscriptionsList
                      users={ADMIN_USERS}
                      onSelectUser={(user) => setSelectedUserId(user.id)}
                    />
                  </div>
                )}
                {userManagementTab === "list-table" && (
                  <div className="p-6">
                    <TableSubscriptionsList tables={SUBSCRIPTION_TABLES} />
                  </div>
                )}
                {userManagementTab === "list-activity" && <ActivityListTab />}
              </>
            )}
          </TabsContent>

          <TabsContent value="subscription" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {subscriptionSection}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {subscriptionSection}
        </div>
      )}
    </div>
  )
}
