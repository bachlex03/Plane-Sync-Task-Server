# Phase 6: [BE-INTEGRATION] Các checklist còn lại - Tổng hợp

## Cấu trúc thư mục

```
apps/backend/
├── integration-adapter/              # Dịch vụ tích hợp HIS/LIS/RIS
│   ├── src/
│   │   ├── data-normalization/       # Data normalization functionality
│   │   │   ├── normalizers/          # Data normalizers
│   │   │   │   ├── patient-normalizer.service.ts
│   │   │   │   ├── appointment-normalizer.service.ts
│   │   │   │   ├── medical-record-normalizer.service.ts
│   │   │   │   ├── medication-normalizer.service.ts
│   │   │   │   ├── laboratory-normalizer.service.ts
│   │   │   │   └── radiology-normalizer.service.ts
│   │   │   ├── converters/           # Data converters
│   │   │   │   ├── date-converter.service.ts
│   │   │   │   ├── currency-converter.service.ts
│   │   │   │   ├── unit-converter.service.ts
│   │   │   │   └── format-converter.service.ts
│   │   │   ├── validators/           # Data validators
│   │   │   │   ├── data-validator.service.ts
│   │   │   │   ├── business-rule-validator.service.ts
│   │   │   │   └── constraint-validator.service.ts
│   │   │   └── enrichers/            # Data enrichers
│   │   │       ├── data-enricher.service.ts
│   │   │       ├── field-enricher.service.ts
│   │   │       └── metadata-enricher.service.ts
│   │   ├── sync-logging/             # Sync logging functionality
│   │   │   ├── loggers/              # Loggers
│   │   │   │   ├── sync-logger.service.ts
│   │   │   │   ├── error-logger.service.ts
│   │   │   │   ├── audit-logger.service.ts
│   │   │   │   └── performance-logger.service.ts
│   │   │   ├── trackers/             # Trackers
│   │   │   │   ├── sync-tracker.service.ts
│   │   │   │   ├── progress-tracker.service.ts
│   │   │   │   └── status-tracker.service.ts
│   │   │   └── analyzers/            # Log analyzers
│   │   │       ├── log-analyzer.service.ts
│   │   │       ├── error-analyzer.service.ts
│   │   │       └── performance-analyzer.service.ts
│   │   ├── import-job-management/    # Import job management
│   │   │   ├── schedulers/           # Job schedulers
│   │   │   │   ├── batch-scheduler.service.ts
│   │   │   │   ├── realtime-scheduler.service.ts
│   │   │   │   └── manual-scheduler.service.ts
│   │   │   ├── processors/           # Job processors
│   │   │   │   ├── batch-processor.service.ts
│   │   │   │   ├── realtime-processor.service.ts
│   │   │   │   └── manual-processor.service.ts
│   │   │   ├── monitors/             # Job monitors
│   │   │   │   ├── job-monitor.service.ts
│   │   │   │   ├── progress-monitor.service.ts
│   │   │   │   └── performance-monitor.service.ts
│   │   │   └── optimizers/           # Job optimizers
│   │   │       ├── job-optimizer.service.ts
│   │   │       ├── resource-optimizer.service.ts
│   │   │       └── performance-optimizer.service.ts
│   │   ├── dual-operation-mode/      # Dual operation mode
│   │   │   ├── dual-write/           # Dual write functionality
│   │   │   │   ├── dual-write.service.ts
│   │   │   │   ├── consistency-checker.service.ts
│   │   │   │   └── conflict-detector.service.ts
│   │   │   ├── dual-read/            # Dual read functionality
│   │   │   │   ├── dual-read.service.ts
│   │   │   │   ├── data-comparator.service.ts
│   │   │   │   └── result-merger.service.ts
│   │   │   └── rollback/             # Rollback functionality
│   │   │       ├── rollback.service.ts
│   │   │       ├── recovery.service.ts
│   │   │       └── state-manager.service.ts
│   │   ├── sync-monitoring-ui/       # Sync monitoring UI
│   │   │   ├── dashboards/           # Monitoring dashboards
│   │   │   │   ├── sync-dashboard.service.ts
│   │   │   │   ├── progress-dashboard.service.ts
│   │   │   │   └── error-dashboard.service.ts
│   │   │   ├── visualizers/          # Data visualizers
│   │   │   │   ├── chart-generator.service.ts
│   │   │   │   ├── graph-generator.service.ts
│   │   │   │   └── report-generator.service.ts
│   │   │   └── exporters/            # Data exporters
│   │   │       ├── data-exporter.service.ts
│   │   │       ├── report-exporter.service.ts
│   │   │       └── log-exporter.service.ts
│   │   ├── sync-alerting/            # Sync alerting
│   │   │   ├── alerters/             # Alerters
│   │   │   │   ├── error-alerter.service.ts
│   │   │   │   ├── validation-alerter.service.ts
│   │   │   │   └── performance-alerter.service.ts
│   │   │   ├── notifiers/            # Notifiers
│   │   │   │   ├── email-notifier.service.ts
│   │   │   │   ├── sms-notifier.service.ts
│   │   │   │   └── webhook-notifier.service.ts
│   │   │   └── escalators/           # Alert escalators
│   │   │       ├── alert-escalator.service.ts
│   │   │       ├── escalation-manager.service.ts
│   │   │       └── alert-manager.service.ts
│   │   ├── conflict-resolution-rules/ # Conflict resolution rules
│   │   │   ├── detectors/            # Conflict detectors
│   │   │   │   ├── conflict-detector.service.ts
│   │   │   │   ├── version-detector.service.ts
│   │   │   │   └── hash-detector.service.ts
│   │   │   ├── resolvers/            # Conflict resolvers
│   │   │   │   ├── conflict-resolver.service.ts
│   │   │   │   ├── manual-resolver.service.ts
│   │   │   │   └── auto-resolver.service.ts
│   │   │   └── reporters/            # Conflict reporters
│   │   │       ├── conflict-reporter.service.ts
│   │   │       ├── diff-highlighter.service.ts
│   │   │       └── conflict-analytics.service.ts
│   │   ├── standard-export/          # Standard export
│   │   │   ├── exporters/            # Standard exporters
│   │   │   │   ├── fhir-exporter.service.ts
│   │   │   │   ├── hl7-exporter.service.ts
│   │   │   │   ├── dicom-exporter.service.ts
│   │   │   │   └── custom-exporter.service.ts
│   │   │   ├── formatters/           # Data formatters
│   │   │   │   ├── fhir-formatter.service.ts
│   │   │   │   ├── hl7-formatter.service.ts
│   │   │   │   └── dicom-formatter.service.ts
│   │   │   └── validators/           # Export validators
│   │   │       ├── fhir-validator.service.ts
│   │   │       ├── hl7-validator.service.ts
│   │   │       └── dicom-validator.service.ts
│   │   ├── performance-testing/      # Performance testing
│   │   │   ├── testers/              # Performance testers
│   │   │   │   ├── load-tester.service.ts
│   │   │   │   ├── stress-tester.service.ts
│   │   │   │   └── benchmark-tester.service.ts
│   │   │   ├── analyzers/            # Performance analyzers
│   │   │   │   ├── performance-analyzer.service.ts
│   │   │   │   ├── bottleneck-analyzer.service.ts
│   │   │   │   └── optimization-analyzer.service.ts
│   │   │   └── reporters/            # Performance reporters
│   │   │       ├── performance-reporter.service.ts
│   │   │       ├── benchmark-reporter.service.ts
│   │   │       └── optimization-reporter.service.ts
│   │   ├── legacy-file-integration/  # Legacy file integration
│   │   │   ├── readers/              # File readers
│   │   │   │   ├── dbf-reader.service.ts
│   │   │   │   ├── csv-reader.service.ts
│   │   │   │   ├── folder-scanner.service.ts
│   │   │   │   └── binary-reader.service.ts
│   │   │   ├── parsers/              # File parsers
│   │   │   │   ├── dbf-parser.service.ts
│   │   │   │   ├── csv-parser.service.ts
│   │   │   │   ├── xml-parser.service.ts
│   │   │   │   └── json-parser.service.ts
│   │   │   └── processors/           # File processors
│   │   │       ├── file-processor.service.ts
│   │   │       ├── batch-processor.service.ts
│   │   │       └── stream-processor.service.ts
│   │   ├── hl7-fhir-parser/          # HL7/FHIR parser
│   │   │   ├── parsers/              # HL7/FHIR parsers
│   │   │   │   ├── hl7-parser.service.ts
│   │   │   │   ├── fhir-parser.service.ts
│   │   │   │   ├── hl7-bridge.service.ts
│   │   │   │   └── fhir-bridge.service.ts
│   │   │   ├── builders/             # Message builders
│   │   │   │   ├── hl7-builder.service.ts
│   │   │   │   ├── fhir-builder.service.ts
│   │   │   │   └── message-builder.service.ts
│   │   │   └── handlers/             # Message handlers
│   │   │       ├── acknowledgment-handler.service.ts
│   │   │       ├── batch-handler.service.ts
│   │   │       └── error-handler.service.ts
│   │   ├── data-enrichment/          # Data enrichment
│   │   │   ├── enrichers/            # Data enrichers
│   │   │   │   ├── field-enricher.service.ts
│   │   │   │   ├── metadata-enricher.service.ts
│   │   │   │   └── reference-enricher.service.ts
│   │   │   ├── validators/           # Enrichment validators
│   │   │   │   ├── enrichment-validator.service.ts
│   │   │   │   ├── quality-checker.service.ts
│   │   │   │   └── completeness-checker.service.ts
│   │   │   └── notifiers/            # Enrichment notifiers
│   │   │       ├── warning-notifier.service.ts
│   │   │       ├── alert-notifier.service.ts
│   │   │       └── report-notifier.service.ts
│   │   ├── batch-sync-strategy/      # Batch sync strategy
│   │   │   ├── strategies/           # Sync strategies
│   │   │   │   ├── batch-strategy.service.ts
│   │   │   │   ├── realtime-strategy.service.ts
│   │   │   │   └── hybrid-strategy.service.ts
│   │   │   ├── schedulers/           # Sync schedulers
│   │   │   │   ├── batch-scheduler.service.ts
│   │   │   │   ├── realtime-scheduler.service.ts
│   │   │   │   └── adaptive-scheduler.service.ts
│   │   │   └── optimizers/           # Sync optimizers
│   │   │       ├── batch-optimizer.service.ts
│   │   │       ├── performance-optimizer.service.ts
│   │   │       └── resource-optimizer.service.ts
│   │   └── rollback-recovery/        # Rollback and recovery
│   │       ├── rollback/             # Rollback functionality
│   │       │   ├── rollback.service.ts
│   │       │   ├── state-manager.service.ts
│   │       │   └── checkpoint-manager.service.ts
│   │       ├── recovery/             # Recovery functionality
│   │       │   ├── recovery.service.ts
│   │       │   ├── data-recovery.service.ts
│   │       │   └── system-recovery.service.ts
│   │       └── monitoring/           # Recovery monitoring
│   │           ├── recovery-monitor.service.ts
│   │           ├── health-checker.service.ts
│   │           └── status-reporter.service.ts
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── README.md
│
libs/backend/
├── integration/                      # Integration shared library
│   ├── src/
│   │   ├── data-normalization/       # Data normalization definitions
│   │   ├── sync-logging/             # Sync logging definitions
│   │   ├── import-job-management/    # Import job management definitions
│   │   ├── dual-operation-mode/      # Dual operation mode definitions
│   │   ├── sync-monitoring-ui/       # Sync monitoring UI definitions
│   │   ├── sync-alerting/            # Sync alerting definitions
│   │   ├── conflict-resolution-rules/ # Conflict resolution rules definitions
│   │   ├── standard-export/          # Standard export definitions
│   │   ├── performance-testing/      # Performance testing definitions
│   │   ├── legacy-file-integration/  # Legacy file integration definitions
│   │   ├── hl7-fhir-parser/          # HL7/FHIR parser definitions
│   │   ├── data-enrichment/          # Data enrichment definitions
│   │   ├── batch-sync-strategy/      # Batch sync strategy definitions
│   │   └── rollback-recovery/        # Rollback and recovery definitions
│   └── index.ts
│

```

## Danh sách các file checklist cần tạo chi tiết:

### 1. Schema Mapping
**File:** `docs/backend/Phase6/schema-mapping.md`
**Mục đích:** Mapping schema giữa hệ thống hiện tại và schema EMR mới

**Checklist chính:**
- [ ] [High] Phân tích schema của từng hệ thống nguồn
- [ ] [High] Thiết kế mapping rules cho từng entity
- [ ] [High] Implement data transformation logic
- [ ] [Medium] Validate mapping accuracy
- [ ] [Medium] Handle schema versioning
- [ ] [Low] Optimize mapping performance

### 2. Data Normalization
**File:** `docs/backend/Phase6/data-normalization.md`
**Mục đích:** Viết logic chuẩn hóa dữ liệu (normalize, convert, validate)

**Checklist chính:**
- [ ] [High] Implement data cleansing rules
- [ ] [High] Standardize data formats
- [ ] [High] Validate data integrity
- [ ] [Medium] Handle data enrichment
- [ ] [Medium] Implement data quality checks
- [ ] [Low] Optimize normalization performance

### 3. Sync Logging
**File:** `docs/backend/Phase6/sync-logging.md`
**Mục đích:** Ghi log đồng bộ (import status, error, audit, time range)

**Checklist chính:**
- [ ] [High] Implement comprehensive logging
- [ ] [High] Track sync status và progress
- [ ] [High] Log errors và exceptions
- [ ] [Medium] Implement audit trails
- [ ] [Medium] Create logging dashboards
- [ ] [Low] Optimize log storage

### 4. Import Job Management
**File:** `docs/backend/Phase6/import-job-management.md`
**Mục đích:** Tạo module quản lý Import job (theo batch, realtime, manual)

**Checklist chính:**
- [ ] [High] Design job scheduling system
- [ ] [High] Implement batch processing
- [ ] [High] Support real-time processing
- [ ] [Medium] Add manual job triggers
- [ ] [Medium] Implement job monitoring
- [ ] [Low] Add job optimization features

### 5. Dual Operation Mode
**File:** `docs/backend/Phase6/dual-operation-mode.md`
**Mục đích:** Cho phép chạy song song (dual-write / dual-read) để vận hành thử

**Checklist chính:**
- [ ] [High] Implement dual-write capability
- [ ] [High] Support dual-read operations
- [ ] [High] Ensure data consistency
- [ ] [Medium] Add comparison tools
- [ ] [Medium] Implement rollback mechanisms
- [ ] [Low] Optimize dual operation performance

### 6. Sync Monitoring UI
**File:** `docs/backend/Phase6/sync-monitoring-ui.md`
**Mục đích:** Giao diện kiểm tra kết quả sync & log

**Checklist chính:**
- [ ] [High] Design monitoring dashboard
- [ ] [High] Show sync status và progress
- [ ] [High] Display error logs
- [ ] [Medium] Add filtering và search
- [ ] [Medium] Implement real-time updates
- [ ] [Low] Add export capabilities

### 7. Sync Alerting
**File:** `docs/backend/Phase6/sync-alerting.md`
**Mục đích:** Thiết lập alert khi đồng bộ lỗi hoặc dữ liệu không hợp lệ

**Checklist chính:**
- [ ] [High] Implement error alerting
- [ ] [High] Set up data validation alerts
- [ ] [High] Configure notification channels
- [ ] [Medium] Add alert escalation
- [ ] [Medium] Implement alert management
- [ ] [Low] Add alert analytics

### 8. Conflict Resolution Rules
**File:** `docs/backend/Phase6/conflict-resolution-rules.md`
**Mục đích:** Bộ rule xử lý xung đột nếu dữ liệu khác nhau giữa 2 bên

**Checklist chính:**
- [ ] [High] Define conflict detection rules
- [ ] [High] Implement resolution strategies
- [ ] [High] Add manual conflict resolution
- [ ] [Medium] Create conflict reporting
- [ ] [Medium] Implement conflict prevention
- [ ] [Low] Add conflict analytics

### 9. Standard Export
**File:** `docs/backend/Phase6/standard-export.md`
**Mục đích:** Export lại dữ liệu dạng chuẩn (FHIR/HL7) sau khi xử lý

**Checklist chính:**
- [ ] [High] Implement FHIR export
- [ ] [High] Support HL7 export
- [ ] [High] Add custom format export
- [ ] [Medium] Implement export scheduling
- [ ] [Medium] Add export validation
- [ ] [Low] Optimize export performance

### 10. Performance Testing
**File:** `docs/backend/Phase6/performance-testing.md`
**Mục đích:** Kiểm thử hiệu suất với dữ liệu lớn từ HIS/LIS

**Checklist chính:**
- [ ] [High] Design performance test scenarios
- [ ] [High] Implement load testing
- [ ] [High] Conduct stress testing
- [ ] [Medium] Add performance monitoring
- [ ] [Medium] Implement performance optimization
- [ ] [Low] Create performance reports

### 11. Legacy File Integration
**File:** `docs/backend/Phase6/legacy-file-integration.md`
**Mục đích:** Hỗ trợ đọc trực tiếp từ file .dbf, .csv, hoặc folder scan cho HIS không có API

**Checklist chính:**
- [ ] [High] Implement .dbf file reader
- [ ] [High] Support .csv file processing
- [ ] [High] Add folder scanning capability
- [ ] [Medium] Implement file validation
- [ ] [Medium] Add file monitoring
- [ ] [Low] Optimize file processing

### 12. HL7 FHIR Parser
**File:** `docs/backend/Phase6/hl7-fhir-parser.md`
**Mục đích:** Viết parser HL7 v2.x hoặc FHIR bridge cho LIS

**Checklist chính:**
- [ ] [High] Implement HL7 v2.x parser
- [ ] [High] Create FHIR bridge
- [ ] [High] Support message validation
- [ ] [Medium] Add message transformation
- [ ] [Medium] Implement error handling
- [ ] [Low] Optimize parsing performance

### 13. Data Enrichment
**File:** `docs/backend/Phase6/data-enrichment.md`
**Mục đích:** Logic tự gán hoặc cảnh báo cho dữ liệu thiếu field chuẩn

**Checklist chính:**
- [ ] [High] Implement data enrichment rules
- [ ] [High] Add missing field detection
- [ ] [High] Create auto-assignment logic
- [ ] [Medium] Implement warning system
- [ ] [Medium] Add enrichment validation
- [ ] [Low] Optimize enrichment performance

### 14. Batch Sync Strategy
**File:** `docs/backend/Phase6/batch-sync-strategy.md`
**Mục đích:** Ưu tiên "batch sync" trước khi chuyển sang real-time

**Checklist chính:**
- [ ] [High] Design batch sync strategy
- [ ] [High] Implement batch processing
- [ ] [High] Add batch monitoring
- [ ] [Medium] Optimize batch performance
- [ ] [Medium] Add batch error handling
- [ ] [Low] Create batch analytics

### 15. Rollback Recovery
**File:** `docs/backend/Phase6/rollback-recovery.md`
**Mục đích:** Hỗ trợ rollback và recovery khi đồng bộ lỗi

**Checklist chính:**
- [ ] [High] Implement rollback mechanisms
- [ ] [High] Add recovery procedures
- [ ] [High] Create backup strategies
- [ ] [Medium] Add rollback monitoring
- [ ] [Medium] Implement recovery testing
- [ ] [Low] Optimize recovery time

---

## Lưu ý triển khai:

### Ưu tiên thực hiện:
1. **High Priority**: Schema mapping, data normalization, sync logging
2. **Medium Priority**: Import job management, dual operation mode
3. **Low Priority**: Advanced features và optimizations

### Dependencies:
- Cần hoàn thành Phase 6.0 trước khi bắt đầu Phase 6.1
- Mỗi file checklist cần tuân thủ chuẩn `todo-checklist-format`
- Tất cả files cần có link trong `backend-implementation-phases.md`

### Timeline đề xuất:
- **Week 1-2**: Core integration tasks (1-7)
- **Week 3-4**: Advanced features (8-15)
- **Week 5-6**: Testing và optimization

### Success Criteria:
- Tất cả adapters hoạt động ổn định
- Data sync thành công > 99%
- Performance đáp ứng SLA
- Security và compliance đạt chuẩn
- Documentation đầy đủ 