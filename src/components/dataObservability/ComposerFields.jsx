import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multi-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FieldSelect from "@/components/dataObservability/FieldSelect"
import { DQ_SCHEMAS } from "@/data/dqComposerMockData"

// Schema/Table/Describe/Period for Table A live in the shared DQ Composer
// aside — this renders the Composer sub-tab's own fields (dimension, rule
// name, mode toggle, numerator/denominator, and Table B when in Multiple
// Column mode).
export default function ComposerFields({
  isEditing,
  columnNamesA,
  dimensionKeys,
  composer,
  patchComposer,
  patchTableB,
  tableOptionsB,
  columnNamesB,
  periodColumnsB,
  onDescribeB,
  canGenerate,
  onGenerateSql,
}) {
  const { tableB } = composer

  return (
    <>
      <p className="text-sm font-medium text-foreground">{isEditing ? "Edit Formula" : "Add New Rule"}</p>

      <FieldSelect
        id="rule-dimension"
        label="Dimension"
        value={composer.dimension}
        onValueChange={(v) => patchComposer({ dimension: v })}
        options={dimensionKeys}
      />

      <div className="space-y-1.5">
        <Label htmlFor="rule-name">Nama Rule</Label>
        <Input
          id="rule-name"
          placeholder="e.g. Phone Format Check"
          value={composer.ruleName}
          onChange={(e) => patchComposer({ ruleName: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-description">Description</Label>
        <Input
          id="rule-description"
          placeholder="One sentence describing what this rule flags"
          value={composer.description}
          onChange={(e) => patchComposer({ description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Mode Kolom</Label>
        <Tabs value={composer.columnMode} onValueChange={(v) => patchComposer({ columnMode: v, sqlQuery: "", previewRows: null })}>
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              Single Column
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex-1">
              Multiple Column
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-column-name">Column Name (optional)</Label>
        <Input
          id="rule-column-name"
          placeholder="Example : site_id"
          value={composer.columnName}
          onChange={(e) => patchComposer({ columnName: e.target.value })}
        />
      </div>

      {composer.columnMode === "multiple" && (
        <div className="space-y-1.5">
          <Label htmlFor="join-a">Field Join (Table A) — {composer.joinColumnsA.length} dipilih</Label>
          <MultiSelect
            id="join-a"
            value={composer.joinColumnsA}
            onValueChange={(next) => patchComposer({ joinColumnsA: next })}
            options={columnNamesA}
            placeholder="Cari kolom..."
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="rule-numerator">Numerator {composer.columnMode === "multiple" && "(dari Table A)"} *</Label>
        <Textarea
          id="rule-numerator"
          placeholder="Example : count() - count(case when site_id is null then 1 else 0 end)"
          value={composer.numerator}
          onChange={(e) => patchComposer({ numerator: e.target.value, sqlQuery: "", previewRows: null })}
          className="field-sizing-fixed h-20 resize-none font-mono text-xs"
        />
      </div>

      {composer.columnMode === "single" && (
        <div className="space-y-1.5">
          <Label htmlFor="rule-denominator">Denominator</Label>
          <Textarea
            id="rule-denominator"
            placeholder="Example : count() — kosongkan untuk NULL"
            value={composer.denominator}
            onChange={(e) => patchComposer({ denominator: e.target.value, sqlQuery: "", previewRows: null })}
            className="field-sizing-fixed h-16 resize-none font-mono text-xs"
          />
        </div>
      )}

      {composer.columnMode === "multiple" && (
        <>
          <div className="h-px w-full bg-border" />
          <p className="text-xs font-medium text-muted-foreground uppercase">Table B</p>

          <FieldSelect id="composer-schema-b" label="Schema" value={DQ_SCHEMAS[0]} onValueChange={() => {}} options={DQ_SCHEMAS} />
          <FieldSelect
            id="composer-table-b"
            label="Table"
            value={tableB.tableName}
            onValueChange={(v) => patchTableB({ tableName: v, describedTable: null, joinColumns: [] })}
            options={tableOptionsB}
            placeholder="Select a table"
          />
          <Button type="button" variant="outline" className="w-full" onClick={onDescribeB} disabled={!tableB.tableName}>
            Describe
          </Button>

          {tableB.describedTable && (
            <>
              <FieldSelect
                id="composer-period-b"
                label="Period (Table B)"
                value={tableB.partitionColumn}
                onValueChange={(v) => patchTableB({ partitionColumn: v })}
                options={periodColumnsB}
              />

              <div className="space-y-1.5">
                <Label htmlFor="join-b">Field Join (Table B) — {tableB.joinColumns.length} dipilih</Label>
                <MultiSelect
                  id="join-b"
                  value={tableB.joinColumns}
                  onValueChange={(next) => patchTableB({ joinColumns: next })}
                  options={columnNamesB}
                  placeholder="Cari kolom..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rule-denominator-b">Denominator (dari Table B) *</Label>
                <Textarea
                  id="rule-denominator-b"
                  placeholder="Example : count()"
                  value={composer.denominator}
                  onChange={(e) => patchComposer({ denominator: e.target.value, sqlQuery: "", previewRows: null })}
                  className="field-sizing-fixed h-16 resize-none font-mono text-xs"
                />
              </div>
            </>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="rule-start-date">Start Date</Label>
          <Input
            id="rule-start-date"
            type="date"
            value={composer.startDate}
            max={composer.endDate || undefined}
            onChange={(e) => patchComposer({ startDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-end-date">End Date</Label>
          <Input
            id="rule-end-date"
            type="date"
            value={composer.endDate}
            min={composer.startDate || undefined}
            onChange={(e) => patchComposer({ endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-limit">Limit</Label>
        <Input id="rule-limit" type="number" value={composer.limit} onChange={(e) => patchComposer({ limit: e.target.value })} />
      </div>

      <Button type="button" className="w-full" onClick={onGenerateSql} disabled={!canGenerate}>
        Generate SQL
      </Button>
    </>
  )
}
