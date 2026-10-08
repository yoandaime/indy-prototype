import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Wand2, ListChecks, Play, Activity, SlidersHorizontal, Blocks, Table2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RulesManagementList from "@/components/dataObservability/RulesManagementList"
import RulesManagementTable from "@/components/dataObservability/RulesManagementTable"
import ProfilingFields from "@/components/dataObservability/ProfilingFields"
import ProfilingResults from "@/components/dataObservability/ProfilingResults"
import ComposerFields from "@/components/dataObservability/ComposerFields"
import ComposerResults from "@/components/dataObservability/ComposerResults"
import SaveRuleDialog from "@/components/dataObservability/SaveRuleDialog"
import FieldSelect from "@/components/dataObservability/FieldSelect"
import TableStructure from "@/components/dataObservability/TableStructure"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SqlEditor from "@/components/dataObservability/SqlEditor"
import { Badge } from "@/components/ui/badge"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { notifySuccess } from "@/lib/toast"
import { cn } from "@/lib/utils"
import {
  DQ_CONNECTIONS,
  getSchemasForConnection,
  getTablesForConnection,
  findMockTable,
  fullTableName,
} from "@/data/dqComposerMockData"
import { getDimensionKeys } from "@/lib/dqComposer/ruleCatalog"
import {
  DIMENSIONS,
  ruleTypesForDimension,
  GRANULARITIES,
  MISSING_PERIOD_GRANULARITIES,
  CONSISTENCY_KEY_MODES,
  CONSISTENCY_VALUE_AGGREGATIONS,
  DEFAULT_PARTITION_COLUMN,
  DEFAULT_LOOKBACK_DAYS,
  DEFAULT_LIMIT,
  DEFAULT_GRANULARITY,
  MAX_NOT_NULL_COLUMNS,
  MAX_MISSING_KEY_COLUMNS,
  COUNT_ROW_REFERENCE_MODES,
} from "@/lib/dqComposer/constants"
import { makeRulesManagementRows } from "@/data/rulesManagementData"
import { useLocalStorageState } from "@/lib/useLocalStorageState"
import { useAccess } from "@/context/AccessContext"
import { requesterDisplayName, formatDateTime } from "@/lib/requestStatus"
import { buildRuleQuery } from "@/lib/dqComposer/buildQuery"
import { runRuleAnalysis } from "@/lib/dqComposer/runAnalysis"
import { profileTable, computeDefaultDateRange, daysBetweenInclusive } from "@/lib/dqComposer/profileTable"
import { buildComposerQuery, genericizeQuery, runComposerRule } from "@/lib/dqComposer/runComposer"

// Rule types needing a second "control table" to compare against.
const CONTROL_TABLE_RULE_TYPES = ["consistency_key", "consistency_value", "uniqueness_key"]

const INITIAL_RULE_STATE = {
  columnNames: [],
  referenceMode: "history",
  reference: "",
  referencesByColumn: {},
  insertTimeColumn: "",
  keyColumn: "",
  controlTable: "",
  controlKeyColumn: "",
  mode: "summary",
  metricColumn: "",
  aggFunc: "sum",
  controlMetricColumn: "",
  controlColumnNames: [],
  minsByColumn: {},
  maxsByColumn: {},
  patternsByColumn: {},
  allowedValuesByColumn: {},
}

const INITIAL_TABLE_B = { tableName: "", describedTable: null, partitionColumn: DEFAULT_PARTITION_COLUMN, joinColumns: [] }

function makeInitialComposerState(rule) {
  return {
    key: rule?.key || null,
    dimension: rule?.dimension || getDimensionKeys()[0],
    ruleName: rule?.title || "",
    description: rule?.description || "",
    columnMode: rule?.mode || "single",
    columnName: rule?.columnName || "",
    joinColumnsA: [],
    numerator: rule?.num || "",
    denominator: rule?.denom || "",
    tableB: { ...INITIAL_TABLE_B },
    startDate: "",
    endDate: "",
    limit: String(DEFAULT_LIMIT),
    sqlQuery: "",
    previewRows: null,
  }
}

function slugify(text) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "custom_rule"
  )
}

function formatToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function StatusPill({ status }) {
  if (status === null || status === undefined) return <span className="text-muted-foreground">—</span>
  const pass = status === "PASS"
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-semibold",
        pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      )}
    >
      {status}
    </Badge>
  )
}

function ResultTable({ rows }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Query ran successfully — no rows matched.</p>
  }
  const columns = Object.keys(rows[0])
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col}>
                  {col === "status" ? (
                    <StatusPill status={row[col]} />
                  ) : row[col] === null || row[col] === undefined ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    String(row[col])
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Multi-selects are soft-capped at 5 for UI sanity, matching the backend's
// not_null / missing_key column caps for the rule types that have one.
function clampSelection(values, max) {
  return values.length > max ? values.slice(0, max) : values
}

export default function DqExperiencePage() {
  const { role } = useAccess()
  const [topTab, setTopTab] = useState("dq-composer")
  const [subTab, setSubTab] = useState("profiling")

  // New rules submitted via the Composer go through an approval workflow —
  // pending until an admin reviews them in Rules Catalog's "Request New
  // Rules" section. Approved requests are what populate the custom rules
  // shown in "All rules". Persisted + cross-tab synced so a request made in
  // a "user" tab shows up live for review in an "admin" tab.
  const [ruleRequests, setRuleRequests] = useLocalStorageState("indy-rule-requests", [])
  const customRules = useMemo(() => ruleRequests.filter((r) => r.status === "approved"), [ruleRequests])

  // Rules Management tab — one row per registered table, with rules applied
  // per dimension (rule titles, not raw rule-type keys).
  const [rulesManagementRows, setRulesManagementRows] = useLocalStorageState(
    "indy-rules-management-rows",
    makeRulesManagementRows
  )

  // Connection/Schema/Table/Describe/Period — shared across all three DQ
  // Composer sub-tabs (Profiling, Rules, Composer).
  const [connection, setConnection] = useState(DQ_CONNECTIONS[0])
  const [schema, setSchema] = useState(getSchemasForConnection(DQ_CONNECTIONS[0])[0] || "")
  const [tableName, setTableName] = useState("")
  const [describedTable, setDescribedTable] = useState(null)
  const [partitionColumn, setPartitionColumn] = useState(DEFAULT_PARTITION_COLUMN)

  // Rules sub-tab state.
  const [dimension, setDimension] = useState("")
  const [ruleType, setRuleType] = useState("")
  const [granularity, setGranularity] = useState(DEFAULT_GRANULARITY)
  const [ruleStartDate, setRuleStartDate] = useState("")
  const [ruleEndDate, setRuleEndDate] = useState("")
  const [limit, setLimit] = useState(String(DEFAULT_LIMIT))
  const [ruleState, setRuleState] = useState(INITIAL_RULE_STATE)
  const [sqlQuery, setSqlQuery] = useState("")
  const [analysisRows, setAnalysisRows] = useState(null)

  // Profiling sub-tab state.
  const [insertTimeColumn, setInsertTimeColumn] = useState("")
  const [uniqKeyColumns, setUniqKeyColumns] = useState([])
  const [profileStartDate, setProfileStartDate] = useState("")
  const [profileEndDate, setProfileEndDate] = useState("")
  const [profile, setProfile] = useState(null)
  const [isProfiling, setIsProfiling] = useState(false)

  // Composer sub-tab state (Rules Catalog's Add New Rule / Edit Formula).
  const [composer, setComposer] = useState(() => makeInitialComposerState(null))
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveForm, setSaveForm] = useState(null)

  const schemaOptions = getSchemasForConnection(connection)
  const tableOptions = getTablesForConnection(connection, schema).map((t) => t.table)
  const periodColumns = describedTable ? describedTable.columns.filter((c) => c.is_period).map((c) => c.column) : []
  const dataColumns = describedTable ? describedTable.columns.filter((c) => !c.is_period).map((c) => c.column) : []
  const allColumnNames = describedTable ? describedTable.columns.map((c) => c.column) : []

  const availableRuleTypes = ruleTypesForDimension(dimension)
  const availableGranularities = ruleType === "missing_period" ? MISSING_PERIOD_GRANULARITIES : GRANULARITIES
  const needsControlTable = CONTROL_TABLE_RULE_TYPES.includes(ruleType)
  const controlTableOptions = tableOptions.filter((t) => t !== tableName)
  const controlTableDef = ruleState.controlTable ? findMockTable(connection, schema, ruleState.controlTable) : null
  const controlColumnNames = controlTableDef ? controlTableDef.columns.map((c) => c.column) : []

  function patchRuleState(patch) {
    setRuleState((prev) => ({ ...prev, ...patch }))
  }

  function patchComposer(patch) {
    setComposer((prev) => ({ ...prev, ...patch }))
  }

  function patchTableB(patch) {
    setComposer((prev) => ({ ...prev, tableB: { ...prev.tableB, ...patch } }))
  }

  function patchSaveForm(patch) {
    setSaveForm((prev) => ({ ...prev, ...patch }))
  }

  function resetDescribedTableState() {
    setDescribedTable(null)
    setPartitionColumn(DEFAULT_PARTITION_COLUMN)
    // Reset every sub-tab's derived state — it all keys off the described table's columns.
    setDimension("")
    setRuleType("")
    setSqlQuery("")
    setAnalysisRows(null)
    setRuleState(INITIAL_RULE_STATE)
    setRuleStartDate("")
    setRuleEndDate("")
    setInsertTimeColumn("")
    setUniqKeyColumns([])
    setProfileStartDate("")
    setProfileEndDate("")
    setProfile(null)
    setIsProfiling(false)
    setComposer(makeInitialComposerState(null))
  }

  function handleConnectionChange(next) {
    setConnection(next)
    setSchema(getSchemasForConnection(next)[0] || "")
    setTableName("")
    resetDescribedTableState()
  }

  function handleSchemaChange(next) {
    setSchema(next)
    setTableName("")
    resetDescribedTableState()
  }

  function handleTableChange(next) {
    setTableName(next)
    resetDescribedTableState()
  }

  function handleDescribe() {
    const found = findMockTable(connection, schema, tableName)
    if (!found) {
      toast.error("Select a table first")
      return
    }
    setDescribedTable(found)
    setGranularity(found.granularity)
    const defaultPeriod =
      found.columns.find((c) => c.column === DEFAULT_PARTITION_COLUMN)?.column ||
      found.columns.find((c) => c.is_period)?.column ||
      ""
    setPartitionColumn(defaultPeriod)
    setSqlQuery("")
    setAnalysisRows(null)
    setProfile(null)
    setIsProfiling(false)
    const defaultRange = computeDefaultDateRange(found.rows, defaultPeriod, DEFAULT_LOOKBACK_DAYS)
    setProfileStartDate(defaultRange.startDate)
    setProfileEndDate(defaultRange.endDate)
    setRuleStartDate(defaultRange.startDate)
    setRuleEndDate(defaultRange.endDate)
    patchComposer({ sqlQuery: "", previewRows: null, startDate: defaultRange.startDate, endDate: defaultRange.endDate })
    notifySuccess(
      "Table described successfully",
      `${found.columns.length} columns found in ${fullTableName(schema, tableName)}`
    )
  }

  function handleDimensionChange(next) {
    setDimension(next)
    const types = ruleTypesForDimension(next)
    const nextRuleType = types[0] || ""
    setRuleType(nextRuleType)
    setSqlQuery("")
    setAnalysisRows(null)
    setRuleState(INITIAL_RULE_STATE)
    if (nextRuleType === "missing_period" && !MISSING_PERIOD_GRANULARITIES.includes(granularity)) {
      setGranularity(MISSING_PERIOD_GRANULARITIES[0])
    }
  }

  function handleRuleTypeChange(next) {
    setRuleType(next)
    setSqlQuery("")
    setAnalysisRows(null)
    setRuleState(INITIAL_RULE_STATE)
    if (next === "missing_period" && !MISSING_PERIOD_GRANULARITIES.includes(granularity)) {
      setGranularity(MISSING_PERIOD_GRANULARITIES[0])
    }
  }

  function buildConfig() {
    const base = {
      table: fullTableName(schema, tableName),
      ruleType,
      partitionColumn,
      granularity,
      lookbackDays: daysBetweenInclusive(ruleStartDate, ruleEndDate),
      limit: Number(limit),
    }
    switch (ruleType) {
      case "not_null":
        return { ...base, columnNames: ruleState.columnNames }
      case "count_row":
        return { ...base, referenceMode: ruleState.referenceMode, reference: ruleState.reference }
      case "missing_key":
        return {
          ...base,
          columnNames: ruleState.columnNames,
          references: ruleState.columnNames.map((c) => ruleState.referencesByColumn[c] || ""),
        }
      case "missing_period":
        return base
      case "timeliness":
        return { ...base, insertTimeColumn: ruleState.insertTimeColumn }
      case "validity_column":
        return { ...base, columnNames: ruleState.columnNames }
      case "range_check":
        return {
          ...base,
          columnNames: ruleState.columnNames,
          mins: ruleState.columnNames.map((c) => ruleState.minsByColumn[c] || ""),
          maxs: ruleState.columnNames.map((c) => ruleState.maxsByColumn[c] || ""),
        }
      case "pattern_check":
        return {
          ...base,
          columnNames: ruleState.columnNames,
          patterns: ruleState.columnNames.map((c) => ruleState.patternsByColumn[c] || ""),
        }
      case "allowed_values":
        return {
          ...base,
          columnNames: ruleState.columnNames,
          allowedValuesLists: ruleState.columnNames.map((c) =>
            (ruleState.allowedValuesByColumn[c] || "")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          ),
        }
      case "consistency_key":
        return {
          ...base,
          keyColumn: ruleState.keyColumn,
          controlTable: ruleState.controlTable ? fullTableName(schema, ruleState.controlTable) : "",
          controlPartitionColumn: partitionColumn,
          controlKeyColumn: ruleState.controlKeyColumn,
          mode: ruleState.mode,
        }
      case "consistency_value":
        return {
          ...base,
          metricColumn: ruleState.metricColumn,
          aggFunc: ruleState.aggFunc,
          controlTable: ruleState.controlTable ? fullTableName(schema, ruleState.controlTable) : "",
          controlPartitionColumn: partitionColumn,
          controlMetricColumn: ruleState.controlMetricColumn,
        }
      case "uniqueness_key":
        return {
          ...base,
          columnNames: ruleState.columnNames,
          controlTable: ruleState.controlTable ? fullTableName(schema, ruleState.controlTable) : "",
          controlColumnNames: ruleState.controlColumnNames,
          controlPartitionColumn: partitionColumn,
        }
      default:
        return base
    }
  }

  function handleGenerateSql() {
    if (!ruleType) {
      toast.error("Pick a dimension and rule type first")
      return
    }
    try {
      const query = buildRuleQuery(buildConfig())
      setSqlQuery(query)
      setAnalysisRows(null)
      notifySuccess("SQL editor updated", `Generated ${ruleType} query`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleRunAnalysis() {
    try {
      const config = buildConfig()
      const runConfig = { ...config, rows: describedTable.rows }
      if (needsControlTable) {
        if (!controlTableDef) throw new Error("Select a control table first")
        runConfig.controlRows = controlTableDef.rows
      }
      setAnalysisRows(runRuleAnalysis(runConfig))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const canGenerate = Boolean(describedTable && ruleType)

  // Right panel shows just the described table's structure until the active
  // tool has something of its own to show (profile / SQL / composer SQL).
  const hasToolOutput =
    (subTab === "profiling" && (Boolean(profile) || isProfiling)) ||
    (subTab === "rules" && (Boolean(sqlQuery) || Boolean(analysisRows))) ||
    (subTab === "composer" && Boolean(composer.sqlQuery))
  const showTableStructure = Boolean(describedTable) && !hasToolOutput

  function handleProfileTable() {
    if (!describedTable) {
      toast.error("Describe a table first")
      return
    }
    if (!partitionColumn) {
      toast.error("Select a period column first")
      return
    }
    setIsProfiling(true)
    setProfile(null)
    setTimeout(() => {
      setProfile(
        profileTable({
          table: fullTableName(schema, tableName),
          rows: describedTable.rows,
          columns: describedTable.columns,
          partitionColumn,
          insertTimeColumn,
          uniqKeyColumns,
          startDate: profileStartDate,
          endDate: profileEndDate,
        })
      )
      setIsProfiling(false)
    }, 800)
  }

  function handleExportProfile() {
    if (!profile) return
    const headers = ["Date", "First Insert", "Last Insert", "Row Count", "Gap"]
    const rows = profile.daily.map((d) => [d.date, d.first_insert, d.last_insert, d.rows, d.is_gap ? "Gap" : "OK"])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${profile.table}-profile-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const composerTableOptionsB = tableOptions.filter((t) => t !== tableName)
  const composerColumnNamesB = composer.tableB.describedTable ? composer.tableB.describedTable.columns.map((c) => c.column) : []
  const composerPeriodColumnsB = composer.tableB.describedTable
    ? composer.tableB.describedTable.columns.filter((c) => c.is_period).map((c) => c.column)
    : []

  function buildComposerConfig() {
    return {
      mode: composer.columnMode,
      table: fullTableName(schema, tableName),
      partitionColumn,
      granularity: "daily",
      lookbackDays: daysBetweenInclusive(composer.startDate, composer.endDate),
      limit: Number(composer.limit),
      ruleName: composer.ruleName,
      columnName: composer.columnName,
      numerator: composer.numerator,
      denominator: composer.denominator,
      joinColumnsA: composer.joinColumnsA,
      controlTable: composer.columnMode === "multiple" ? fullTableName(schema, composer.tableB.tableName) : "",
      controlPartitionColumn: composer.tableB.partitionColumn,
      joinColumnsB: composer.tableB.joinColumns,
    }
  }

  function handleComposerDescribeB() {
    const found = findMockTable(connection, schema, composer.tableB.tableName)
    if (!found) {
      toast.error("Select Table B first")
      return
    }
    const defaultPeriod =
      found.columns.find((c) => c.column === DEFAULT_PARTITION_COLUMN)?.column || found.columns.find((c) => c.is_period)?.column || ""
    patchTableB({ describedTable: found, partitionColumn: defaultPeriod })
    patchComposer({ sqlQuery: "", previewRows: null })
    notifySuccess("Table B described successfully", `${found.columns.length} columns found in ${fullTableName(schema, composer.tableB.tableName)}`)
  }

  const canGenerateComposer =
    Boolean(describedTable) &&
    Boolean(composer.numerator.trim()) &&
    (composer.columnMode !== "multiple" || (Boolean(composer.tableB.describedTable) && Boolean(composer.denominator.trim())))

  function handleComposerGenerateSql() {
    try {
      const query = buildComposerQuery(buildComposerConfig())
      patchComposer({ sqlQuery: query, previewRows: null })
      notifySuccess("SQL editor updated", "Generated SQL formula")
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleComposerRunAnalysis() {
    try {
      const config = buildComposerConfig()
      const rows = runComposerRule({
        ...config,
        rows: describedTable.rows,
        controlRows: composer.tableB.describedTable?.rows || [],
      })
      patchComposer({ previewRows: rows })
    } catch (err) {
      toast.error(err.message)
    }
  }

  function handleOpenSaveRule() {
    const config = buildComposerConfig()
    const genericTemplate = genericizeQuery(composer.sqlQuery, {
      table: config.table,
      controlTable: config.controlTable,
      partitionColumn: config.partitionColumn,
      granularity: config.granularity,
      controlPartitionColumn: config.controlPartitionColumn,
      columnName: composer.columnName,
    })
    setSaveForm({
      columnName: composer.columnName,
      ruleLabel: composer.ruleName,
      description: composer.description,
      queryTemplater: genericTemplate,
      num: composer.numerator,
      denom: composer.denominator,
      rate: `round(100 * ({column_name}) / NULLIF(${composer.denominator || "denom"}, 0), 2)`,
    })
    setSaveOpen(true)
  }

  function handleSubmitSaveRule() {
    if (!saveForm.ruleLabel.trim()) {
      toast.error("Rule Label is required")
      return
    }

    const isEditingApproved = Boolean(composer.key)
    if (isEditingApproved) {
      // Editing an already-approved custom rule — applies directly, no new
      // approval needed since it isn't a new rule.
      setRuleRequests((prev) =>
        prev.map((r) =>
          r.key === composer.key
            ? {
                ...r,
                dimension: composer.dimension,
                title: saveForm.ruleLabel,
                description: saveForm.description,
                template: saveForm.queryTemplater,
                updatedAt: formatToday(),
                mode: composer.columnMode,
                columnName: saveForm.columnName,
                num: saveForm.num,
                denom: saveForm.denom,
                rate: saveForm.rate,
              }
            : r
        )
      )
      setSaveOpen(false)
      setTopTab("rules-catalog")
      setComposer(makeInitialComposerState(null))
      notifySuccess("Rule saved", `"${saveForm.ruleLabel}" was updated.`)
      return
    }

    const key = `custom_${slugify(saveForm.ruleLabel)}_${Date.now().toString(36)}`
    const requestedBy = requesterDisplayName(role)
    const now = new Date()
    setRuleRequests((prev) => [
      ...prev,
      {
        id: `rule_req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        key,
        dimension: composer.dimension,
        title: saveForm.ruleLabel,
        description: saveForm.description,
        template: saveForm.queryTemplater,
        custom: true,
        updatedAt: formatToday(),
        mode: composer.columnMode,
        columnName: saveForm.columnName,
        num: saveForm.num,
        denom: saveForm.denom,
        rate: saveForm.rate,
        createdBy: requestedBy,
        status: "pending",
        requestedBy,
        requestedAt: formatDateTime(now),
        requestedAtMs: now.getTime(),
      },
    ])
    setSaveOpen(false)
    setTopTab("rules-catalog")
    setComposer(makeInitialComposerState(null))
    notifySuccess("Rule request submitted", `"${saveForm.ruleLabel}" was sent for admin approval.`)
  }

  function handleApproveRuleRequest(requestId) {
    setRuleRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r)))
  }

  function handleRejectRuleRequest(requestId, reason) {
    setRuleRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected", reviewNote: reason } : r))
    )
  }

  function handleAddNewRule() {
    setComposer(makeInitialComposerState(null))
    setTopTab("dq-composer")
    setSubTab("composer")
  }

  function handleEditRule(rule) {
    setComposer(makeInitialComposerState(rule))
    setSaveForm({
      columnName: rule.columnName || "",
      ruleLabel: rule.title || "",
      description: rule.description || "",
      queryTemplater: rule.template || "",
      num: rule.num ?? rule.numerator ?? "",
      denom: rule.denom ?? rule.denominator ?? "",
      rate: rule.rate || "",
    })
    setSaveOpen(true)
  }

  function handleUpdateRulesManagementRow(id, patch) {
    setRulesManagementRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-neutral-200 bg-white px-4 pt-3">
        <Tabs value={topTab} onValueChange={setTopTab}>
          <TabsList variant="line">
            <TabsTrigger value="dq-composer">
              <Wand2 />
              DQ Studio
            </TabsTrigger>
            <TabsTrigger value="rules-catalog">
              <ListChecks />
              Rules Catalog
            </TabsTrigger>
            <TabsTrigger value="rules-management">
              <Table2 />
              Rules Management
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {topTab === "rules-catalog" ? (
        <RulesManagementList
          customRules={customRules}
          ruleRequests={ruleRequests}
          onAddNew={handleAddNewRule}
          onEdit={handleEditRule}
          onApproveRequest={handleApproveRuleRequest}
          onRejectRequest={handleRejectRuleRequest}
        />
      ) : topTab === "rules-management" ? (
        <RulesManagementTable rows={rulesManagementRows} onUpdateRow={handleUpdateRulesManagementRow} />
      ) : (
        <div className="flex h-full min-w-0 flex-1 items-stretch overflow-hidden">
          <aside className="flex h-full w-[380px] shrink-0 flex-col gap-4 self-stretch overflow-y-auto border-r border-neutral-200 bg-white p-4 pt-6">
            <FieldSelect
              id="dq-connection"
              label="Connection"
              value={connection}
              onValueChange={handleConnectionChange}
              options={DQ_CONNECTIONS}
            />

            <FieldSelect
              id="dq-schema"
              label="Schema"
              value={schema}
              onValueChange={handleSchemaChange}
              options={schemaOptions}
            />

            <FieldSelect
              id="dq-table"
              label="Table"
              value={tableName}
              onValueChange={handleTableChange}
              options={tableOptions}
              placeholder="Select a table"
            />

            <Button type="button" className="w-full" onClick={handleDescribe} disabled={!tableName}>
              Describe
            </Button>

            {describedTable && (
              <>
                <FieldSelect
                  id="dq-period"
                  label="Period"
                  value={partitionColumn}
                  onValueChange={setPartitionColumn}
                  options={periodColumns}
                  placeholder="Select a period column"
                />

                <Tabs value={subTab} onValueChange={setSubTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="profiling" className="flex-1">
                      <Activity />
                      Profiling
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="flex-1">
                      <SlidersHorizontal />
                      Rules
                    </TabsTrigger>
                    <TabsTrigger value="composer" className="flex-1">
                      <Blocks />
                      Composer
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {subTab === "profiling" && (
                  <ProfilingFields
                    describedTable={describedTable}
                    insertTimeColumn={insertTimeColumn}
                    onInsertTimeColumnChange={setInsertTimeColumn}
                    uniqKeyColumns={uniqKeyColumns}
                    onUniqKeyColumnsChange={setUniqKeyColumns}
                    startDate={profileStartDate}
                    onStartDateChange={setProfileStartDate}
                    endDate={profileEndDate}
                    onEndDateChange={setProfileEndDate}
                    onProfileTable={handleProfileTable}
                  />
                )}

                {subTab === "rules" && (
                  <>
                    <FieldSelect
                      id="dq-dimension"
                      label="Dimension"
                      value={dimension}
                      onValueChange={handleDimensionChange}
                      options={DIMENSIONS.map((d) => d.key)}
                      placeholder="Select a dimension"
                    />

                    <FieldSelect
                      id="dq-rule-type"
                      label="Rule Type"
                      value={ruleType}
                      onValueChange={handleRuleTypeChange}
                      options={availableRuleTypes}
                      placeholder="Select a rule type"
                      disabled={!dimension}
                    />

                    {ruleType && (
                      <>
                        <div className="h-px w-full bg-border" />
                        <p className="text-xs font-medium text-muted-foreground uppercase">Rule Config</p>

                        <FieldSelect
                          id="dq-granularity"
                          label="Granularity"
                          value={granularity}
                          onValueChange={setGranularity}
                          options={availableGranularities}
                        />

                        {ruleType === "count_row" && (
                          <>
                            <div className="space-y-1.5">
                              <Label htmlFor="dq-reference-mode">Reference (expected row count)</Label>
                              <Select
                                value={ruleState.referenceMode}
                                onValueChange={(v) => patchRuleState({ referenceMode: v })}
                              >
                                <SelectTrigger id="dq-reference-mode" className="h-9 w-full shadow-xs">
                                  <SelectValue>
                                    {COUNT_ROW_REFERENCE_MODES.find((m) => m.value === ruleState.referenceMode)?.label}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {COUNT_ROW_REFERENCE_MODES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                      {m.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {ruleState.referenceMode === "custom" && (
                              <div className="space-y-1.5">
                                <Label htmlFor="dq-reference-custom">Custom reference</Label>
                                <Input
                                  id="dq-reference-custom"
                                  placeholder="Enter expected row count"
                                  value={ruleState.reference}
                                  onChange={(e) => patchRuleState({ reference: e.target.value })}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {[
                          "not_null",
                          "missing_key",
                          "validity_column",
                          "range_check",
                          "pattern_check",
                          "uniqueness_key",
                          "allowed_values",
                        ].includes(ruleType) && (
                          <div className="space-y-1.5">
                            <Label htmlFor="dq-columns">
                              Column
                              {ruleType === "not_null" && ` (max ${MAX_NOT_NULL_COLUMNS}) — ${ruleState.columnNames.length}/${MAX_NOT_NULL_COLUMNS}`}
                              {ruleType === "missing_key" && ` (max ${MAX_MISSING_KEY_COLUMNS}) — ${ruleState.columnNames.length}/${MAX_MISSING_KEY_COLUMNS}`}
                            </Label>
                            <MultiSelect
                              id="dq-columns"
                              value={ruleState.columnNames}
                              onValueChange={(next) => {
                                const max =
                                  ruleType === "not_null"
                                    ? MAX_NOT_NULL_COLUMNS
                                    : ruleType === "missing_key"
                                      ? MAX_MISSING_KEY_COLUMNS
                                      : 5
                                patchRuleState({ columnNames: clampSelection(next, max) })
                              }}
                              options={dataColumns}
                              placeholder="Cari kolom..."
                            />
                          </div>
                        )}

                        {ruleType === "missing_key" &&
                          ruleState.columnNames.map((col) => (
                            <div key={col} className="space-y-1.5">
                              <Label htmlFor={`dq-ref-${col}`}>Reference for {col}</Label>
                              <Input
                                id={`dq-ref-${col}`}
                                type="number"
                                placeholder="Optional expected count"
                                value={ruleState.referencesByColumn[col] || ""}
                                onChange={(e) =>
                                  patchRuleState({
                                    referencesByColumn: { ...ruleState.referencesByColumn, [col]: e.target.value },
                                  })
                                }
                              />
                            </div>
                          ))}

                        {ruleType === "range_check" &&
                          ruleState.columnNames.map((col) => (
                            <div key={col} className="grid grid-cols-2 gap-2">
                              <div className="space-y-1.5">
                                <Label htmlFor={`dq-min-${col}`}>{col} min</Label>
                                <Input
                                  id={`dq-min-${col}`}
                                  type="number"
                                  value={ruleState.minsByColumn[col] || ""}
                                  onChange={(e) =>
                                    patchRuleState({ minsByColumn: { ...ruleState.minsByColumn, [col]: e.target.value } })
                                  }
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`dq-max-${col}`}>{col} max</Label>
                                <Input
                                  id={`dq-max-${col}`}
                                  type="number"
                                  value={ruleState.maxsByColumn[col] || ""}
                                  onChange={(e) =>
                                    patchRuleState({ maxsByColumn: { ...ruleState.maxsByColumn, [col]: e.target.value } })
                                  }
                                />
                              </div>
                            </div>
                          ))}

                        {ruleType === "pattern_check" &&
                          ruleState.columnNames.map((col) => (
                            <div key={col} className="space-y-1.5">
                              <Label htmlFor={`dq-pattern-${col}`}>Pattern for {col} (regex)</Label>
                              <Input
                                id={`dq-pattern-${col}`}
                                placeholder="e.g. ^[A-Z0-9]+$"
                                value={ruleState.patternsByColumn[col] || ""}
                                onChange={(e) =>
                                  patchRuleState({
                                    patternsByColumn: { ...ruleState.patternsByColumn, [col]: e.target.value },
                                  })
                                }
                              />
                            </div>
                          ))}

                        {ruleType === "allowed_values" &&
                          ruleState.columnNames.map((col) => (
                            <div key={col} className="space-y-1.5">
                              <Label htmlFor={`dq-allowed-${col}`}>Allowed values for {col} (comma-separated)</Label>
                              <Input
                                id={`dq-allowed-${col}`}
                                placeholder="e.g. ACTIVE, INACTIVE, PENDING"
                                value={ruleState.allowedValuesByColumn[col] || ""}
                                onChange={(e) =>
                                  patchRuleState({
                                    allowedValuesByColumn: { ...ruleState.allowedValuesByColumn, [col]: e.target.value },
                                  })
                                }
                              />
                            </div>
                          ))}

                        {ruleType === "timeliness" && (
                          <FieldSelect
                            id="dq-insert-time-column"
                            label="Insert Time Column"
                            value={ruleState.insertTimeColumn}
                            onValueChange={(v) => patchRuleState({ insertTimeColumn: v })}
                            options={allColumnNames}
                          />
                        )}

                        {ruleType === "consistency_key" && (
                          <>
                            <FieldSelect
                              id="dq-key-column"
                              label="Key Column"
                              value={ruleState.keyColumn}
                              onValueChange={(v) => patchRuleState({ keyColumn: v })}
                              options={dataColumns}
                            />
                            <FieldSelect
                              id="dq-control-table"
                              label="Control Table"
                              value={ruleState.controlTable}
                              onValueChange={(v) => patchRuleState({ controlTable: v, controlKeyColumn: "" })}
                              options={controlTableOptions}
                            />
                            <FieldSelect
                              id="dq-control-key-column"
                              label="Control Key Column"
                              value={ruleState.controlKeyColumn}
                              onValueChange={(v) => patchRuleState({ controlKeyColumn: v })}
                              options={controlColumnNames}
                              disabled={!controlTableDef}
                            />
                            <FieldSelect
                              id="dq-mode"
                              label="Mode"
                              value={ruleState.mode}
                              onValueChange={(v) => patchRuleState({ mode: v })}
                              options={CONSISTENCY_KEY_MODES}
                            />
                          </>
                        )}

                        {ruleType === "consistency_value" && (
                          <>
                            <FieldSelect
                              id="dq-metric-column"
                              label="Metric Column"
                              value={ruleState.metricColumn}
                              onValueChange={(v) => patchRuleState({ metricColumn: v })}
                              options={dataColumns}
                            />
                            <FieldSelect
                              id="dq-agg-func"
                              label="Aggregation"
                              value={ruleState.aggFunc}
                              onValueChange={(v) => patchRuleState({ aggFunc: v })}
                              options={CONSISTENCY_VALUE_AGGREGATIONS}
                            />
                            <FieldSelect
                              id="dq-control-table-value"
                              label="Control Table"
                              value={ruleState.controlTable}
                              onValueChange={(v) => patchRuleState({ controlTable: v, controlMetricColumn: "" })}
                              options={controlTableOptions}
                            />
                            <FieldSelect
                              id="dq-control-metric-column"
                              label="Control Metric Column"
                              value={ruleState.controlMetricColumn}
                              onValueChange={(v) => patchRuleState({ controlMetricColumn: v })}
                              options={controlColumnNames}
                              disabled={!controlTableDef}
                            />
                          </>
                        )}

                        {ruleType === "uniqueness_key" && (
                          <>
                            <FieldSelect
                              id="dq-control-table-uniq"
                              label="Control Table"
                              value={ruleState.controlTable}
                              onValueChange={(v) => patchRuleState({ controlTable: v, controlColumnNames: [] })}
                              options={controlTableOptions}
                            />
                            <div className="space-y-1.5">
                              <Label htmlFor="dq-control-columns">Control Key Column(s)</Label>
                              <MultiSelect
                                id="dq-control-columns"
                                value={ruleState.controlColumnNames}
                                onValueChange={(next) => patchRuleState({ controlColumnNames: clampSelection(next, 5) })}
                                options={controlColumnNames}
                                disabled={!controlTableDef}
                                placeholder="Cari kolom..."
                              />
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="dq-start-date">Start Date</Label>
                            <Input
                              id="dq-start-date"
                              type="date"
                              value={ruleStartDate}
                              max={ruleEndDate || undefined}
                              onChange={(e) => setRuleStartDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="dq-end-date">End Date</Label>
                            <Input
                              id="dq-end-date"
                              type="date"
                              value={ruleEndDate}
                              min={ruleStartDate || undefined}
                              onChange={(e) => setRuleEndDate(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="dq-limit">Limit</Label>
                          <Input id="dq-limit" type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
                        </div>

                        <Button type="button" className="w-full" onClick={handleGenerateSql} disabled={!canGenerate}>
                          Generate SQL
                        </Button>
                      </>
                    )}
                  </>
                )}

                {subTab === "composer" && (
                  <ComposerFields
                    isEditing={Boolean(composer.key)}
                    columnNamesA={allColumnNames}
                    dimensionKeys={getDimensionKeys()}
                    composer={composer}
                    patchComposer={patchComposer}
                    patchTableB={patchTableB}
                    tableOptionsB={composerTableOptionsB}
                    columnNamesB={composerColumnNamesB}
                    periodColumnsB={composerPeriodColumnsB}
                    onDescribeB={handleComposerDescribeB}
                    canGenerate={canGenerateComposer}
                    onGenerateSql={handleComposerGenerateSql}
                  />
                )}
              </>
            )}
          </aside>

          <div className="flex h-full flex-1 flex-col items-start gap-4 overflow-y-auto p-8 pt-6">
            {describedTable && showTableStructure && <TableStructure columns={describedTable.columns} />}

            {subTab === "profiling" && !showTableStructure && (
              <div className="flex w-full flex-col gap-0">
                {profile && (
                  <div className="flex w-full justify-end">
                    <Button variant="outline" size="sm" onClick={handleExportProfile}>
                      <Download className="size-4" />
                      Export
                    </Button>
                  </div>
                )}
                <ProfilingResults profile={profile} isLoading={isProfiling} />
              </div>
            )}

            {subTab === "rules" && !showTableStructure && (
              <>
                <div className="flex w-full flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">SQL Editor</p>
                  {sqlQuery ? (
                    <SqlEditor
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="h-[450px]"
                    />
                  ) : describedTable ? (
                    <div className="h-[450px] overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <p className="mb-3 text-xs text-muted-foreground">
                        Table described. Configure a rule on the left, then Generate SQL.
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>column_name</TableHead>
                            <TableHead>type</TableHead>
                            <TableHead>is_period</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {describedTable.columns.map((c) => (
                            <TableRow key={c.column}>
                              <TableCell>{c.column}</TableCell>
                              <TableCell>{c.type}</TableCell>
                              <TableCell>{String(c.is_period)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex h-[450px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-muted-foreground">
                      Select a table and click Describe to get started.
                    </div>
                  )}
                </div>

                <Button type="button" onClick={handleRunAnalysis} disabled={!sqlQuery}>
                  <Play className="size-4" />
                  Run Analysis
                </Button>

                {analysisRows && (
                  <div className="w-full">
                    <p className="mb-2 text-sm font-medium text-foreground">Result</p>
                    <ResultTable rows={analysisRows} />
                  </div>
                )}
              </>
            )}

            {subTab === "composer" && !showTableStructure && (
              <div className="flex w-full flex-col gap-4">
                <ComposerResults
                  sqlQuery={composer.sqlQuery}
                  onSqlQueryChange={(v) => patchComposer({ sqlQuery: v })}
                  columnMode={composer.columnMode}
                  previewRows={composer.previewRows}
                  onRunAnalysis={handleComposerRunAnalysis}
                  onOpenSave={handleOpenSaveRule}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <SaveRuleDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        form={saveForm}
        onPatch={patchSaveForm}
        onSubmit={handleSubmitSaveRule}
      />
    </div>
  )
}
