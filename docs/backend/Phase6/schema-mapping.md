# Phase 6: [BE-INTEGRATION] Mapping schema giữa hệ thống hiện tại và schema EMR mới

## Mục đích
Thiết kế và implement hệ thống mapping schema giữa các hệ thống nguồn (HIS, LIS, RIS, PACS, EMR cũ) và schema EMR mới, đảm bảo dữ liệu được chuyển đổi chính xác, nhất quán và có thể trace được.

## Lưu ý quan trọng
- **Data integrity**: Đảm bảo tính toàn vẹn dữ liệu trong quá trình mapping
- **Traceability**: Có thể trace được nguồn gốc dữ liệu sau khi mapping
- **Flexibility**: Dễ dàng thay đổi mapping rules khi cần
- **Performance**: Tối ưu hiệu suất mapping cho dữ liệu lớn
- **Validation**: Validate dữ liệu trước và sau khi mapping
- **Documentation**: Ghi chép đầy đủ mapping rules và logic
- **Testing**: Test kỹ lưỡng với dữ liệu thực tế

## Dependencies cần thiết
- **Schema analysis tools**: Database schema analyzers, data profiling tools
- **Mapping frameworks**: Custom mapping engine, transformation libraries
- **Validation tools**: Data validation frameworks, business rule engines
- **Testing tools**: Data comparison tools, integration testing frameworks
- **Documentation**: Schema documentation tools, mapping visualization tools
- **Monitoring**: Data quality monitoring, mapping performance tracking

## Cấu trúc thư mục

```
apps/backend/
├── integration-adapter/              # Dịch vụ tích hợp HIS/LIS/RIS
│   ├── src/
│   │   ├── schema-mapping/           # Schema mapping functionality
│   │   │   ├── analyzers/            # Schema analyzers
│   │   │   │   ├── his-schema-analyzer.service.ts
│   │   │   │   ├── lis-schema-analyzer.service.ts
│   │   │   │   ├── ris-schema-analyzer.service.ts
│   │   │   │   ├── pacs-schema-analyzer.service.ts
│   │   │   │   └── legacy-schema-analyzer.service.ts
│   │   │   ├── mappers/              # Schema mappers
│   │   │   │   ├── patient-mapper.service.ts
│   │   │   │   ├── appointment-mapper.service.ts
│   │   │   │   ├── medical-record-mapper.service.ts
│   │   │   │   ├── medication-mapper.service.ts
│   │   │   │   ├── laboratory-mapper.service.ts
│   │   │   │   ├── radiology-mapper.service.ts
│   │   │   │   └── billing-mapper.service.ts
│   │   │   ├── transformers/         # Data transformers
│   │   │   │   ├── csv-transformer.service.ts
│   │   │   │   ├── xml-transformer.service.ts
│   │   │   │   ├── hl7-transformer.service.ts
│   │   │   │   ├── fhir-transformer.service.ts
│   │   │   │   └── dicom-transformer.service.ts
│   │   │   ├── validators/           # Data validators
│   │   │   │   ├── schema-validator.service.ts
│   │   │   │   ├── data-validator.service.ts
│   │   │   │   ├── business-rule-validator.service.ts
│   │   │   │   └── constraint-validator.service.ts
│   │   │   ├── engine/               # Mapping engine
│   │   │   │   ├── mapping-engine.service.ts
│   │   │   │   ├── mapping-rule-engine.service.ts
│   │   │   │   ├── mapping-executor.service.ts
│   │   │   │   └── mapping-scheduler.service.ts
│   │   │   └── config/               # Mapping configuration
│   │   │       ├── mapping-config.service.ts
│   │   │       ├── mapping-rule-loader.service.ts
│   │   │       ├── mapping-template.service.ts
│   │   │       └── mapping-version.service.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── schema-mapping.controller.ts
│   │   │   ├── mapping-rule.controller.ts
│   │   │   ├── mapping-execution.controller.ts
│   │   │   └── mapping-validation.controller.ts
│   │   ├── dto/                      # Data Transfer Objects
│   │   │   ├── schema-info.dto.ts
│   │   │   ├── mapping-rule.dto.ts
│   │   │   ├── mapping-result.dto.ts
│   │   │   └── validation-result.dto.ts
│   │   └── integration-adapter.module.ts
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
│   │   ├── schema-mapping/           # Schema mapping definitions
│   │   │   ├── interfaces/           # Schema mapping interfaces
│   │   │   │   ├── schema-analyzer.interface.ts
│   │   │   │   ├── schema-mapper.interface.ts
│   │   │   │   ├── data-transformer.interface.ts
│   │   │   │   └── data-validator.interface.ts
│   │   │   ├── enums/                # Schema mapping enums
│   │   │   │   ├── schema-type.enum.ts
│   │   │   │   ├── mapping-type.enum.ts
│   │   │   │   ├── validation-type.enum.ts
│   │   │   │   └── transformation-type.enum.ts
│   │   │   ├── types/                # Schema mapping types
│   │   │   │   ├── schema-info.type.ts
│   │   │   │   ├── mapping-rule.type.ts
│   │   │   │   ├── mapping-result.type.ts
│   │   │   │   └── validation-result.type.ts
│   │   │   └── utils/                # Schema mapping utilities
│   │   │       ├── schema-analyzer.util.ts
│   │   │       ├── schema-mapper.util.ts
│   │   │       ├── data-transformer.util.ts
│   │   │       └── data-validator.util.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
│

```

---

**Định nghĩa hoàn thành checklist:**

✅ Một mục chỉ được đánh [x] nếu có: Mapping hoàn chỉnh, validation pass, documentation đầy đủ, test coverage, review và approval.

## Checklist triển khai

### 1. Những việc đã làm
- [ ] [High] Phân tích schema của các hệ thống nguồn
- [ ] [High] Thiết kế schema EMR mới
- [ ] [Medium] Đánh giá sơ bộ về độ phức tạp mapping

### 2. Những việc cần làm

#### 2.1. Schema Analysis
- [ ] [High] **HIS Schema Analysis**
  - [ ] [High] Phân tích database schema của HIS
  - [ ] [High] Xác định các bảng và relationships chính
  - [ ] [High] Map patient demographics tables
  - [ ] [Medium] Map appointment và scheduling tables
  - [ ] [Medium] Map billing và financial tables
  - [ ] [Low] Map pharmacy và medication tables
  - [ ] [Low] Map clinical documentation tables

- [ ] [High] **LIS Schema Analysis**
  - [ ] [High] Phân tích HL7 message structure
  - [ ] [High] Map laboratory orders schema
  - [ ] [High] Map laboratory results schema
  - [ ] [Medium] Map specimen information schema
  - [ ] [Medium] Map quality control schema
  - [ ] [Low] Map instrument data schema
  - [ ] [Low] Map reference ranges schema

- [ ] [High] **RIS Schema Analysis**
  - [ ] [High] Phân tích DICOM metadata schema
  - [ ] [High] Map radiology orders schema
  - [ ] [High] Map study information schema
  - [ ] [Medium] Map modality information schema
  - [ ] [Medium] Map radiologist reports schema
  - [ ] [Low] Map billing information schema
  - [ ] [Low] Map quality metrics schema

- [ ] [High] **PACS Schema Analysis**
  - [ ] [High] Phân tích DICOM file structure
  - [ ] [High] Map image metadata schema
  - [ ] [High] Map storage location schema
  - [ ] [Medium] Map image routing schema
  - [ ] [Medium] Map archive management schema
  - [ ] [Low] Map backup và recovery schema
  - [ ] [Low] Map access control schema

- [ ] [High] **Legacy EMR Schema Analysis**
  - [ ] [High] Phân tích database schema của EMR cũ
  - [ ] [High] Map patient records schema
  - [ ] [High] Map clinical documentation schema
  - [ ] [Medium] Map medication records schema
  - [ ] [Medium] Map laboratory results schema
  - [ ] [Low] Map radiology reports schema
  - [ ] [Low] Map administrative data schema

#### 2.2. EMR Schema Design
- [ ] [High] **Core Entity Design**
  - [ ] [High] Thiết kế Patient entity schema
  - [ ] [High] Thiết kế Appointment entity schema
  - [ ] [High] Thiết kế MedicalRecord entity schema
  - [ ] [Medium] Thiết kế Medication entity schema
  - [ ] [Medium] Thiết kế Laboratory entity schema
  - [ ] [Low] Thiết kế Radiology entity schema
  - [ ] [Low] Thiết kế Billing entity schema

- [ ] [High] **Relationship Design**
  - [ ] [High] Thiết kế relationships giữa các entities
  - [ ] [High] Implement foreign key constraints
  - [ ] [High] Thiết kế many-to-many relationships
  - [ ] [Medium] Implement referential integrity
  - [ ] [Medium] Thiết kế inheritance hierarchies
  - [ ] [Low] Implement audit trails
  - [ ] [Low] Thiết kế versioning support

- [ ] [High] **Data Type Mapping**
  - [ ] [High] Map data types từ source systems
  - [ ] [High] Implement data type conversions
  - [ ] [High] Handle null values và defaults
  - [ ] [Medium] Implement data validation rules
  - [ ] [Medium] Handle encoding conversions
  - [ ] [Low] Implement data compression
  - [ ] [Low] Handle large object storage

#### 2.3. Mapping Rules Design
- [ ] [High] **Field-level Mapping**
  - [ ] [High] Define mapping rules cho từng field
  - [ ] [High] Implement data transformations
  - [ ] [High] Handle field name differences
  - [ ] [Medium] Implement conditional mapping
  - [ ] [Medium] Handle field value mappings
  - [ ] [Low] Implement custom mapping functions
  - [ ] [Low] Handle field dependencies

- [ ] [High] **Entity-level Mapping**
  - [ ] [High] Map entities từ source to target
  - [ ] [High] Handle entity relationships
  - [ ] [High] Implement entity transformations
  - [ ] [Medium] Handle entity hierarchies
  - [ ] [Medium] Implement entity validation
  - [ ] [Low] Handle entity versioning
  - [ ] [Low] Implement entity merging

- [ ] [High] **Business Logic Mapping**
  - [ ] [High] Implement business rules
  - [ ] [High] Handle data validation logic
  - [ ] [High] Implement data enrichment rules
  - [ ] [Medium] Handle data cleansing logic
  - [ ] [Medium] Implement data aggregation rules
  - [ ] [Low] Handle complex transformations
  - [ ] [Low] Implement workflow logic

#### 2.4. Mapping Implementation
- [ ] [High] **Mapping Engine Development**
  - [ ] [High] Implement core mapping engine
  - [ ] [High] Support configuration-based mapping
  - [ ] [High] Implement mapping validation
  - [ ] [Medium] Add mapping performance optimization
  - [ ] [Medium] Implement mapping error handling
  - [ ] [Low] Add mapping monitoring
  - [ ] [Low] Implement mapping rollback

- [ ] [High] **Transformation Logic**
  - [ ] [High] Implement data transformation functions
  - [ ] [High] Support custom transformation rules
  - [ ] [High] Handle complex data conversions
  - [ ] [Medium] Implement data enrichment logic
  - [ ] [Medium] Handle data cleansing operations
  - [ ] [Low] Implement data aggregation logic
  - [ ] [Low] Handle data splitting operations

- [ ] [High] **Validation Framework**
  - [ ] [High] Implement data validation rules
  - [ ] [High] Support business rule validation
  - [ ] [High] Handle validation error reporting
  - [ ] [Medium] Implement validation performance optimization
  - [ ] [Medium] Add validation monitoring
  - [ ] [Low] Implement validation rollback
  - [ ] [Low] Handle validation dependencies

#### 2.5. Mapping Configuration
- [ ] [High] **Configuration Management**
  - [ ] [High] Design mapping configuration schema
  - [ ] [High] Implement configuration validation
  - [ ] [High] Support configuration versioning
  - [ ] [Medium] Add configuration management UI
  - [ ] [Medium] Implement configuration backup
  - [ ] [Low] Add configuration rollback
  - [ ] [Low] Handle configuration dependencies

- [ ] [High] **Mapping Templates**
  - [ ] [High] Create mapping templates cho từng system
  - [ ] [High] Support template customization
  - [ ] [High] Implement template validation
  - [ ] [Medium] Add template versioning
  - [ ] [Medium] Support template inheritance
  - [ ] [Low] Add template documentation
  - [ ] [Low] Handle template dependencies

### 3. Bổ sung checklist nâng cao

#### 3.1. Advanced Mapping Features
- [ ] [Medium] **Dynamic Mapping**
  - [ ] [Medium] Support runtime mapping changes
  - [ ] [Medium] Implement dynamic field mapping
  - [ ] [Medium] Handle schema evolution
  - [ ] [Low] Support mapping hot-swapping
  - [ ] [Low] Implement mapping discovery

- [ ] [Medium] **Intelligent Mapping**
  - [ ] [Medium] Implement AI-assisted mapping
  - [ ] [Medium] Support pattern-based mapping
  - [ ] [Medium] Handle fuzzy matching
  - [ ] [Low] Implement learning algorithms
  - [ ] [Low] Support mapping suggestions

- [ ] [Medium] **Performance Optimization**
  - [ ] [Medium] Implement parallel mapping
  - [ ] [Medium] Add mapping caching
  - [ ] [Medium] Optimize mapping algorithms
  - [ ] [Low] Implement mapping batching
  - [ ] [Low] Add mapping compression

#### 3.2. Quality Assurance
- [ ] [Medium] **Data Quality Management**
  - [ ] [Medium] Implement data quality checks
  - [ ] [Medium] Add data quality monitoring
  - [ ] [Medium] Handle data quality issues
  - [ ] [Low] Implement data quality reporting
  - [ ] [Low] Add data quality improvement

- [ ] [Medium] **Testing và Validation**
  - [ ] [Medium] Implement unit tests cho mapping
  - [ ] [Medium] Add integration tests
  - [ ] [Medium] Conduct performance tests
  - [ ] [Low] Implement regression tests
  - [ ] [Low] Add user acceptance tests

#### 3.3. Monitoring và Maintenance
- [ ] [Medium] **Mapping Monitoring**
  - [ ] [Medium] Implement mapping performance monitoring
  - [ ] [Medium] Add mapping error tracking
  - [ ] [Medium] Handle mapping alerts
  - [ ] [Low] Implement mapping dashboards
  - [ ] [Low] Add mapping analytics

- [ ] [Medium] **Maintenance và Support**
  - [ ] [Medium] Implement mapping maintenance procedures
  - [ ] [Medium] Add mapping documentation
  - [ ] [Medium] Handle mapping support
  - [ ] [Low] Implement mapping training
  - [ ] [Low] Add mapping troubleshooting

#### 3.4. Documentation và Training
- [ ] [Medium] **Technical Documentation**
  - [ ] [Medium] Document mapping rules
  - [ ] [Medium] Create mapping diagrams
  - [ ] [Medium] Add mapping examples
  - [ ] [Low] Implement mapping guides
  - [ ] [Low] Add mapping best practices

- [ ] [Medium] **Training và Support**
  - [ ] [Medium] Create mapping training materials
  - [ ] [Medium] Implement mapping workshops
  - [ ] [Medium] Add mapping support procedures
  - [ ] [Low] Implement mapping certification
  - [ ] [Low] Add mapping knowledge base 