# 📋 Modals Breakdown - Construct AI

**Detailed analysis of all modal dialogs in the system.**

## 📋 Overview

This document contains detailed information about each modal dialog found in the Construct AI system.

## 📊 Statistics

- **Total Modals**: 1
- **Types**: 1
- **Generated**: 2026-03-11T06:15:13.642Z

## 📋 Modal Details

### 1. Documentation Audit Results

**Type**: Modal

**File**: `client/src/pages/02050-information-technology/components/DevSettings/DocumentationManager.jsx`

**Pattern**: Modal with title

**Page Type**: 02050-information-technology

**Opened By**:
- Button: `setActiveView('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard` (in WorkflowDemo.jsx)
- Button: `setActiveView('buttons')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'buttons'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔘 Individual Buttons` (in WorkflowDemo.jsx)
- Button: `setActiveView('visualizer')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeView === 'visualizer'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📈 Visualizer` (in WorkflowDemo.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 66-UpsertCloudModal.jsx)
- Button: `Cancel` (in 66-UpsertCloudModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 192-UpsertCloudModal.jsx)
- Button: `Cancel` (in 192-UpsertCloudModal.jsx)
- Button: `Close` (in 03000-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 03000-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 03000-VectorDataManagerModal.jsx)
- Button: `Close` (in 02500-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 02500-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 02500-VectorDataManagerModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 02400-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 02400-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 02400-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 02400-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 02400-VectorDataManagerModal.jsx)
- Button: `Close` (in 02400-VectorDataManagerModal.jsx)
- Button: `onViewDetails(result)}
                  >
                    👁️ Review` (in EvaluationResultsTable.jsx)
- Button: `onViewDetails(result, true)}
                  >
                    📋 View` (in EvaluationResultsTable.jsx)
- Button: `onAcceptEvaluation(result)}
                      >
                        ✓ Accept` (in EvaluationResultsTable.jsx)
- Button: `onRejectEvaluation(result)}
                      >
                        ✗ Reject` (in EvaluationResultsTable.jsx)
- Button: `setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === 1 ? "#f8f9fa" : "white",
              color: currentPage === 1 ? "#999" : "#007bff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            « First` (in EvaluationResultsTable.jsx)
- Button: `setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === 1 ? "#f8f9fa" : "white",
              color: currentPage === 1 ? "#999" : "#007bff",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            ‹ Prev` (in EvaluationResultsTable.jsx)
- Button: `setCurrentPage(pageNum)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  backgroundColor:
                    currentPage === pageNum ? "#007bff" : "white",
                  color: currentPage === pageNum ? "white" : "#007bff",
                  cursor: "pointer",
                  fontSize: "12px",
                  minWidth: "36px",
                }}
              >
                {pageNum}` (in EvaluationResultsTable.jsx)
- Button: `setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white",
              color: currentPage === totalPages ? "#999" : "#007bff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            Next ›` (in EvaluationResultsTable.jsx)
- Button: `setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: currentPage === totalPages ? "#f8f9fa" : "white",
              color: currentPage === totalPages ? "#999" : "#007bff",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            Last »` (in EvaluationResultsTable.jsx)
- Button: `onEvaluationDetails && onEvaluationDetails(result)}
                        title="View detailed evaluation"
                      >
                        👁️ Review` (in EvaluationResults.jsx)
- Button: `{
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                        }}
                        title="Export evaluation data"
                      >
                        📋 Export` (in EvaluationResults.jsx)
- Button: `openDocumentUploadModal(activeTab)}
        >
          Upload Documents` (in ContractorVettingTabContent.jsx)
- Button: `analyzeSection(activeTab)}
      >
        {getAnalyzeButtonText(activeTab)}` (in ContractorVettingTabContent.jsx)
- Button: `setShowEvaluationDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×` (in ContractorVettingModals.jsx)
- Button: `setShowFullDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                ×` (in ContractorVettingModals.jsx)
- Button: `window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page` (in 02400-contractor-vetting-page.lazy.jsx)
- Button: `this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry` (in 02400-contractor-vetting-page.lazy.jsx)
- Button: `Close` (in 02250-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 02250-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 02250-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 02250-UpsertCloudModal.jsx)
- Button: `Cancel` (in 02250-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 02200-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 02200-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 02200-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 02200-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 02200-VectorDataManagerModal.jsx)
- Button: `Close` (in 02200-VectorDataManagerModal.jsx)
- Button: `workflowStateManager?.pauseWorkflow?.()}
          disabled={currentState?.status !== 'active'}
        >
          ⏸️ Pause` (in WorkflowVisualizerTab.jsx)
- Button: `workflowStateManager?.resumeWorkflow?.()}
          disabled={currentState?.status !== 'paused'}
        >
          ▶️ Resume` (in WorkflowVisualizerTab.jsx)
- Button: `workflowStateManager?.resetWorkflow?.()}
        >
          🔄 Reset` (in WorkflowVisualizerTab.jsx)
- Button: `{
              try {
                performanceMonitor?.recordTaskStart?.(`test_task_${Date.now()}`, 'performance_test');
                setTimeout(() => {
                  performanceMonitor?.recordTaskComplete?.(`test_task_${Date.now()}`, true, { testResult: 'success' });
                }, 1000);
              } catch (error) {
                console.error('[PerformanceTab] Error recording success:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Record Success` (in PerformanceTab.jsx)
- Button: `{
              try {
                performanceMonitor?.recordTaskStart?.(`test_task_${Date.now()}`, 'performance_test');
                setTimeout(() => {
                  performanceMonitor?.recordTaskComplete?.(`test_task_${Date.now()}`, false, { error: 'Test failure' });
                }, 500);
              } catch (error) {
                console.error('[PerformanceTab] Error recording failure:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Record Failure` (in PerformanceTab.jsx)
- Button: `{
              try {
                performanceMonitor?.recordAgentHealth?.('healthy');
              } catch (error) {
                console.error('[PerformanceTab] Error setting health:', error);
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Set Healthy` (in PerformanceTab.jsx)
- Button: `{
            const taskId = hitl.createHITLTask('test_agent', 'approval_required', { test: true }, 'normal');
            alert(`Created test HITL task: ${taskId}`);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Create Test Task` (in HITLTab.jsx)
- Button: `handleAssignToMe(task.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Assign to Me` (in HITLTab.jsx)
- Button: `setSelectedTask(task)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Review` (in HITLTab.jsx)
- Button: `setSelectedTask(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel` (in HITLTab.jsx)
- Button: `handleResolve(selectedTask.id, 'rejected')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reject` (in HITLTab.jsx)
- Button: `handleResolve(selectedTask.id, 'approved')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Approve` (in HITLTab.jsx)
- Button: `Close` (in 02100-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 02100-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 02100-VectorDataManagerModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 02076-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 02076-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 02076-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 02076-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 02076-VectorDataManagerModal.jsx)
- Button: `Close` (in 02076-VectorDataManagerModal.jsx)
- Button: `Close` (in 02076-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 02076-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 02076-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 02076-UpsertUrlModal.jsx)
- Button: `Cancel` (in 02076-UpsertFileModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 02075-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 02075-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 02075-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 02075-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 02075-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 02075-VectorDataManagerModal.jsx)
- Button: `Close` (in 02075-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 02075-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 02075-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 02075-UpsertFileModal.jsx)
- Button: `Cancel` (in 02075-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 02075-UpsertCloudModal.jsx)
- Button: `Cancel` (in 02075-UpsertCloudModal.jsx)
- Button: `Retry` (in SchemaDashboard.jsx)
- Button: `Refresh Data` (in SchemaDashboard.jsx)
- Button: `Close` (in SchemaDashboard.jsx)
- Button: `Close` (in SchemaDashboard.jsx)
- Button: `e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Retry` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('alerts')}
                  style={{
                    fontSize: '14px',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  View All Alerts →` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('alerts')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🚨 View Security Alerts` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('history')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📅 Audit History` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('tables')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🗄️ Table Security Status` (in RLSSecurityDashboard.jsx)
- Button: `🔄 Refresh Dashboard` (in RLSSecurityDashboard.jsx)
- Button: `Clear Selection` (in RLSSecurityDashboard.jsx)
- Button: `📋 Copy` (in RLSSecurityDashboard.jsx)
- Button: `📄 JSON` (in RLSSecurityDashboard.jsx)
- Button: `📊 CSV` (in RLSSecurityDashboard.jsx)
- Button: `setFilterLevel(filter.key)}
                    style={{
                      padding: '16px 1px',
                      fontSize: '14px',
                      fontWeight: '500',
                      borderBottom: '2px solid transparent',
                      color: filterLevel === filter.key ? '#2563eb' : '#6b7280',
                      borderBottomColor: filterLevel === filter.key ? '#2563eb' : 'transparent',
                      marginRight: '32px'
                    }}
                  >
                    {filter.label}` (in RLSSecurityDashboard.jsx)
- Button: `Select All` (in RLSSecurityDashboard.jsx)
- Button: `Select None` (in RLSSecurityDashboard.jsx)
- Button: `Clear Selection` (in RLSSecurityDashboard.jsx)
- Button: `📋 Copy` (in RLSSecurityDashboard.jsx)
- Button: `📄 JSON` (in RLSSecurityDashboard.jsx)
- Button: `📊 CSV` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('overview')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ← Back to Overview` (in RLSSecurityDashboard.jsx)
- Button: `setTableFilter(filter.key)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: tableFilter === filter.key ? filter.color : '#f3f4f6',
                  color: tableFilter === filter.key ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.label}` (in RLSSecurityDashboard.jsx)
- Button: `Select All ({totalDisplayed})` (in RLSSecurityDashboard.jsx)
- Button: `Select None` (in RLSSecurityDashboard.jsx)
- Button: `setCurrentView('tables')}
                style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  marginRight: '16px',
                  cursor: 'pointer'
                }}
              >
                ←` (in RLSSecurityDashboard.jsx)
- Button: `openPolicyModal(policy.policyname)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                      >
                        View` (in RLSSecurityDashboard.jsx)
- Button: `setIsSearchMode(!isSearchMode)}
              style={{
                padding: '8px 16px',
                backgroundColor: isSearchMode ? '#3b82f6' : '#f3f4f6',
                color: isSearchMode ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔍 Search Alerts` (in RLSSecurityDashboard.jsx)
- Button: `setAdvancedSearchOpen(!advancedSearchOpen)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: advancedSearchOpen ? '#3b82f6' : '#f3f4f6',
                  color: advancedSearchOpen ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {advancedSearchOpen ? 'Hide Filters' : 'Show Filters'}` (in RLSSecurityDashboard.jsx)
- Button: `{
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchFilters({
                    searchIn: 'all',
                    alertLevel: 'all',
                    tableSecurity: 'all',
                    dateRange: 'all',
                    caseSensitive: false,
                    exactMatch: false,
                    excludePattern: ''
                  });
                  setIsSearchMode(false);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕ Clear All` (in RLSSecurityDashboard.jsx)
- Button: `✕` (in RLSSecurityDashboard.jsx)
- Button: `Close` (in RLSSecurityDashboard.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 02050-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 02050-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 02050-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 02050-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 02050-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 02050-VectorDataManagerModal.jsx)
- Button: `Close` (in 02050-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 02050-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 02050-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 02050-UpsertFileModal.jsx)
- Button: `Cancel` (in 02050-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 02050-UpsertCloudModal.jsx)
- Button: `Cancel` (in 02050-UpsertCloudModal.jsx)
- Button: `{
                setSearchTerm("");
                setActiveFilters({ category: '', severity: '', status: '', sector: '' });
              }}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#000000',
                border: '2px solid #ffa500',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                lineHeight: '1.5',
                height: '31px',
                display: 'inline-block',
                textAlign: 'center',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fff8f2';
                e.target.style.borderColor = '#ffb733';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#ffa500';
              }}
            >
              Clear Filters` (in ErrorTracking.jsx)
- Button: `{
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel` (in ErrorTracking.jsx)
- Button: `{
              e.target.style.backgroundColor = '#ffb733';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ffa500';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Create Error Tracking` (in ErrorTracking.jsx)
- Button: `×` (in ErrorTracking.jsx)
- Button: `setEditMode(false)} style={{ background: '#f8f9fa', color: '#000000', border: '2px solid #ddd' }}>Cancel` (in ErrorTracking.jsx)
- Button: `Save Changes` (in ErrorTracking.jsx)
- Button: `×` (in ErrorTracking.jsx)
- Button: `setEditMode(true)} className="orange-button">Edit` (in ErrorTracking.jsx)
- Button: `×` (in ErrorTracking.jsx)
- Button: `Generate Suggestions` (in EnhancePromptModal.jsx)
- Button: `Attach Files` (in EnhancePromptModal.jsx)
- Button: `removeFile(index)}
                            >
                              Remove` (in EnhancePromptModal.jsx)
- Button: `Add` (in EnhancePromptModal.jsx)
- Button: `removeUrl(index)}
                            >
                              Remove` (in EnhancePromptModal.jsx)
- Button: `Cancel` (in EnhancePromptModal.jsx)
- Button: `Apply Enhancements` (in EnhancePromptModal.jsx)
- Button: `Generate Suggestions` (in EnhancePromptModal.jsx)
- Button: `Attach Files` (in EnhancePromptModal.jsx)
- Button: `removeFile(index)}
                            >
                              Remove` (in EnhancePromptModal.jsx)
- Button: `Add` (in EnhancePromptModal.jsx)
- Button: `removeUrl(index)}
                            >
                              Remove` (in EnhancePromptModal.jsx)
- Button: `Cancel` (in EnhancePromptModal.jsx)
- Button: `Apply Enhancements` (in EnhancePromptModal.jsx)
- Button: `setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={ariaLabel}
        className={`btn ${type === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`}
      >
        {children}` (in VoiceCallManagement.jsx)
- Button: `setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={tooltip}
        title={tooltip}
        className={`btn btn-sm ${type === 'delete' ? 'btn-danger' : 'btn-info'}`}
      >
        {icon}` (in VoiceCallManagement.jsx)
- Button: `onChange(current - 1, pageSize)} disabled={current === 1}>
              Previous` (in VoiceCallManagement.jsx)
- Button: `onChange(pageNum, pageSize)}>{pageNum}` (in VoiceCallManagement.jsx)
- Button: `onChange(current + 1, pageSize)} disabled={current === pages}>
              Next` (in VoiceCallManagement.jsx)
- Button: `setModalVisible(false)} className="btn-close" aria-label="Close">` (in VoiceCallManagement.jsx)
- Button: `setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}` (in SimpleExternalApiSettings.jsx)
- Button: `Cancel` (in SimpleExternalApiSettings.jsx)
- Button: `handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit` (in SimpleExternalApiSettings.jsx)
- Button: `handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete` (in SimpleExternalApiSettings.jsx)
- Button: `+ Create New Prompt` (in PromptsManagement.jsx)
- Button: `handleSort('name')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by name"
                          >
                            Name & Key {getSortIcon('name')}` (in PromptsManagement.jsx)
- Button: `handleSort('type')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by type"
                          >
                            Type & Role {getSortIcon('type')}` (in PromptsManagement.jsx)
- Button: `handleSort('category')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by category"
                          >
                            Category {getSortIcon('category')}` (in PromptsManagement.jsx)
- Button: `handleSort('tags')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by tags count"
                          >
                            🏷️ Tags {getSortIcon('tags')}` (in PromptsManagement.jsx)
- Button: `handleSort('date_added')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by date added"
                          >
                            📅 Date Added {getSortIcon('date_added')}` (in PromptsManagement.jsx)
- Button: `handleSort('is_active')}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              fontSize: 'inherit',
                              fontWeight: 'inherit',
                              textAlign: 'left',
                              width: '100%'
                            }}
                            title="Sort by status"
                          >
                            Status {getSortIcon('is_active')}` (in PromptsManagement.jsx)
- Button: `handleEdit(prompt)}
                              title="Edit"
                            >
                              ✏️` (in PromptsManagement.jsx)
- Button: `handleEnhance(prompt)}
                              title="Enhance"
                            >
                              ✨` (in PromptsManagement.jsx)
- Button: `handleDelete(prompt.id)}
                              title="Delete"
                            >
                              🗑️` (in PromptsManagement.jsx)
- Button: `setShowModal(false)}
              >
                ×` (in PromptsManagement.jsx)
- Button: `setShowModal(false)}>
                Cancel` (in PromptsManagement.jsx)
- Button: `🧹 Clear Filters` (in ExternalApiSettings.jsx)
- Button: `setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Add New API Configuration'}` (in ExternalApiSettings.jsx)
- Button: `Cancel` (in ExternalApiSettings.jsx)
- Button: `handleTestApi(config)}
                    className="btn btn-outline"
                    disabled={testingApi === config.id || loading}
                  >
                    {testingApi === config.id ? 'Testing...' : 'Test Connection'}` (in ExternalApiSettings.jsx)
- Button: `handleEdit(config)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Edit` (in ExternalApiSettings.jsx)
- Button: `handleDelete(config.id)}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    Delete` (in ExternalApiSettings.jsx)
- Button: `setAuditModalVisible(false)}>
            Close` (in DocumentationManager.jsx)
- Button: `setAuditModalVisible(false)}>
            Close` (in DocumentationManager.jsx)
- Button: `setActiveTab(key)}
          >
            {label}` (in 02050-simulator-ui.jsx)
- Button: `runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'logic')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'runtime')}
                        disabled={runningTests.has(key)}
                      >
                        {runningTests.has(key) ? 'Running...' : 'Run Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'workflow')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Simulation'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'scale')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Run Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(testKey, category)}
                          disabled={simulationStatus.isRunning}
                        >
                          {isRunning ? 'Running...' : 'Run Test'}` (in 02050-simulator-ui.jsx)
- Button: `runTest(key, 'runtime')}
                      disabled={runningTests.has(key)}
                    >
                      {runningTests.has(key) ? 'Running...' : 'Start Runtime Test'}` (in 02050-simulator-ui.jsx)
- Button: `handleStateChange("templates")}
              >
                Templates` (in EngineeringTemplatesPage.jsx)
- Button: `handleStateChange("create")}
              >
                Create New` (in EngineeringTemplatesPage.jsx)
- Button: `handleStateChange("projects")}
              >
                Project Integration` (in EngineeringTemplatesPage.jsx)
- Button: `handleStateChange("collaboration")}
              >
                Cross-Discipline` (in EngineeringTemplatesPage.jsx)
- Button: `handleStateChange("analytics")}
              >
                Analytics` (in EngineeringTemplatesPage.jsx)
- Button: `Clear Filters` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("EngineeringTemplateCreateModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  New Engineering Template` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("EngineeringTemplateImportModal", {
                    triggerPage: PAGE_ID,
                    onSuccess: fetchTemplates
                  })}
                >
                  Import from CAD/Drawings` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("ProjectTemplateMappingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Map Templates to Projects` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("ProjectTemplateSyncModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Sync Project Templates` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("CrossDisciplineReviewModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Cross-Discipline Review` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("TemplateSharingModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Share Templates` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("EngineeringTemplateStatsModal", {
                    triggerPage: PAGE_ID
                  })}
                >
                  Template Usage Analytics` (in EngineeringTemplatesPage.jsx)
- Button: `openModal("ComplianceReportModal", {
                    discipline: 'engineering',
                    triggerPage: PAGE_ID
                  })}
                >
                  Engineering Compliance Report` (in EngineeringTemplatesPage.jsx)
- Button: `setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×` (in EngineeringTemplatesPage.jsx)
- Button: `setShowViewModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer'
                }}
              >
                Close` (in EngineeringTemplatesPage.jsx)
- Button: `{
                  setShowViewModal(false);
                  handleUseTemplate(selectedTemplate);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #FFA500',
                  backgroundColor: '#FFA500',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Use Template` (in EngineeringTemplatesPage.jsx)
- Button: `setShowDeleteModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ×` (in EngineeringTemplatesPage.jsx)
- Button: `setShowDeleteModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  cursor: 'pointer'
                }}
              >
                Cancel` (in EngineeringTemplatesPage.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 02025-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 02025-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 02025-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 02025-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 02025-VectorDataManagerModal.jsx)
- Button: `Close` (in 02025-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 02025-UpsertUrlModal.jsx)
- Button: `{isImporting ? "Importing..." : "Import from URL"}` (in 02025-UpsertUrlModal.jsx)
- Button: `removeFile(file.id)}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remove` (in 02025-UpsertFileModal.jsx)
- Button: `Cancel` (in 02025-UpsertFileModal.jsx)
- Button: `{isUploading ? "Uploading..." : "Upload Files"}` (in 02025-UpsertFileModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 02000-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 02000-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 02000-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 02000-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 02000-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 02000-VectorDataManagerModal.jsx)
- Button: `Close` (in 02000-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 02000-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 02000-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 02000-UpsertFileModal.jsx)
- Button: `Cancel` (in 02000-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 02000-UpsertCloudModal.jsx)
- Button: `Cancel` (in 02000-UpsertCloudModal.jsx)
- Button: `navigate('/01900-procurement')}>
            Back to Procurement` (in ProcurementOrderDetailsPage.jsx)
- Button: `navigate('/01900-procurement')}>
            Back to Procurement` (in ProcurementOrderDetailsPage.jsx)
- Button: `navigate('/01900-procurement')}
          >
            ← Back to Procurement` (in ProcurementOrderDetailsPage.jsx)
- Button: `window.open(order.main_document_url, '_blank')}
            >
              📄 View Final Document` (in ProcurementOrderDetailsPage.jsx)
- Button: `window.open(order.approval_cover_url, '_blank')}
            >
              📋 View Cover Sheet` (in ProcurementOrderDetailsPage.jsx)
- Button: `setActiveTab('overview')}
        >
          Overview` (in ProcurementOrderDetailsPage.jsx)
- Button: `setActiveTab('contributions')}
        >
          Contributions` (in ProcurementOrderDetailsPage.jsx)
- Button: `setActiveTab('documents')}
        >
          Documents` (in ProcurementOrderDetailsPage.jsx)
- Button: `setActiveTab('approvals')}
        >
          Approvals` (in ProcurementOrderDetailsPage.jsx)
- Button: `window.open(order.main_document_url, '_blank')}
                        >
                          📄 View PDF` (in ProcurementOrderDetailsPage.jsx)
- Button: `window.open(order.approval_cover_url, '_blank')}
                        >
                          📋 View PDF` (in ProcurementOrderDetailsPage.jsx)
- Button: `onRemoveSection(section.id)}
              style={{
                backgroundColor: "white",
                color: "black",
                border: "2px solid #dc3545",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                flexShrink: 0
              }}
              title="Remove from variation"
            >
              ×` (in VariationCanvas.jsx)
- Button: `×` (in TemplateTypeManager.jsx)
- Button: `{loading ? 'Creating...' : 'Create'}` (in TemplateTypeManager.jsx)
- Button: `Cancel` (in TemplateTypeManager.jsx)
- Button: `{loading ? 'Updating...' : 'Update'}` (in TemplateTypeManager.jsx)
- Button: `Cancel` (in TemplateTypeManager.jsx)
- Button: `startEdit(type)}
                      disabled={loading}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #fd7e14",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        opacity: loading ? 0.5 : 1
                      }}
                      title="Edit template type"
                    >
                      Edit` (in TemplateTypeManager.jsx)
- Button: `handleDelete(type.id || type.code, type.name)}
                      disabled={loading}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #dc3545",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "11px",
                        opacity: loading ? 0.5 : 1
                      }}
                      title="Delete template type"
                    >
                      Delete` (in TemplateTypeManager.jsx)
- Button: `Cancel` (in SectionLibrary.jsx)
- Button: `setSearchTerm('')}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#6c757d",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Clear search"
            >
              ×` (in SectionLibrary.jsx)
- Button: `toggle(app.id)}
                style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  border: '1px solid #dee2e6',
                  backgroundColor: statuses[app.id] === 'completed' ? '#d4edda' : '#fff',
                  color: statuses[app.id] === 'completed' ? '#155724' : '#495057',
                  fontWeight: 500
                }}
              >
                {statuses[app.id] === 'completed' ? '✅ Done' : 'Mark Done'}` (in ProcurementWorkflowOrchestrator.jsx)
- Button: `Skip (Not Guinea)` (in ProcurementWorkflowOrchestrator.jsx)
- Button: `onOrderSelect?.(order)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          View Details` (in ProcurementAccordion.jsx)
- Button: `Retry` (in FormattingStandardsManager.jsx)
- Button: `Preview` (in FormattingStandardsManager.jsx)
- Button: `Reset to Defaults` (in FormattingStandardsManager.jsx)
- Button: `{saving ? 'Saving...' : 'Save Standards'}` (in FormattingStandardsManager.jsx)
- Button: `setActiveTab('fonts')}
        >
          Fonts` (in FormattingStandardsManager.jsx)
- Button: `setActiveTab('spacing')}
        >
          Spacing` (in FormattingStandardsManager.jsx)
- Button: `setActiveTab('page')}
        >
          Page Layout` (in FormattingStandardsManager.jsx)
- Button: `setActiveTab('numbering')}
        >
          Numbering` (in FormattingStandardsManager.jsx)
- Button: `setActiveTab('colors')}
        >
          Colors` (in FormattingStandardsManager.jsx)
- Button: `setPreviewHTML('')}>×` (in FormattingStandardsManager.jsx)
- Button: `{
            // Find and close the modal
            const modal = document.querySelector('.modal-overlay.active');
            if (modal) {
              document.body.removeChild(modal);
            } else {
              window.history.back();
            }
          })}
        >
          Close` (in DocumentAssemblyDashboard.jsx)
- Button: `{assemblyInProgress ? "Assembling..." : "Start Document Assembly"}` (in DocumentAssemblyDashboard.jsx)
- Button: `Test Workflow` (in CreateOrderModal.jsx)
- Button: `Cancel` (in CreateOrderModal.jsx)
- Button: `{loading ? "Creating..." : "Create Order"}` (in CreateOrderModal.jsx)
- Button: `setSelectedContribution(null)}
              >
                ×` (in ContributionTracker.jsx)
- Button: `setSelectedContribution(null)}
              >
                Cancel` (in ContributionTracker.jsx)
- Button: `{saving ? 'Saving...' : 'Save Contribution'}` (in ContributionTracker.jsx)
- Button: `Refresh Status` (in ContributionTracker.jsx)
- Button: `{generating ? 'Generating...' : 'Generate Final Documents'}` (in ContributionTracker.jsx)
- Button: `×` (in ChangeSummaryPanel.jsx)
- Button: `Export Changes` (in ChangeSummaryPanel.jsx)
- Button: `Close` (in ChangeSummaryPanel.jsx)
- Button: `Undo` (in ChangeSummaryPanel.jsx)
- Button: `Export Changes` (in ChangeSummaryPanel.jsx)
- Button: `Close` (in ChangeSummaryPanel.jsx)
- Button: `Undo` (in ChangeSummaryPanel.jsx)
- Button: `×` (in ChangeSummaryPanel.jsx)
- Button: `Save` (in ActionPanel.jsx)
- Button: `{
                  setShowNameInput(false);
                  setVariationName("");
                  setVariationTemplateType("");
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "2px solid #6c757d",
                  backgroundColor: "white",
                  color: "black",
                  cursor: "pointer",
                  fontSize: "11px"
                }}
              >
                Cancel` (in ActionPanel.jsx)
- Button: `setShowVariationManager(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c757d",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0",
                  lineHeight: "1"
                }}
                title="Close"
              >
                ×` (in ActionPanel.jsx)
- Button: `{
                        onLoadVariation(variation);
                        setShowVariationManager(false);
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #4A89DC",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Load variation"
                    >
                      Load` (in ActionPanel.jsx)
- Button: `{
                        onDuplicateVariation(variation);
                        setShowVariationManager(false);
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #28a745",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Duplicate variation"
                    >
                      Copy` (in ActionPanel.jsx)
- Button: `{
                        if (confirm(`Are you sure you want to delete "${variation.name}"? This action cannot be undone.`)) {
                          onDeleteVariation(variation.id, variation.name);
                        }
                      }}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "white",
                        color: "black",
                        border: "2px solid #dc3545",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                      title="Delete variation"
                    >
                      Delete` (in ActionPanel.jsx)
- Button: `← Return to Chat` (in OrderPreview.jsx)
- Button: `✏️ Edit Data` (in OrderPreview.jsx)
- Button: `{isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}` (in OrderPreview.jsx)
- Button: `✏️ Edit Data` (in OrderPreview.jsx)
- Button: `{isProcessing ? '⏳ Creating Order...' : '📤 Create Order'}` (in OrderPreview.jsx)
- Button: `← Go Back` (in OrderHandoff.jsx)
- Button: `← Go Back` (in OrderHandoff.jsx)
- Button: `{isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}` (in OrderHandoff.jsx)
- Button: `← Go Back` (in OrderHandoff.jsx)
- Button: `{isProcessing ? '⏳ Creating Order...' : '✅ Confirm & Create Order'}` (in OrderHandoff.jsx)
- Button: `None of the above apply - Skip` (in RequirementsSelectionCard.jsx)
- Button: `← Back` (in RequirementsSelectionCard.jsx)
- Button: `Next →` (in RequirementsSelectionCard.jsx)
- Button: `None of the above apply - Skip` (in RequirementsSelectionCard.jsx)
- Button: `← Back` (in RequirementsSelectionCard.jsx)
- Button: `Next →` (in RequirementsSelectionCard.jsx)
- Button: `None of the above apply - Skip` (in RequirementsSelectionCard.jsx)
- Button: `← Back` (in RequirementsSelectionCard.jsx)
- Button: `Next →` (in RequirementsSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleRegionClick(region);
                }}
              >
                Select {region.name}` (in RegionSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleRegionClick(region);
                }}
              >
                Select {region.name}` (in RegionSelectionCard.jsx)
- Button: `×` (in OrderSearchModal.jsx)
- Button: `setActiveTab('search')}
          >
            Search Orders` (in OrderSearchModal.jsx)
- Button: `setActiveTab('recent')}
          >
            Recent Orders` (in OrderSearchModal.jsx)
- Button: `Clear` (in OrderSearchModal.jsx)
- Button: `×` (in OrderSearchModal.jsx)
- Button: `{loading ? 'Loading...' : 'Load Order for Editing'}` (in OrderSearchModal.jsx)
- Button: `Cancel` (in OrderSearchModal.jsx)
- Button: `Clear` (in OrderSearchModal.jsx)
- Button: `{loading ? 'Loading...' : 'Load Order for Editing'}` (in OrderSearchModal.jsx)
- Button: `Cancel` (in OrderSearchModal.jsx)
- Button: `×` (in OrderSearchModal.jsx)
- Button: `×` (in OrderSearchModal.jsx)
- Button: `onHide()}
          >
            Close` (in OrderDetailsModal.jsx)
- Button: `{
              handleEditOrder(selectedOrder);
              onHide();
            }}
          >
            Edit Order` (in OrderDetailsModal.jsx)
- Button: `setSearchTerm('')}
              aria-label="Clear search"
            >
              ×` (in ItemSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                Select {item.name.split(' ')[0]}` (in ItemSelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in ItemSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleItemClick(item);
                }}
              >
                Select {item.name.split(' ')[0]}` (in ItemSelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in ItemSelectionCard.jsx)
- Button: `setSearchTerm('')}
              aria-label="Clear search"
            >
              ×` (in GroupSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleGroupClick(group);
                }}
              >
                Select {group.name}` (in GroupSelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in GroupSelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleGroupClick(group);
                }}
              >
                Select {group.name}` (in GroupSelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in GroupSelectionCard.jsx)
- Button: `onHide()}
          >
            Cancel` (in EditOrderModal.jsx)
- Button: `{isLoading ? 'Updating...' : 'Update Order'}` (in EditOrderModal.jsx)
- Button: `onHide()}
          >
            Cancel` (in DeleteConfirmationModal.jsx)
- Button: `{
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.borderColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.borderColor = '#dc2626';
            }}
          >
            Delete Order` (in DeleteConfirmationModal.jsx)
- Button: `onHide()}
              >
                Cancel` (in CreateOrderModal.refactored.jsx)
- Button: `{showSequencePreview ? 'Hide Preview' : 'Show Preview'}` (in CreateOrderModal.jsx)
- Button: `onHide()}
              >
                Cancel` (in CreateOrderModal.jsx)
- Button: `setSearchTerm('')}
              aria-label="Clear search"
            >
              ×` (in CountrySelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleCountryClick(country);
                }}
              >
                Select {country.name}` (in CountrySelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in CountrySelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleCountryClick(country);
                }}
              >
                Select {country.name}` (in CountrySelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in CountrySelectionCard.jsx)
- Button: `setSearchTerm('')}
              aria-label="Clear search"
            >
              ×` (in CategorySelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleCategoryClick(category);
                }}
              >
                Select {category.name.split(',')[0]}` (in CategorySelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in CategorySelectionCard.jsx)
- Button: `{
                  e.stopPropagation();
                  handleCategoryClick(category);
                }}
              >
                Select {category.name.split(',')[0]}` (in CategorySelectionCard.jsx)
- Button: `setSearchTerm('')}
          >
            Clear search` (in CategorySelectionCard.jsx)
- Button: `e.target.style.background = '#e9ecef'}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ✕` (in CategoryIntelligencePanel.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 01900-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 01900-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 01900-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 01900-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 01900-VectorDataManagerModal.jsx)
- Button: `Close` (in 01900-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}` (in 01900-UpsertCloudModal.jsx)
- Button: `removeTag(tag)}
                        className="01900-tag-chip-remove"
                        aria-label={`Remove tag ${tag}`}
                        title="Remove tag"
                      >
                        ×` (in 01900-UpsertCloudModal.jsx)
- Button: `addTag(tagInput)}
                  disabled={!tagInput.trim()}
                  className="01900-btn 01900-btn-primary 01900-tag-add-btn 01900-btn-small"
                >
                  + Add Tag` (in 01900-UpsertCloudModal.jsx)
- Button: `Cancel` (in 01900-UpsertCloudModal.jsx)
- Button: `{loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}` (in 01900-UpsertCloudModal.jsx)
- Button: `{showSequencePreview ? 'Hide Preview' : 'Show Preview'}` (in TemplateSelectionPhase.jsx)
- Button: `handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}` (in RequirementsCardSystem.jsx)
- Button: `setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now` (in RequirementsCardSystem.jsx)
- Button: `handleCardComplete(activeCardId)}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? 'Saving...' : 'Complete Card'}` (in RequirementsCardSystem.jsx)
- Button: `setActiveCardId(null)}
            disabled={disabled || isProcessing}
          >
            Skip for Now` (in RequirementsCardSystem.jsx)
- Button: `onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×` (in ChatInterface.jsx)
- Button: `setShowSupplierPanel(false)}
            >
              ×` (in ChatInterface.jsx)
- Button: `📊 Extract` (in ChatInterface.jsx)
- Button: `✅ Validate` (in ChatInterface.jsx)
- Button: `{isProcessing ? '⏳' : '📤'}` (in ChatInterface.jsx)
- Button: `onSupplierAssign && onSupplierAssign(null)}
              title="Clear supplier"
            >
              ×` (in ChatInterface.jsx)
- Button: `📊 Extract` (in ChatInterface.jsx)
- Button: `✅ Validate` (in ChatInterface.jsx)
- Button: `{isProcessing ? '⏳' : '📤'}` (in ChatInterface.jsx)
- Button: `window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat` (in SOWViewer.jsx)
- Button: `window.print()}>
            🖨️ Print` (in SOWViewer.jsx)
- Button: `window.dispatchEvent(new CustomEvent('switch-to-chat-tab'))}
          >
            ← Return to Chat` (in SOWViewer.jsx)
- Button: `window.print()}>
            🖨️ Print` (in SOWViewer.jsx)
- Button: `Try Again` (in ModalErrorBoundary.jsx)
- Button: `window.location.reload()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Reload Page` (in ModalErrorBoundary.jsx)
- Button: `{saving ? "Saving..." : "💾 Save Weights"}` (in AgentWeightsConfig.jsx)
- Button: `🔄 Reset to Defaults` (in AgentWeightsConfig.jsx)
- Button: `🔄 Refresh` (in AgentWeightsConfig.jsx)
- Button: `{
              e.target.style.backgroundColor = contractsTheme.secondary;
            }}
            onMouseLeave={e => {
              e.target.style.backgroundColor = "white";
            }}
          >
            Previous` (in ContractorVettingModalFooter.jsx)
- Button: `Close` (in ContractorVettingModalFooter.jsx)
- Button: `Next` (in ContractorVettingModalFooter.jsx)
- Button: `{swarmRunning ? "Processing..." : "Complete Vetting"}` (in ContractorVettingModalFooter.jsx)
- Button: `Download Certificate` (in ContractorVettingModalFooter.jsx)
- Button: `Re-evaluate` (in ContractorVettingModalFooter.jsx)
- Button: `Complete` (in ContractorVettingModalFooter.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 01850-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 01850-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 01850-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 01850-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 01850-VectorDataManagerModal.jsx)
- Button: `Close` (in 01850-VectorDataManagerModal.jsx)
- Button: `🔄 Start New Vetting` (in ResultsStep.jsx)
- Button: `{
                    // Remove document functionality would be passed as prop
                    console.log("Remove document:", doc.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: contractsTheme.danger,
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px",
                  }}
                  title="Remove document"
                >
                  ×` (in DocumentUploadStep.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01800-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01800-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01800-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01800-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01800-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01800-VectorDataManagerModal.jsx)
- Button: `Close` (in 01800-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01800-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01800-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01800-UpsertFileModal.jsx)
- Button: `Cancel` (in 01800-UpsertFileModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 01750-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 01750-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 01750-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 01750-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 01750-VectorDataManagerModal.jsx)
- Button: `Close` (in 01750-VectorDataManagerModal.jsx)
- Button: `{
              e.stopPropagation();
              onRefresh();
            }}
          >
            🔄 Refresh` (in LogisticsOrderSelector.jsx)
- Button: `{
              e.stopPropagation();
              onRefresh();
            }}
          >
            🔄 Refresh` (in LogisticsOrderSelector.jsx)
- Button: `➕ Create` (in LogisticsModal.jsx)
- Button: `×` (in LogisticsModal.jsx)
- Button: `handleTabChange(tab.id)}
              >
                {tab.id === 'dashboard' && 'Dashboard'}
                {tab.id === 'cdc' && 'CDC'}
                {tab.id === 'documents' && 'Documents'}
                {tab.id === 'tracking' && 'Tracking'}
                {tab.id === 'compliance' && 'Compliance'}
                {tab.id === 'chat' && 'Chat'}` (in LogisticsModal.jsx)
- Button: `Change Order` (in LogisticsModal.jsx)
- Button: `{
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard` (in LogisticsModal.jsx)
- Button: `Close` (in LogisticsModal.jsx)
- Button: `×` (in LogisticsModal.jsx)
- Button: `Cancel` (in LogisticsModal.jsx)
- Button: `Save Changes` (in LogisticsModal.jsx)
- Button: `➕ Create` (in LogisticsModal.jsx)
- Button: `×` (in LogisticsModal.jsx)
- Button: `Change Order` (in LogisticsModal.jsx)
- Button: `{
                      // Open tracking interface
                      openModal('LogisticsTrackingModal', {
                        modalTitle: 'Shipment Tracking',
                        triggerPage: '01700-logistics'
                      });
                    }}
                  >
                    Open Tracking Dashboard` (in LogisticsModal.jsx)
- Button: `Close` (in LogisticsModal.jsx)
- Button: `×` (in LogisticsModal.jsx)
- Button: `Cancel` (in LogisticsModal.jsx)
- Button: `Save Changes` (in LogisticsModal.jsx)
- Button: `×` (in LogisticsChatModal.jsx)
- Button: `{isProcessing ? '⏳' : '📤'}` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help` (in LogisticsChatModal.jsx)
- Button: `×` (in LogisticsChatModal.jsx)
- Button: `{isProcessing ? '⏳' : '📤'}` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Validate current data')}
              disabled={isProcessing}
            >
              🔍 Validate Data` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Make supplier required')}
              disabled={isProcessing}
            >
              ✅ Make Supplier Required` (in LogisticsChatModal.jsx)
- Button: `setCurrentMessage('Help with document generation')}
              disabled={isProcessing}
            >
              📄 Document Help` (in LogisticsChatModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01700-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01700-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01700-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01700-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01700-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01700-VectorDataManagerModal.jsx)
- Button: `Close` (in 01700-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01700-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01700-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01700-UpsertFileModal.jsx)
- Button: `Cancel` (in 01700-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 01700-UpsertCloudModal.jsx)
- Button: `Cancel` (in 01700-UpsertCloudModal.jsx)
- Button: `handleCardAction(card.id, 'view-details')}
          >
            View details` (in DashboardTab.jsx)
- Button: `handleCardAction(card.id, 'manage-documents')}
          >
            Go to Documents` (in DashboardTab.jsx)
- Button: `handleCardAction(card.id, 'view-compliance')}
          >
            Open Compliance` (in DashboardTab.jsx)
- Button: `handleCardAction(card.id, 'create-cdc')}
          >
            Open CDC` (in DashboardTab.jsx)
- Button: `{
              if (tab.id !== 'dashboard') {
                await openLogisticsModal(tab.id, { procurementOrderId });
              }
            }}
          >
            {tab.name}` (in DashboardTab.jsx)
- Button: `Retry` (in DashboardTab.jsx)
- Button: `openLogisticsModal('documents', { procurementOrderId })}>Documents` (in DashboardTab.jsx)
- Button: `openLogisticsModal('tracking', { procurementOrderId })}>Tracking` (in DashboardTab.jsx)
- Button: `openLogisticsModal('compliance', { procurementOrderId })}>Compliance` (in DashboardTab.jsx)
- Button: `openLogisticsModal('documents', { procurementOrderId })}>Documents` (in DashboardTab.jsx)
- Button: `openLogisticsModal('tracking', { procurementOrderId })}>Tracking` (in DashboardTab.jsx)
- Button: `openLogisticsModal('compliance', { procurementOrderId })}>Compliance` (in DashboardTab.jsx)
- Button: `Retry` (in ComplianceTab.jsx)
- Button: `handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})` (in ComplianceTab.jsx)
- Button: `handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})` (in ComplianceTab.jsx)
- Button: `handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document` (in ComplianceTab.jsx)
- Button: `handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete` (in ComplianceTab.jsx)
- Button: `handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen` (in ComplianceTab.jsx)
- Button: `🔄 Refresh Status` (in ComplianceTab.jsx)
- Button: `openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard` (in ComplianceTab.jsx)
- Button: `handleCategoryChange('all')}
          >
            All Categories ({complianceData.totalRequirements})` (in ComplianceTab.jsx)
- Button: `handleCategoryChange(key)}
            >
              {category.name} ({category.requirements.length})` (in ComplianceTab.jsx)
- Button: `handleDocumentUpload(requirement.id)}
                        >
                          📎 Upload Document` (in ComplianceTab.jsx)
- Button: `handleStatusUpdate(requirement.id, 'completed')}
                        >
                          ✅ Mark Complete` (in ComplianceTab.jsx)
- Button: `handleStatusUpdate(requirement.id, 'pending')}
                        >
                          🔄 Reopen` (in ComplianceTab.jsx)
- Button: `🔄 Refresh Status` (in ComplianceTab.jsx)
- Button: `openLogisticsModal('dashboard', { procurementOrderId })}
        >
          📊 Back to Dashboard` (in ComplianceTab.jsx)
- Button: `Retry` (in CDCTab.jsx)
- Button: `handleAttachDocument(doc.id)}
                  >
                    Attach` (in CDCTab.jsx)
- Button: `{isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}` (in CDCTab.jsx)
- Button: `openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard` (in CDCTab.jsx)
- Button: `handleAttachDocument(doc.id)}
                  >
                    Attach` (in CDCTab.jsx)
- Button: `{isSubmitting ? 'Submitting...' : 'Submit CDC Declaration'}` (in CDCTab.jsx)
- Button: `openLogisticsModal('dashboard', { procurementOrderId })}
        >
          Back to Dashboard` (in CDCTab.jsx)
- Button: `{isValidating ? 'Validating...' : 'Validate Data'}` (in LogisticsDocumentGenerator.jsx)
- Button: `0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}` (in LogisticsDocumentGenerator.jsx)
- Button: `0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}` (in LogisticsDocumentGenerator.jsx)
- Button: `{isValidating ? 'Validating...' : 'Validate Data'}` (in LogisticsDocumentGenerator.jsx)
- Button: `0}
          >
            {isProcessing ? 'Generating...' : `Generate ${selectedDocumentType ? availableDocuments.find(d => d.value === selectedDocumentType)?.label : 'Document'}`}` (in LogisticsDocumentGenerator.jsx)
- Button: `0}
          >
            {isProcessing ? 'Generating...' : `Generate All Required (${availableDocuments.filter(d => d.required).length})`}` (in LogisticsDocumentGenerator.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01500-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01500-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01500-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01500-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01500-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01500-VectorDataManagerModal.jsx)
- Button: `Close` (in 01500-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01500-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01500-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01500-UpsertFileModal.jsx)
- Button: `Cancel` (in 01500-UpsertFileModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 01400-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 01400-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 01400-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 01400-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 01400-VectorDataManagerModal.jsx)
- Button: `Close` (in 01400-VectorDataManagerModal.jsx)
- Button: `×` (in hitl-review-modal.jsx)
- Button: `setError(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#721c24",
                    cursor: "pointer",
                    padding: "0.25rem",
                    fontSize: "1.25rem",
                    lineHeight: 1,
                  }}
                  aria-label="Close error"
                >
                  ×` (in hitl-review-modal.jsx)
- Button: `×` (in hitl-review-modal.jsx)
- Button: `setShowWorkflowDiagram(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              padding: "0 0.25rem",
              color: "#6c757d",
            }}
            title="Close workflow diagram"
          >
            ×` (in WorkflowDiagram.jsx)
- Button: `{isRestoreMode ? '✕ Cancel' : '↩️ Restore'}` (in RestorePointsPanel.jsx)
- Button: `{
                          e.stopPropagation();
                          handleRollback(checkpoint.id);
                        }}
                        disabled={!checkpoint.canRollback}
                        title={checkpoint.canRollback ? 'Restore to this point' : 'Cannot rollback'}
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          border: '1px solid #007bff',
                          backgroundColor: checkpoint.canRollback ? '#007bff' : '#e9ecef',
                          color: checkpoint.canRollback ? 'white' : '#6c757d',
                          borderRadius: '3px',
                          cursor: checkpoint.canRollback ? 'pointer' : 'not-allowed'
                        }}
                      >
                        ↩️` (in RestorePointsPanel.jsx)
- Button: `{
                          e.stopPropagation();
                          onDeleteCheckpoint(checkpoint.id);
                        }}
                        title="Delete checkpoint"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          border: '1px solid #dc3545',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        ×` (in RestorePointsPanel.jsx)
- Button: `setShowConfirmClear(true)}
              disabled={restorePoints.length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                border: '1px solid #6c757d',
                backgroundColor: 'transparent',
                color: '#6c757d',
                borderRadius: '4px',
                cursor: restorePoints.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear All` (in RestorePointsPanel.jsx)
- Button: `selectedCheckpointId && onRollback(selectedCheckpointId)}
              disabled={!selectedCheckpointId}
              style={{
                padding: '6px 16px',
                fontSize: '0.8rem',
                border: 'none',
                backgroundColor: selectedCheckpointId ? '#28a745' : '#e9ecef',
                color: selectedCheckpointId ? 'white' : '#6c757d',
                borderRadius: '4px',
                cursor: selectedCheckpointId ? 'pointer' : 'not-allowed',
                fontWeight: 600
              }}
            >
              Restore Selected` (in RestorePointsPanel.jsx)
- Button: `setShowConfirmClear(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  border: '1px solid #6c757d',
                  backgroundColor: 'transparent',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel` (in RestorePointsPanel.jsx)
- Button: `{
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete All` (in RestorePointsPanel.jsx)
- Button: `×` (in AgentWorkflowReview.jsx)
- Button: `Show Diagram` (in AgentWorkflowReview.jsx)
- Button: `onClick(workflow)}
        style={{
          padding: '0.5rem 1rem',
          border: '2px solid #007bff',
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}
      >
        View Tasks` (in TasksWorkflowsContent.jsx)
- Button: `handleWorkflowClick(workflow)}
          style={{
            padding: '0.5rem 1rem',
            border: '2px solid #007bff',
            backgroundColor: 'white',
            color: 'black',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          View Tasks` (in TaskCards.jsx)
- Button: `removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'inherit'
                  }}
                >
                  ×` (in NEW-FormCreationPage.jsx)
- Button: `setShowTemplateModal(true)}
            >
              🤖 AI Generate` (in NEW-FormCreationPage.jsx)
- Button: `handleCreateForm()}
            >
              ➕ New Form` (in NEW-FormCreationPage.jsx)
- Button: `setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                style={{
                  ...styles.button,
                  padding: '8px',
                  fontSize: '12px',
                  backgroundColor: viewMode === 'grid' ? '#007bff' : '#6c757d'
                }}
              >
                {viewMode === 'grid' ? '⊞' : '⊟'}` (in NEW-FormCreationPage.jsx)
- Button: `refreshData()}
                disabled={loading}
                style={{
                  ...styles.button,
                  padding: '8px',
                  fontSize: '12px'
                }}
              >
                🔄` (in NEW-FormCreationPage.jsx)
- Button: `setShowTemplateModal(false)}
                style={styles.button}
              >
                Close` (in NEW-FormCreationPage.jsx)
- Button: `window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page` (in NEW-FormCreationPage.jsx)
- Button: `{
                      // Navigate to the appropriate page based on workflow type
                      if (workflow.type === "procurement_order") {
                        navigate("/purchase-orders");
                      } else {
                        // For other workflow types, filter the tasks view to show related tasks
                        setActiveTab("tasks");
                        setSearchFilters(prev => ({
                          ...prev,
                          discipline: "all", // Could be made more specific based on workflow type
                        }));
                      }
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      border: "2px solid #007bff",
                      backgroundColor: "white",
                      color: "black",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    View Tasks` (in MyTasksDashboard.jsx)
- Button: `{
                              e.stopPropagation();
                              deleteTemplate(preset.id);
                            }}
                          >
                            Delete` (in FormStylingPromptModal.jsx)
- Button: `Remove` (in FormStylingPromptModal.jsx)
- Button: `Cancel` (in FormStylingPromptModal.jsx)
- Button: `{
                              e.stopPropagation();
                              deleteTemplate(preset.id);
                            }}
                          >
                            Delete` (in FormStylingPromptModal.jsx)
- Button: `Remove` (in FormStylingPromptModal.jsx)
- Button: `Cancel` (in FormStylingPromptModal.jsx)
- Button: `×` (in DocumentUploadTemplateModal.jsx)
- Button: `Cancel` (in DocumentUploadTemplateModal.jsx)
- Button: `{isProcessing ? "Creating Template..." : "Create Template"}` (in DocumentUploadTemplateModal.jsx)
- Button: `setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}` (in CrossDisciplineSharingTab.jsx)
- Button: `Submit Governance Request` (in CrossDisciplineSharingTab.jsx)
- Button: `handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve` (in CrossDisciplineSharingTab.jsx)
- Button: `{
                                const comments = prompt('Denial reason:');
                                if (comments) handleApprovalAction(request.id, 'deny', comments);
                              }}
                            >
                              ❌ Deny` (in CrossDisciplineSharingTab.jsx)
- Button: `setShowNewRequest(!showNewRequest)}
        >
          {showNewRequest ? 'Cancel Request' : '+ New Sharing Request'}` (in CrossDisciplineSharingTab.jsx)
- Button: `Submit Governance Request` (in CrossDisciplineSharingTab.jsx)
- Button: `handleApprovalAction(request.id, 'approve', '')}
                            >
                              ✅ Approve` (in CrossDisciplineSharingTab.jsx)
- Button: `{
                                const comments = prompt('Denial reason:');
                                if (comments) handleApprovalAction(request.id, 'deny', comments);
                              }}
                            >
                              ❌ Deny` (in CrossDisciplineSharingTab.jsx)
- Button: `×` (in TemplateModal.jsx)
- Button: `{
                if (editFormData.name) {
                  onEditModeToggle(true);
                  onHide();
                }
              }}
              disabled={!editFormData.name}
            >
              Advanced Editor` (in TemplateModal.jsx)
- Button: `setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#6c757d';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#6c757d';
        }}
        title="More actions"
        aria-label={`More actions for ${form.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⋯` (in FormsTableRenderer.jsx)
- Button: `×` (in FormEditModal.jsx)
- Button: `Cancel` (in FormEditModal.jsx)
- Button: `Save Form` (in FormEditModal.jsx)
- Button: `×` (in FormDetailModal.jsx)
- Button: `Close` (in FormDetailModal.jsx)
- Button: `setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×` (in FormCreationToastContainer.jsx)
- Button: `{
                  setSearchTerm("");
                  setFormTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                🔄 Clear Filters` (in FormCreationSearchAndFilters.jsx)
- Button: `handleCreateProcurementTemplate(template)}
                >
                  Create Template` (in FormCreationProcurementTemplatesSection.jsx)
- Button: `setShowProcurementTemplates(false)}
          >
            Cancel` (in FormCreationProcurementTemplatesSection.jsx)
- Button: `setShowTemplateModal(false)}
                >
                  ×` (in FormCreationModals.jsx)
- Button: `{
                    if (editFormData.name) {
                      setIsEditMode(true);
                      setShowTemplateModal(false);
                    }
                  }}
                  disabled={!editFormData.name}
                >
                  Advanced Editor` (in FormCreationModals.jsx)
- Button: `setShowPreviewModal(false)}
              >
                ×` (in FormCreationModals.jsx)
- Button: `setShowPreviewModal(false)}
              >
                Close Preview` (in FormCreationModals.jsx)
- Button: `{
                  setShowContentVerificationModal(false);
                  setPendingFormData(null);
                  addToast({
                    title: "Verification Cancelled",
                    message: "Document processing verification was cancelled",
                    variant: "info",
                  });
                }}
              >
                ×` (in FormCreationModals.jsx)
- Button: `setError(null)}
                aria-label="Close error"
              >
                ×` (in FormCreationMainContent.jsx)
- Button: `setError(null)}
        aria-label="Close"
      >
        ×` (in FormCreationErrorDisplay.jsx)
- Button: `×` (in BulkDisciplineCopyModal.jsx)
- Button: `Cancel` (in BulkDisciplineCopyModal.jsx)
- Button: `🔄 Copy to Discipline Templates` (in BulkDisciplineCopyModal.jsx)
- Button: `×` (in BulkApprovalModal.jsx)
- Button: `Cancel` (in BulkApprovalModal.jsx)
- Button: `{
              onBulkApprove();
              onHide();
            }}
          >
            Publish All` (in BulkApprovalModal.jsx)
- Button: `×` (in AITemplateModal.jsx)
- Button: `setShowEnhanceModal(true)}
                      disabled={!customPrompt.trim()}
                      title="Enhance your prompt with AI suggestions, templates, and resources"
                    >
                      ✨ Enhance` (in AITemplateModal.jsx)
- Button: `setCustomPrompt(example)}
                      >
                        {example.length > 30 ? example.substring(0, 30) + '...' : example}` (in AITemplateModal.jsx)
- Button: `{currentStep === 'discipline' ? 'Cancel' : '← Back'}` (in AITemplateModal.jsx)
- Button: `🤖 Generate Template` (in AITemplateModal.jsx)
- Button: `downloadHtmlTemplate(generatedTemplate)}
                  >
                    📥 Download HTML` (in AITemplateModal.jsx)
- Button: `openHtmlInNewTab(generatedTemplate)}
                  >
                    🌐 Open in Browser` (in AITemplateModal.jsx)
- Button: `💾 Save Template` (in AITemplateModal.jsx)
- Button: `{
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Clear Filters` (in TemplateFilters.jsx)
- Button: `Close Preview` (in TemplatePreviewRenderer.jsx)
- Button: `window.open('', '_blank').document.write(preview?.html || '')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4A89DC',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Open in New Tab` (in TemplatePreviewRenderer.jsx)
- Button: `navigator.clipboard.writeText(preview?.html || '')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Copy HTML` (in TemplatePreviewRenderer.jsx)
- Button: `Close` (in TemplatePreviewRenderer.jsx)
- Button: `{
              const blob = new Blob([preview.html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${template.name.replace(/\s+/g, '_')}_preview.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid #28a745',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download HTML` (in TemplatePreviewRenderer.jsx)
- Button: `setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×` (in TemplateManagementMainContent.jsx)
- Button: `{
                    e.stopPropagation();
                    onTemplatePreview(template);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: '1px solid #4A89DC',
                    backgroundColor: 'white',
                    color: '#4A89DC',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#4A89DC';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#4A89DC';
                  }}
                >
                  👁️ Preview` (in TemplateManagementMainContent.jsx)
- Button: `{
                    e.stopPropagation();
                    onTemplateEdit(template);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: '1px solid #28a745',
                    backgroundColor: 'white',
                    color: '#28a745',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#28a745';
                  }}
                >
                  ✏️ Edit` (in TemplateManagementMainContent.jsx)
- Button: `{
                    e.stopPropagation();
                    onTemplateDelete(template);
                  }}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #dc3545',
                    backgroundColor: 'white',
                    color: '#dc3545',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#dc3545';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#dc3545';
                  }}
                >
                  🗑️` (in TemplateManagementMainContent.jsx)
- Button: `Cancel` (in TemplateEditorRenderer.jsx)
- Button: `Save Template` (in TemplateEditorRenderer.jsx)
- Button: `+ Add Section` (in TemplateEditorRenderer.jsx)
- Button: `setActiveSection(index)}
                  style={{
                    padding: '8px 16px',
                    border: activeSection === index ? '2px solid #4A89DC' : '1px solid #dee2e6',
                    backgroundColor: activeSection === index ? '#e7f3ff' : 'white',
                    color: activeSection === index ? '#4A89DC' : '#000000',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {section.title}` (in TemplateEditorRenderer.jsx)
- Button: `deleteSection(activeSection)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Delete Section` (in TemplateEditorRenderer.jsx)
- Button: `addQuestion(activeSection)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      + Add Question` (in TemplateEditorRenderer.jsx)
- Button: `deleteQuestion(activeSection, qIndex)}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          ×` (in TemplateEditorRenderer.jsx)
- Button: `Close` (in TemplateComparisonRenderer.jsx)
- Button: `{
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            Cancel` (in TemplateModal.jsx)
- Button: `{
              e.target.style.backgroundColor = "#fff8f2";
              e.target.style.borderColor = "#ffb733";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.borderColor = "#ffa500";
            }}
          >
            {selectedTemplate ? "Update Template" : "Create Template"}` (in TemplateModal.jsx)
- Button: `{
                e.target.style.backgroundColor = "#fff8f2";
                e.target.style.borderColor = "#ffb733";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "white";
                e.target.style.borderColor = "#ffa500";
              }}
            >
              Cancel` (in BulkTemplateCopyModal.jsx)
- Button: `{
                  e.target.style.backgroundColor = "#fff8f2";
                  e.target.style.borderColor = "#ffb733";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.borderColor = "#ffa500";
                }}
              >
                Cancel` (in AITemplateModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01300-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01300-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01300-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01300-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01300-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01300-VectorDataManagerModal.jsx)
- Button: `Close` (in 01300-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01300-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01300-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01300-UpsertFileModal.jsx)
- Button: `Cancel` (in 01300-UpsertFileModal.jsx)
- Button: `{
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️` (in FormList.jsx)
- Button: `{
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️` (in FormList.jsx)
- Button: `{
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️` (in FormList.jsx)
- Button: `🔄 Clear Filters` (in FormFilteringSection.jsx)
- Button: `!saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×` (in FormEditorModal.jsx)
- Button: `!saving && onCancel?.()}
              disabled={saving}
            >
              Cancel` (in FormEditorModal.jsx)
- Button: `{
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View` (in FormCard.jsx)
- Button: `{
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit` (in FormCard.jsx)
- Button: `{
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete` (in FormCard.jsx)
- Button: `×` (in TemplateModal.jsx)
- Button: `{
                if (editFormData.name) {
                  onEditModeToggle(true);
                  onHide();
                }
              }}
              disabled={!editFormData.name}
            >
              Advanced Editor` (in TemplateModal.jsx)
- Button: `×` (in HoldPointNotificationModal.jsx)
- Button: `Cancel` (in HoldPointNotificationModal.jsx)
- Button: `Generate HTML Template` (in HoldPointNotificationModal.jsx)
- Button: `×` (in FormsTableRenderer.jsx)
- Button: `{
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            Cancel` (in FormsTableRenderer.jsx)
- Button: `{
              e.target.style.backgroundColor = '#fff8f2';
              e.target.style.borderColor = '#ffb733';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#ffa500';
            }}
          >
            👁️ Preview Form` (in FormsTableRenderer.jsx)
- Button: `{
                if (!isPublishing) {
                  e.target.style.backgroundColor = '#fff8f2';
                  e.target.style.borderColor = '#ffb733';
                }
              }}
              onMouseLeave={(e) => {
                if (!isPublishing) {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#ffa500';
                }
              }}
            >
              {isPublishing ? "🚀 Publishing..." : "🚀 Publish Form"}` (in FormsTableRenderer.jsx)
- Button: `setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#6c757d';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#6c757d';
        }}
        title="More actions"
        aria-label={`More actions for ${form.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        ⋯` (in FormsTableRenderer.jsx)
- Button: `×` (in FormEditModal.jsx)
- Button: `Cancel` (in FormEditModal.jsx)
- Button: `Save Form` (in FormEditModal.jsx)
- Button: `×` (in FormDetailModal.jsx)
- Button: `Close` (in FormDetailModal.jsx)
- Button: `setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close"
            >
              ×` (in FormCreationToastContainer.jsx)
- Button: `{
                  setSearchTerm("");
                  setFormTypeFilter("all");
                  setStatusFilter("all");
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fff8f2';
                  e.target.style.borderColor = '#ffb733';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#ffa500';
                }}
              >
                Clear Filters` (in FormCreationSearchAndFilters.jsx)
- Button: `handleCreateProcurementTemplate(template)}
                >
                  Create Template` (in FormCreationProcurementTemplatesSection.jsx)
- Button: `setShowProcurementTemplates(false)}
          >
            Cancel` (in FormCreationProcurementTemplatesSection.jsx)
- Button: `setError(null)}
                aria-label="Close error"
              >
                ×` (in FormCreationMainContent.jsx)
- Button: `setError(null)}
        aria-label="Close"
      >
        ×` (in FormCreationErrorDisplay.jsx)
- Button: `×` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('mark_all_editable')}
              >
                Mark All Editable` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('mark_all_readonly')}
              >
                Mark All Read-only` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('enable_ai_suggestions')}
              >
                Enable AI Suggestions` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('disable_ai_suggestions')}
              >
                Disable AI Suggestions` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('mark_all_required')}
              >
                Mark All Required` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('clear_requirements')}
              >
                Clear All Requirements` (in FieldCharacteristicsModal.jsx)
- Button: `Cancel` (in FieldCharacteristicsModal.jsx)
- Button: `Proceed to Template Creation` (in FieldCharacteristicsModal.jsx)
- Button: `applyBulkAction('mark_all_editable')}
            >
              Mark All Editable` (in ContentComparisonRenderer.jsx)
- Button: `applyBulkAction('mark_all_readonly')}
            >
              Mark All Read-only` (in ContentComparisonRenderer.jsx)
- Button: `applyBulkAction('enable_ai_suggestions')}
            >
              Enable AI Suggestions` (in ContentComparisonRenderer.jsx)
- Button: `applyBulkAction('disable_ai_suggestions')}
            >
              Disable AI Suggestions` (in ContentComparisonRenderer.jsx)
- Button: `applyBulkAction('mark_all_required')}
            >
              Mark All Required` (in ContentComparisonRenderer.jsx)
- Button: `applyBulkAction('clear_requirements')}
            >
              Clear All Requirements` (in ContentComparisonRenderer.jsx)
- Button: `setActiveTab('original')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === 'original' ? '#007bff' : 'transparent',
            color: activeTab === 'original' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'original' ? '600' : '400',
            borderRadius: activeTab === 'original' ? '4px 4px 0 0' : '0'
          }}
        >
          📄 Original Document ({originalContent.length} characters)` (in ContentComparisonRenderer.jsx)
- Button: `setActiveTab('processed')}
          style={{
            flex: 1,
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === 'processed' ? '#007bff' : 'transparent',
            color: activeTab === 'processed' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'processed' ? '600' : '400',
            borderRadius: activeTab === 'processed' ? '4px 4px 0 0' : '0'
          }}
        >
          📋 Processed Fields ({processedFields.length} fields)` (in ContentComparisonRenderer.jsx)
- Button: `Cancel` (in ContentComparisonRenderer.jsx)
- Button: `{
            // Pass field configurations and updated form name to the continue callback
            const formWithConfigurations = {
              ...form,
              name: formName, // Include the editable form name
              fieldConfigurations: fieldConfigurations
            };
            onContinue(formWithConfigurations);
          }}
          disabled={!formName.trim()}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: formName.trim() ? '#28a745' : '#6c757d',
            color: 'white',
            borderRadius: '4px',
            cursor: formName.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            opacity: formName.trim() ? 1 : 0.6
          }}
        >
          ✅ Continue & Save Form` (in ContentComparisonRenderer.jsx)
- Button: `×` (in BulkDisciplineCopyModal.jsx)
- Button: `Cancel` (in BulkDisciplineCopyModal.jsx)
- Button: `🔄 Copy to Discipline Templates` (in BulkDisciplineCopyModal.jsx)
- Button: `×` (in BulkApprovalModal.jsx)
- Button: `Cancel` (in BulkApprovalModal.jsx)
- Button: `{
              onBulkApprove();
              onHide();
            }}
          >
            Publish All` (in BulkApprovalModal.jsx)
- Button: `!saving && onHide?.()}
            disabled={saving}
          >
            ×` (in AdvancedFormConfigurationModal.jsx)
- Button: `{
                if (configurationStep === 'fields') setConfigurationStep('basic');
                if (configurationStep === 'comparison') setConfigurationStep('fields');
              }}
              disabled={saving}
            >
              ← Back` (in AdvancedFormConfigurationModal.jsx)
- Button: `{'Next: Configure Fields →'}` (in AdvancedFormConfigurationModal.jsx)
- Button: `{'Next: Review & Save →'}` (in AdvancedFormConfigurationModal.jsx)
- Button: `{saving ? '⏳ Saving...' : '💾 Save Form Configuration'}` (in AdvancedFormConfigurationModal.jsx)
- Button: `{
                      e.stopPropagation();
                      onFormView?.(form);
                    }}
                  >
                    👁️` (in FormList.jsx)
- Button: `{
                      e.stopPropagation();
                      onFormEdit?.(form);
                    }}
                  >
                    ✏️` (in FormList.jsx)
- Button: `{
                      e.stopPropagation();
                      if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                        onFormDelete?.(form);
                      }
                    }}
                  >
                    🗑️` (in FormList.jsx)
- Button: `🔄 Clear Filters` (in FormFilteringSection.jsx)
- Button: `!saving && onHide?.()}
            disabled={saving}
            aria-label="Close modal"
          >
            ×` (in FormEditorModal.jsx)
- Button: `!saving && onCancel?.()}
              disabled={saving}
            >
              Cancel` (in FormEditorModal.jsx)
- Button: `{
                e.stopPropagation();
                onView?.(form);
              }}
            >
              👁️ View` (in FormCard.jsx)
- Button: `{
                  e.stopPropagation();
                  onEdit?.(form);
                }}
              >
                ✏️ Edit` (in FormCard.jsx)
- Button: `{
                  e.stopPropagation();
                  if (window.confirm(`Delete "${form.name}"? This action cannot be undone.`)) {
                    onDelete?.(form);
                  }
                }}
              >
                🗑️ Delete` (in FormCard.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01200-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01200-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01200-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01200-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01200-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01200-VectorDataManagerModal.jsx)
- Button: `Close` (in 01200-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01200-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01200-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01200-UpsertFileModal.jsx)
- Button: `Cancel` (in 01200-UpsertFileModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01100-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01100-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01100-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01100-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01100-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01100-VectorDataManagerModal.jsx)
- Button: `Close` (in 01100-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01100-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01100-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01100-UpsertFileModal.jsx)
- Button: `Cancel` (in 01100-UpsertFileModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 01000-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 01000-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 01000-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 01000-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 01000-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 01000-VectorDataManagerModal.jsx)
- Button: `Close` (in 01000-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 01000-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 01000-UpsertUrlModal.jsx)
- Button: `removeFile(fileData.id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer"
                    }}
                  >
                    ✕` (in 01000-UpsertFileModal.jsx)
- Button: `Cancel` (in 01000-UpsertFileModal.jsx)
- Button: `Close` (in 00900-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00900-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00900-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00900-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00900-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00895-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00895-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00895-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00895-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00895-VectorDataManagerModal.jsx)
- Button: `Close` (in 00895-VectorDataManagerModal.jsx)
- Button: `Close` (in 00890-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00890-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00890-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00890-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00890-UpsertCloudModal.jsx)
- Button: `Close` (in 00889-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00889-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00889-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00889-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00889-UpsertCloudModal.jsx)
- Button: `Close` (in 00888-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00888-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00888-VectorDataManagerModal.jsx)
- Button: `Close` (in 00886-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00886-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00886-VectorDataManagerModal.jsx)
- Button: `Close` (in 00885-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00885-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00885-VectorDataManagerModal.jsx)
- Button: `Close` (in 00884-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00884-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00884-VectorDataManagerModal.jsx)
- Button: `Close` (in 00883-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00883-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00883-VectorDataManagerModal.jsx)
- Button: `Close` (in 00882-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00882-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00882-VectorDataManagerModal.jsx)
- Button: `Close` (in 00880-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00880-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00880-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00880-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00880-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00877-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00877-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00877-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00877-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00877-VectorDataManagerModal.jsx)
- Button: `Close` (in 00877-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00877-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00877-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00876-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00876-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00876-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00876-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00876-VectorDataManagerModal.jsx)
- Button: `Close` (in 00876-VectorDataManagerModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00875-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00875-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00875-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00875-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00875-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00875-VectorDataManagerModal.jsx)
- Button: `Close` (in 00875-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00875-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00875-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00875-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00875-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00875-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00875-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00875-UpsertFileModal.jsx)
- Button: `Cancel` (in 00875-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00875-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00875-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00872-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00872-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00872-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00872-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00872-VectorDataManagerModal.jsx)
- Button: `Close` (in 00872-VectorDataManagerModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00871-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00871-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00871-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00871-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00871-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00871-VectorDataManagerModal.jsx)
- Button: `Close` (in 00871-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00871-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00871-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00871-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00871-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00871-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00871-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00871-UpsertFileModal.jsx)
- Button: `Cancel` (in 00871-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00871-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00871-UpsertCloudModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00870-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00870-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00870-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00870-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00870-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00870-VectorDataManagerModal.jsx)
- Button: `Close` (in 00870-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00870-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00870-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00870-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00870-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00870-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00870-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00870-UpsertFileModal.jsx)
- Button: `Cancel` (in 00870-UpsertFileModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00860-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00860-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00860-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00860-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00860-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00860-VectorDataManagerModal.jsx)
- Button: `Close` (in 00860-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00860-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00860-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00860-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00860-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00860-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00860-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00860-UpsertFileModal.jsx)
- Button: `Cancel` (in 00860-UpsertFileModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00855-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00855-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00855-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00855-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00855-VectorDataManagerModal.jsx)
- Button: `Close` (in 00855-VectorDataManagerModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00850-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00850-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00850-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00850-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00850-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00850-VectorDataManagerModal.jsx)
- Button: `Close` (in 00850-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00850-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00850-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00850-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00850-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00850-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00850-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00850-UpsertFileModal.jsx)
- Button: `Cancel` (in 00850-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00850-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00850-UpsertCloudModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00835-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00835-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00835-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00835-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00835-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00835-VectorDataManagerModal.jsx)
- Button: `Close` (in 00835-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00835-VectorDataManagerModal.jsx)
- Button: `{isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}` (in 00835-UpsertUrlModal.jsx)
- Button: `{/* TODO: Implement preview expansion */}}
              >
                📖 More Details` (in 00835-UpsertUrlModal.jsx)
- Button: `Cancel` (in 00835-UpsertUrlModal.jsx)
- Button: `{
              console.log("=== BUTTON CLICK DEBUG ===");
              console.log("URL:", url, "exists:", !!url);
              console.log("URL Analysis:", !!urlAnalysis);
              console.log("Company:", company, "exists:", !!company);
              console.log("Project:", project, "exists:", !!project);
              console.log("Button disabled:", !url || !urlAnalysis || !company || !project);
              console.log("=== END BUTTON CLICK DEBUG ===");
            }}
          >
            Process URL` (in 00835-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00835-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00835-UpsertFileModal.jsx)
- Button: `Cancel` (in 00835-UpsertFileModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00835-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00835-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00825-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00825-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00825-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00825-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00825-VectorDataManagerModal.jsx)
- Button: `Close` (in 00825-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected) ? "Deselect All" : "Select All"}` (in 00825-UpsertCloudModal.jsx)
- Button: `removeTag(tag)} className="00825-tag-chip-remove" aria-label={`Remove tag ${tag}`} title="Remove tag">×` (in 00825-UpsertCloudModal.jsx)
- Button: `addTag(tagInput)} disabled={!tagInput.trim()} className="00825-btn 00825-btn-primary 00825-tag-add-btn 00825-btn-small">+ Add Tag` (in 00825-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00825-UpsertCloudModal.jsx)
- Button: `{loading ? "⏳ Processing..." : "🔗 Cloud Upsert"}` (in 00825-UpsertCloudModal.jsx)
- Button: `{filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}` (in 00800-VectorDataManagerModal.jsx)
- Button: `handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate` (in 00800-VectorDataManagerModal.jsx)
- Button: `handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate` (in 00800-VectorDataManagerModal.jsx)
- Button: `handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete` (in 00800-VectorDataManagerModal.jsx)
- Button: `Close` (in 00800-VectorDataManagerModal.jsx)
- Button: `{cloudFiles.every((f) => f.selected)
                    ? "Deselect All"
                    : "Select All"}` (in 00800-UpsertCloudModal.jsx)
- Button: `Cancel` (in 00800-UpsertCloudModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00435-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00435-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00435-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00435-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00435-VectorDataManagerModal.jsx)
- Button: `Close` (in 00435-VectorDataManagerModal.jsx)
- Button: `{isLoading ? 'Processing...' : 'Reject'}` (in ProgressiveDisclosureHITLModal.jsx)
- Button: `{isLoading ? 'Processing...' : 'Escalate'}` (in ProgressiveDisclosureHITLModal.jsx)
- Button: `{isLoading ? 'Processing...' : 'Approve'}` (in ProgressiveDisclosureHITLModal.jsx)
- Button: `e.key === 'Enter' && !isLoading && handleApprove()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  aria-describedby="approve-description"
                >
                  {isLoading ? 'Processing...' : 'Approve'}` (in AccessibleProgressiveDisclosureHITLModal.jsx)
- Button: `e.key === 'Enter' && !isLoading && handleReject()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  aria-describedby="reject-description"
                >
                  {isLoading ? 'Processing...' : 'Reject'}` (in AccessibleProgressiveDisclosureHITLModal.jsx)
- Button: `e.key === 'Enter' && !isLoading && handleEscalate()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    aria-describedby="escalate-description"
                  >
                    {isLoading ? 'Processing...' : 'Escalate'}` (in AccessibleProgressiveDisclosureHITLModal.jsx)
- Button: `handleAction("delete")}
                      style={{ ...styles.actionButton, ...styles.actionButtonPrimary }}
                      disabled={loading}
                    >
                      🗑️ Delete Selected ({selectedDocuments.length})` (in 00425-VectorDataManagerModal.jsx)
- Button: `handleAction("move")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                      disabled={loading}
                    >
                      📁 Move Selected` (in 00425-VectorDataManagerModal.jsx)
- Button: `handleAction("export")}
                      style={{ ...styles.actionButton, ...styles.actionButtonSuccess }}
                      disabled={loading}
                    >
                      📤 Export Selected` (in 00425-VectorDataManagerModal.jsx)
- Button: `{loading ? "Processing..." : `Yes, ${action}`}` (in 00425-VectorDataManagerModal.jsx)
- Button: `setAction("")}
                        style={{
                          padding: "8px 16px",
                          background: "#6c757d",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel` (in 00425-VectorDataManagerModal.jsx)
- Button: `Close` (in 00425-VectorDataManagerModal.jsx)
- Button: `handleReindexDocument(doc.id)}
                            disabled={doc.embedding_status === "processing"}
                            style={{
                              marginRight: "5px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: doc.embedding_status === "processing" ? "not-allowed" : "pointer"
                            }}
                            title="Reindex document"
                          >
                            🔄` (in 00400-VectorDataManagerModal.jsx)
- Button: `handleDeleteDocument(doc.id)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer"
                            }}
                            title="Delete document"
                          >
                            🗑️` (in 00400-VectorDataManagerModal.jsx)
- Button: `alert("Bulk reindexing started for all documents in this table.")}
              >
                🔄 Reindex All Documents` (in 00400-VectorDataManagerModal.jsx)
- Button: `alert("Table optimization started. This may improve search performance.")}
              >
                ⚡ Optimize Table` (in 00400-VectorDataManagerModal.jsx)
- Button: `alert("Table statistics exported to CSV.")}
              >
                📊 Export Statistics` (in 00400-VectorDataManagerModal.jsx)
- Button: `alert("Table backup created successfully.")}
              >
                💾 Create Backup` (in 00400-VectorDataManagerModal.jsx)
- Button: `Close` (in 00400-VectorDataManagerModal.jsx)
- Button: `alert(`Vector data management session for ${selectedTable} completed.`)}
          >
            Apply Changes` (in 00400-VectorDataManagerModal.jsx)
- Button: `Cancel` (in 00400-UpsertUrlModal.jsx)
- Button: `{isSyncing ? "Syncing..." : "Refresh Data"}` (in 00400-UpsertFileModal.jsx)
- Button: `setShowDebug(!showDebug)}
            style={{
              background: "none",
              border: "1px solid #6c757d",
              color: "#6c757d",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showDebug ? "▼" : "▶"} Debug: Data Sources` (in 00400-UpsertFileModal.jsx)
- Button: `Cancel` (in 00400-UpsertFileModal.jsx)
- Button: `Close` (in 00300-VectorDataManagerModal.jsx)
- Button: `{loading ? "Exporting..." : "Export"}` (in 00300-VectorDataManagerModal.jsx)
- Button: `{loading ? "Deleting..." : "Delete"}` (in 00300-VectorDataManagerModal.jsx)
- Button: `{refreshing ? '🔄' : '🔄'} Refresh` (in SecurityComplianceDashboard.jsx)
- Button: `📊 Generate Report` (in SecurityComplianceDashboard.jsx)
- Button: `{refreshing ? '🔄' : '🔄'} Refresh` (in SecurityComplianceDashboard.jsx)
- Button: `📊 Generate Report` (in SecurityComplianceDashboard.jsx)
- Button: `handleDocumentSelect(doc)}
                      >
                        View Details` (in DocumentAccessTab.jsx)
- Button: `handleDocumentSelect(doc)}
                        >
                          View Details` (in DocumentAccessTab.jsx)
- Button: `Grant User Access` (in DocumentAccessTab.jsx)
- Button: `handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke` (in DocumentAccessTab.jsx)
- Button: `handleDocumentSelect(doc)}
                      >
                        View Details` (in DocumentAccessTab.jsx)
- Button: `handleDocumentSelect(doc)}
                        >
                          View Details` (in DocumentAccessTab.jsx)
- Button: `Grant User Access` (in DocumentAccessTab.jsx)
- Button: `handleRevokeUserAccess(docId, userId)
                                  }
                                >
                                  Revoke` (in DocumentAccessTab.jsx)
- Button: `Create Template` (in CrossDisciplineSharingTab.jsx)
- Button: `Apply Template` (in CrossDisciplineSharingTab.jsx)
- Button: `Create Template` (in CrossDisciplineSharingTab.jsx)
- Button: `Apply Template` (in CrossDisciplineSharingTab.jsx)
- Button: `{filteredVectorData.every(v => v.selected) ? "Deselect All" : "Select All"}` (in 00102-VectorDataManagerModal.jsx)
- Button: `handleDeactivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.deactivateButton }}
                        disabled={loading}
                      >
                        Deactivate` (in 00102-VectorDataManagerModal.jsx)
- Button: `handleActivate(vector.id)}
                        style={{ ...styles.actionButton, ...styles.activateButton }}
                        disabled={loading}
                      >
                        Activate` (in 00102-VectorDataManagerModal.jsx)
- Button: `handleDelete(vector.id)}
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      disabled={loading}
                    >
                      Delete` (in 00102-VectorDataManagerModal.jsx)
- Button: `Close` (in 00102-VectorDataManagerModal.jsx)

---

