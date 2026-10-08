import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import Topbar from "@/components/Topbar"
import PortalPage from "@/pages/PortalPage"
import ApplicationsPage from "@/pages/ApplicationsPage"
import EnrichDataAdminPage from "@/pages/EnrichDataAdminPage"
import EnrichDataAdminDetailPage from "@/pages/EnrichDataAdminDetailPage"
import EnrichDataAddPage from "@/pages/EnrichDataAddPage"
import CustomerDataOpsPage from "@/pages/CustomerDataOpsPage"
import CatalogKnowledgeLayout from "@/components/catalogKnowledge/CatalogKnowledgeLayout"
import BusinessGlossarySection from "@/pages/catalog-knowledge/BusinessGlossarySection"
import DataCatalogSection from "@/pages/catalog-knowledge/DataCatalogSection"
import FlowProcessSection from "@/pages/catalog-knowledge/FlowProcessSection"
import FlowProcessDetailPage from "@/pages/catalog-knowledge/FlowProcessDetailPage"
import MetadataLineageDiscoverySection from "@/pages/catalog-knowledge/MetadataLineageDiscoverySection"
import PassedKpiSection from "@/pages/catalog-knowledge/PassedKpiSection"
import DiscrepancySection from "@/pages/catalog-knowledge/DiscrepancySection"
import RegisterDataPage from "@/pages/RegisterDataPage"
import IncidentManagementPage from "@/pages/IncidentManagementPage"
import IncidentManagementDetailPage from "@/pages/IncidentManagementDetailPage"
import TicketingLayout from "@/components/ticketing/TicketingLayout"
import DashboardSection from "@/pages/ticketing-admin/DashboardSection"
import SlaManagementSection from "@/pages/ticketing-admin/SlaManagementSection"
import PicCategorySection from "@/pages/ticketing-admin/PicCategorySection"
import PicCategoryDetailSection from "@/pages/ticketing-admin/PicCategoryDetailSection"
import AuditLogSection from "@/pages/ticketing-admin/AuditLogSection"
import ManageUsersSection from "@/pages/ticketing-admin/ManageUsersSection"
import ContentModerationSection from "@/pages/ticketing-admin/ContentModerationSection"
import ManageCategoriesSection from "@/pages/ticketing-admin/ManageCategoriesSection"
import RootCauseAnalysisSection from "@/pages/ticketing-admin/RootCauseAnalysisSection"
import AppSidebarLayout from "@/components/AppSidebarLayout"
import DqExperiencePage from "@/pages/DqExperiencePage"
import IndyAssistantPage from "@/pages/IndyAssistantPage"

function App() {
  const { pathname } = useLocation()
  const hideTopbar =
    pathname === "/" ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/data-observability") ||
    pathname.startsWith("/ticketing") ||
    pathname.startsWith("/customer-data-ops") ||
    pathname.startsWith("/enrich-data/admin") ||
    pathname.startsWith("/catalog-knowledge") ||
    pathname.startsWith("/indy-assistant")

  return (
    <>
      {!hideTopbar && <Topbar />}
      <Routes>
        <Route path="/" element={<PortalPage />} />
        <Route path="/enrich-data/register" element={<RegisterDataPage />} />
        <Route path="/applications" element={<AppSidebarLayout />}>
          <Route index element={<ApplicationsPage />} />
        </Route>
        <Route path="/ticketing" element={<AppSidebarLayout />}>
          <Route element={<TicketingLayout />}>
            <Route index element={<IncidentManagementPage />} />
            <Route path="root-cause-analysis" element={<RootCauseAnalysisSection />} />
            <Route path=":id" element={<IncidentManagementDetailPage />} />
            <Route path="admin">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardSection />} />
              <Route path="sla" element={<SlaManagementSection />} />
              <Route path="pic-category" element={<PicCategorySection />} />
              <Route path="pic-category/:id" element={<PicCategoryDetailSection />} />
              <Route path="audit-log" element={<AuditLogSection />} />
              <Route path="manage-users" element={<ManageUsersSection />} />
              <Route path="content-moderation" element={<ContentModerationSection />} />
              <Route path="content-moderation/:id" element={<IncidentManagementDetailPage />} />
              <Route path="manage-categories" element={<ManageCategoriesSection />} />
            </Route>
          </Route>
        </Route>
        <Route path="/data-observability" element={<AppSidebarLayout />}>
          <Route index element={<DqExperiencePage />} />
        </Route>
        <Route path="/customer-data-ops" element={<AppSidebarLayout />}>
          <Route index element={<CustomerDataOpsPage />} />
        </Route>
        <Route path="/enrich-data/admin" element={<AppSidebarLayout />}>
          <Route index element={<EnrichDataAdminPage />} />
          <Route path="new" element={<EnrichDataAddPage />} />
          <Route path=":id" element={<EnrichDataAdminDetailPage />} />
        </Route>
        <Route path="/catalog-knowledge" element={<AppSidebarLayout />}>
          <Route element={<CatalogKnowledgeLayout />}>
            <Route index element={<Navigate to="business-glossary" replace />} />
            <Route path="business-glossary" element={<BusinessGlossarySection />} />
            <Route path="data-catalog" element={<DataCatalogSection />} />
            <Route path="flow-process" element={<FlowProcessSection />} />
            <Route path="flow-process/:id" element={<FlowProcessDetailPage />} />
            <Route path="metadata-lineage-discovery" element={<MetadataLineageDiscoverySection />} />
            <Route path="passed-kpi" element={<PassedKpiSection />} />
            <Route path="discrepancy" element={<DiscrepancySection />} />
          </Route>
        </Route>
        <Route path="/indy-assistant" element={<AppSidebarLayout />}>
          <Route index element={<IndyAssistantPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
