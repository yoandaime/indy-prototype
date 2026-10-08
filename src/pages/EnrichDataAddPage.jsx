import { Fragment, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, ChevronLeft, Lightbulb, Loader2, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  REGISTERED_IPS,
  WIZARD_COLUMNS,
  WIZARD_SCHEDULE,
  CONNECTION_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  GROUP_APPS_OPTIONS,
  LAYER_OPTIONS,
  CONFIG_CONNECTION_TYPE_OPTIONS,
  GRANULARITY_OPTIONS,
  DIMENSION_OPTIONS,
  DEFAULT_SELECTED_DIMENSIONS,
  ENDPOINT_IP_OPTIONS,
} from "@/data/enrichDataWizardMock"

const STEPS = [
  { n: 1, label: "Credential" },
  { n: 2, label: "Configuration" },
  { n: 3, label: "Method" },
  { n: 4, label: "Confirmation" },
]

const INITIAL_CREDENTIAL = { connType: "", dbName: "", dbPort: "5432", dbUser: "", dbPass: "", ssl: true }

const INITIAL_CONFIG = {
  category: "Radio Access Network",
  groupApps: "DSP Analytics",
  layer: "Layer 3 — Enriched",
  connType: "Type 4 — Kafka Stream",
  schema: "default",
  table: "etl_dsp_basic_daily",
  controlTable: "reference.control_table",
  granularity: "Hourly",
  refSchema: "default",
  refTable: "etl_dsp_basic_daily",
  olaReadiness: "1 days 08:00:00",
  endpointIp: "3",
}

function Stepper({ current }) {
  return (
    <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {STEPS.map((step, i) => {
        const isDone = step.n < current
        const isActive = step.n === current
        return (
          <Fragment key={step.n}>
            <div className="flex shrink-0 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isDone && "bg-emerald-500 text-white",
                  isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !isDone && !isActive && "bg-neutral-100 text-neutral-400"
                )}
              >
                {isDone ? <Check className="size-3.5" /> : step.n}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isDone && "text-emerald-600",
                  isActive && "text-primary",
                  !isDone && !isActive && "text-neutral-400"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-4 h-px flex-1", isDone ? "bg-emerald-500" : "bg-neutral-200")} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function StepBadge({ n }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
      {n}
    </span>
  )
}

function FieldLabel({ children, required }) {
  return (
    <Label>
      {children} {required && <span className="text-destructive">*</span>}
    </Label>
  )
}

function SelectField({ label, required, value, onValueChange, options, placeholder, hint }) {
  const getValue = (option) => (typeof option === "string" ? option : option.value)
  const getLabel = (option) => (typeof option === "string" ? option : option.label)
  const labelFor = (val) => getLabel(options.find((option) => getValue(option) === val) ?? val)

  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`}>
            {(val) => labelFor(val)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={getValue(option)} value={getValue(option)}>
              {getLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function InputField({ label, required, hint, ...inputProps }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <Input {...inputProps} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Alert({ tone, icon, children }) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-300 bg-amber-50 text-amber-700",
  }
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm", tones[tone])}>
      {icon}
      <span>{children}</span>
    </div>
  )
}

function ConfirmSection({ title, onEdit, note, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {onEdit ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        ) : note ? (
          <span className="text-xs text-muted-foreground">{note}</span>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200">{children}</div>
    </div>
  )
}

function ConfirmRow({ label, children }) {
  return (
    <div className="grid grid-cols-[160px_1fr] border-b border-neutral-100 text-sm last:border-b-0">
      <div className="bg-neutral-50 px-3.5 py-2.5 text-xs font-medium text-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 text-foreground">{children}</div>
    </div>
  )
}

export default function EnrichDataAddPage() {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const [brokerIp, setBrokerIp] = useState("")
  const [checking, setChecking] = useState(false)
  const [ipChecked, setIpChecked] = useState(false)
  const [ipRegistered, setIpRegistered] = useState(false)
  const [credential, setCredential] = useState(INITIAL_CREDENTIAL)

  const [config, setConfig] = useState(INITIAL_CONFIG)
  const [dimensions, setDimensions] = useState(DEFAULT_SELECTED_DIMENSIONS)

  const setConfigField = (key) => (value) => setConfig((c) => ({ ...c, [key]: value }))
  const setConfigInput = (key) => (e) => setConfig((c) => ({ ...c, [key]: e.target.value }))

  const toggleDimension = (dim) => {
    setDimensions((prev) => (prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]))
  }

  const handleCheckIp = () => {
    const ip = brokerIp.trim()
    if (!ip || checking) return
    setChecking(true)
    setTimeout(() => {
      const registered = REGISTERED_IPS.includes(ip)
      setIpRegistered(registered)
      setIpChecked(true)
      setChecking(false)
      setCredential(
        registered
          ? { connType: "Kafka", dbName: "demo_production", dbPort: "5432", dbUser: "demo_user", dbPass: "hidden_password", ssl: true }
          : INITIAL_CREDENTIAL
      )
    }, 900)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSubmitted(false)
    setBrokerIp("")
    setChecking(false)
    setIpChecked(false)
    setIpRegistered(false)
    setCredential(INITIAL_CREDENTIAL)
    setConfig(INITIAL_CONFIG)
    setDimensions(DEFAULT_SELECTED_DIMENSIONS)
  }

  const endpointLabel = ENDPOINT_IP_OPTIONS.find((o) => o.value === config.endpointIp)?.label || "—"

  if (submitted) {
    return (
      <div className="h-full min-w-0 flex-1 overflow-y-auto bg-white pt-5 px-10 pb-10">
        <div className="mx-auto w-full max-w-[860px]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <Check className="size-7 text-emerald-600" />
            </div>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
              {config.schema}.{config.table}
            </Badge>
            <h2 className="text-lg font-semibold text-foreground">Data Source Registered!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Successfully registered and will now appear in the NDQ dashboard for monitoring.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => navigate("/enrich-data/admin")}>
                Back to Data Sources
              </Button>
              <Button onClick={handleReset}>Register Another Source</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto bg-white pt-5 px-10 pb-10">
      <div className="mx-auto w-full max-w-[860px] space-y-4">
        <Link
          to="/enrich-data/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-3.5" />
          Add New Data
        </Link>

        <div className="space-y-0.5">
          <h1 className="text-xl leading-6 font-semibold text-foreground">Add New Data Source</h1>
          <p className="text-sm text-muted-foreground">
            Register a new data source to be monitored in the Network Data Quality dashboard.
          </p>
        </div>

        <Stepper current={currentStep} />

        {currentStep === 1 && (
          <Card>
            <CardHeader className="border-b [.border-b]:pb-4">
              <CardTitle className="flex items-center gap-2">
                <StepBadge n={1} />
                Credential
              </CardTitle>
              <CardDescription>
                Enter the broker IP address to verify or register its connection credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <InputField
                label="Broker IP Address"
                required
                placeholder="e.g. 192.168.10.45"
                autoComplete="off"
                value={brokerIp}
                onChange={(e) => {
                  setBrokerIp(e.target.value)
                  setIpChecked(false)
                }}
                hint="Enter the IP address of the data broker you want to register."
              />

              {checking && (
                <Alert tone="info" icon={<Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />}>
                  Checking IP registration status...
                </Alert>
              )}

              {!checking && ipChecked && (
                <Alert
                  tone={ipRegistered ? "success" : "warning"}
                  icon={
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        ipRegistered ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                  }
                >
                  <strong>{ipRegistered ? "IP Found:" : "IP Not Found:"}</strong>{" "}
                  {brokerIp} is{" "}
                  {ipRegistered
                    ? "already registered. Proceeding to configuration."
                    : "not registered. Connection details required."}
                </Alert>
              )}

              {!ipChecked && (
                <Alert tone="info" icon={<Lightbulb className="mt-0.5 size-4 shrink-0" />}>
                  Try <strong>192.168.10.45</strong> (already registered) or{" "}
                  <strong>192.0.2.1</strong> (new IP) to experience both flows.
                </Alert>
              )}

              {ipChecked && (
                <div className="space-y-4 border-t border-neutral-100 pt-4">
                  {ipRegistered ? (
                    <Alert tone="success" icon={<Check className="mt-0.5 size-4 shrink-0" />}>
                      Connection details auto-filled from registered profile.
                    </Alert>
                  ) : (
                    <Alert tone="info" icon={<Lightbulb className="mt-0.5 size-4 shrink-0" />}>
                      This IP is new. Please fill in the connection details below.
                    </Alert>
                  )}

                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Connection Details
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Connection Type"
                      required
                      value={credential.connType}
                      onValueChange={(v) => setCredential((c) => ({ ...c, connType: v }))}
                      options={CONNECTION_TYPE_OPTIONS}
                      placeholder="Select type"
                    />
                    <InputField
                      label="Broker IP Address"
                      value={brokerIp}
                      readOnly
                      className="bg-muted"
                      hint="Pre-filled from Step 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Database"
                      required
                      placeholder="PostgreSQL database name"
                      value={credential.dbName}
                      onChange={(e) => setCredential((c) => ({ ...c, dbName: e.target.value }))}
                      hint="PostgreSQL only"
                    />
                    <InputField
                      label="Port"
                      required
                      type="number"
                      value={credential.dbPort}
                      onChange={(e) => setCredential((c) => ({ ...c, dbPort: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Username"
                      required
                      placeholder="db_username"
                      value={credential.dbUser}
                      onChange={(e) => setCredential((c) => ({ ...c, dbUser: e.target.value }))}
                    />
                    <InputField
                      label="Password"
                      required
                      type="password"
                      placeholder="••••••••"
                      value={credential.dbPass}
                      disabled={ipRegistered}
                      onChange={(e) => setCredential((c) => ({ ...c, dbPass: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">SSL Encryption</p>
                      <p className="text-xs text-muted-foreground">Enable SSL for secure connection</p>
                    </div>
                    <Switch
                      checked={credential.ssl}
                      onCheckedChange={(v) => setCredential((c) => ({ ...c, ssl: v }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                disabled={checking || !brokerIp.trim()}
                onClick={ipChecked ? () => setCurrentStep(2) : handleCheckIp}
              >
                {checking ? "Checking..." : ipChecked ? "Continue →" : "Check"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader className="border-b [.border-b]:pb-4">
              <CardTitle className="flex items-center gap-2">
                <StepBadge n={2} />
                Configuration
              </CardTitle>
              <CardDescription>Complete the data source configuration below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Category Name"
                  required
                  value={config.category}
                  onValueChange={setConfigField("category")}
                  options={CATEGORY_OPTIONS}
                />
                <SelectField
                  label="Groups Apps Name"
                  required
                  value={config.groupApps}
                  onValueChange={setConfigField("groupApps")}
                  options={GROUP_APPS_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Layer Name"
                  required
                  value={config.layer}
                  onValueChange={setConfigField("layer")}
                  options={LAYER_OPTIONS}
                />
                <SelectField
                  label="Connection Type"
                  required
                  value={config.connType}
                  onValueChange={setConfigField("connType")}
                  options={CONFIG_CONNECTION_TYPE_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Schema Name" required value={config.schema} onChange={setConfigInput("schema")} />
                <InputField label="Table Name" required value={config.table} onChange={setConfigInput("table")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Control Table" value={config.controlTable} onChange={setConfigInput("controlTable")} />
                <SelectField
                  label="Granularity"
                  required
                  value={config.granularity}
                  onValueChange={setConfigField("granularity")}
                  options={GRANULARITY_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Reference Schema" value={config.refSchema} onChange={setConfigInput("refSchema")} />
                <InputField label="Reference Table Name" value={config.refTable} onChange={setConfigInput("refTable")} />
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>Dimension Rules</FieldLabel>
                <p className="text-xs text-muted-foreground">Select one or more rules to apply</p>
                <div className="flex flex-wrap gap-2">
                  {DIMENSION_OPTIONS.map((dim) => {
                    const active = dimensions.includes(dim)
                    return (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => toggleDimension(dim)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-neutral-200 text-muted-foreground hover:border-primary hover:text-primary"
                        )}
                      >
                        {dim}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="OLA Readiness"
                  required
                  value={config.olaReadiness}
                  onChange={setConfigInput("olaReadiness")}
                />
                <SelectField
                  label="IP Address (Endpoint)"
                  value={config.endpointIp}
                  onValueChange={setConfigField("endpointIp")}
                  options={ENDPOINT_IP_OPTIONS}
                  placeholder="Select endpoint"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)}>Next: Method →</Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader className="border-b [.border-b]:pb-4">
              <CardTitle className="flex items-center gap-2">
                <StepBadge n={3} />
                Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Type &amp; Expression Mapping
              </p>
              <Alert tone="info" icon={<Sparkles className="mt-0.5 size-4 shrink-0" />}>
                Values are auto-filled from the database and shown as read-only.
              </Alert>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead>Column Name</TableHead>
                      <TableHead>Type ID</TableHead>
                      <TableHead>Expression ID</TableHead>
                      <TableHead className="text-center">Unique</TableHead>
                      <TableHead className="text-center">Validity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {WIZARD_COLUMNS.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="font-mono">{c.type_id}</TableCell>
                        <TableCell className="font-mono">{c.expr_id}</TableCell>
                        <TableCell className="text-center">
                          {c.is_uniq ? (
                            <Check className="mx-auto size-4 text-emerald-600" />
                          ) : (
                            <X className="mx-auto size-4 text-neutral-300" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.is_validity ? (
                            <Check className="mx-auto size-4 text-emerald-600" />
                          ) : (
                            <X className="mx-auto size-4 text-neutral-300" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>Review &amp; Confirm →</Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader className="border-b [.border-b]:pb-4">
              <CardTitle className="flex items-center gap-2">
                <StepBadge n={4} />
                Confirmation
              </CardTitle>
              <CardDescription>Review all details before registering this data source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <ConfirmSection title="Credential" onEdit={() => setCurrentStep(1)}>
                <ConfirmRow label="Broker IP">
                  {brokerIp || "—"}
                  <Badge
                    variant="outline"
                    className={cn(
                      ipRegistered ? "border-emerald-300 text-emerald-700" : "border-blue-300 text-blue-700"
                    )}
                  >
                    {ipRegistered ? "Registered" : "New"}
                  </Badge>
                </ConfirmRow>
              </ConfirmSection>

              <ConfirmSection title="Connection Details" onEdit={() => setCurrentStep(1)}>
                <ConfirmRow label="Connection Type">{credential.connType || "—"}</ConfirmRow>
                <ConfirmRow label="Database">{credential.dbName || "—"}</ConfirmRow>
                <ConfirmRow label="Port">{credential.dbPort || "—"}</ConfirmRow>
                <ConfirmRow label="SSL">{credential.ssl ? "Enabled" : "Disabled"}</ConfirmRow>
                <ConfirmRow label="Username">{credential.dbUser || "—"}</ConfirmRow>
              </ConfirmSection>

              <ConfirmSection title="Configuration" onEdit={() => setCurrentStep(2)}>
                <ConfirmRow label="Category">{config.category || "—"}</ConfirmRow>
                <ConfirmRow label="Groups Apps">{config.groupApps || "—"}</ConfirmRow>
                <ConfirmRow label="Layer">{config.layer || "—"}</ConfirmRow>
                <ConfirmRow label="Schema">{config.schema || "—"}</ConfirmRow>
                <ConfirmRow label="Table">{config.table || "—"}</ConfirmRow>
                <ConfirmRow label="Control Table">{config.controlTable || "—"}</ConfirmRow>
                <ConfirmRow label="Reference Schema">{config.refSchema || "—"}</ConfirmRow>
                <ConfirmRow label="Reference Table">{config.refTable || "—"}</ConfirmRow>
                <ConfirmRow label="Granularity">{config.granularity || "—"}</ConfirmRow>
                <ConfirmRow label="Dimension Rules">
                  {dimensions.length ? (
                    dimensions.map((d) => (
                      <Badge key={d} variant="secondary" className="font-semibold">
                        {d}
                      </Badge>
                    ))
                  ) : (
                    "—"
                  )}
                </ConfirmRow>
                <ConfirmRow label="OLA Readiness">{config.olaReadiness || "—"}</ConfirmRow>
                <ConfirmRow label="Endpoint IP">{endpointLabel}</ConfirmRow>
              </ConfirmSection>

              <ConfirmSection title="Method" onEdit={() => setCurrentStep(3)}>
                <ConfirmRow label="Mapped Columns">{WIZARD_COLUMNS.length} column(s) configured</ConfirmRow>
              </ConfirmSection>

              <ConfirmSection title="Schedule" note="Auto-configured · read-only">
                <ConfirmRow label="Status">
                  <Badge className={WIZARD_SCHEDULE.enabled ? "bg-emerald-500" : ""} variant={WIZARD_SCHEDULE.enabled ? "default" : "outline"}>
                    {WIZARD_SCHEDULE.enabled ? "Active" : "Inactive"}
                  </Badge>
                </ConfirmRow>
                <ConfirmRow label="Start Time">{WIZARD_SCHEDULE.start_time}</ConfirmRow>
                <ConfirmRow label="End Time">{WIZARD_SCHEDULE.end_time || "No end date — runs indefinitely"}</ConfirmRow>
                <ConfirmRow label="Runs">{WIZARD_SCHEDULE.human}</ConfirmRow>
              </ConfirmSection>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ChevronLeft className="size-3.5" />
                Back
              </Button>
              <Button onClick={() => setSubmitted(true)}>
                <Check className="size-4" />
                Submit &amp; Register
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
