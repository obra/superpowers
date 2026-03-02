# DWD / DWM 公共数仓层开发规则

## 1. 概述

DWD（Data Warehouse Detail，明细数据层）和 DWM（Data Warehouse Middle，中间数据层）是数仓体系中的**公共层**，承担着数据清洗、标准化、维度关联和公共指标计算的核心职责。本文档定义了 DWD/DWM 层的开发规范，确保数据一致性、可复用性和可维护性。

---

## 2. 分层定义

### 2.1 DWD 层（明细数据层）

- **定位**: 对 ODS 层数据进行清洗、去重、标准化，形成面向业务过程的明细事实数据。
- **核心职责**:
  - 数据清洗与去重
  - 字段标准化与统一编码
  - 维度退化（将常用维度冗余到事实表中）
  - 数据类型规范化
- **粒度要求**: 保持与业务过程一致的最细粒度，**不允许进行任何聚合操作**。

### 2.2 DWM 层（中间数据层）

- **定位**: 在 DWD 基础上进行跨主题域的轻度汇总和公共指标计算，为上层 DM/APP 提供高复用度的中间数据。
- **核心职责**:
  - 多表关联整合
  - 公共指标计算（UV、PV、GMV 等）
  - 跨业务域的数据拉通
  - 标签体系构建
- **粒度要求**: 可以进行轻度汇总，但需保留关键维度以满足多场景复用。

---

## 3. 命名规范

### 3.1 库名规范

```
格式: {层级}_{业务域}
示例: dwd_trade, dwd_user, dwm_marketing
```

### 3.2 表名规范

```
格式: {层级}_{业务域}_{数据域}_{业务描述}_{更新周期}
示例:
  - dwd_trade_order_detail_di          -- 交易域-订单明细-日增量
  - dwd_user_register_detail_di        -- 用户域-注册明细-日增量
  - dwm_trade_order_payment_di         -- 交易域-订单支付中间表-日增量
  - dwm_user_active_summary_di         -- 用户域-活跃汇总中间表-日增量
```

### 3.3 字段命名规范

| 规则 | 说明 | 示例 |
|------|------|------|
| 小写下划线 | 所有字段使用小写字母和下划线 | `order_id`, `user_name` |
| 含义明确 | 字段名应具有业务含义 | `payment_amount` 而非 `amt` |
| ID 字段 | 以 `_id` 结尾 | `user_id`, `order_id` |
| 金额字段 | 以 `_amount` 或 `_amt` 结尾 | `payment_amount` |
| 数量字段 | 以 `_cnt` 或 `_num` 结尾 | `order_cnt`, `item_num` |
| 时间字段 | 以 `_time` 或 `_ts` 结尾 | `create_time`, `update_ts` |
| 日期字段 | 以 `_date` 结尾 | `register_date` |
| 标志字段 | 以 `is_` 或 `has_` 开头 | `is_valid`, `has_coupon` |

---

## 4. 建表规范

### 4.1 DDL 模板

```sql
-- ============================================================
-- 表名: {表名}
-- 描述: {表描述}
-- 负责人: {负责人}
-- 创建日期: {YYYY-MM-DD}
-- 更新周期: {di/df/hi}
-- 数据来源: {源表列表}
-- ============================================================

CREATE TABLE IF NOT EXISTS {db_name}.{table_name} (
    -- 主键/业务键
    order_id            BIGINT          COMMENT '订单ID',
    
    -- 维度字段
    user_id             BIGINT          COMMENT '用户ID',
    channel_code        STRING          COMMENT '渠道编码',
    
    -- 度量字段
    order_amount        DECIMAL(18,2)   COMMENT '订单金额(元)',
    item_cnt            INT             COMMENT '商品数量',
    
    -- 状态/标志字段
    is_valid            TINYINT         COMMENT '是否有效: 1-有效, 0-无效',
    order_status        STRING          COMMENT '订单状态: CREATED/PAID/SHIPPED/COMPLETED/CANCELLED',
    
    -- 时间字段
    create_time         STRING          COMMENT '创建时间, 格式: yyyy-MM-dd HH:mm:ss',
    update_time         STRING          COMMENT '更新时间, 格式: yyyy-MM-dd HH:mm:ss',
    
    -- ETL 元数据字段
    etl_time            STRING          COMMENT 'ETL 处理时间'
)
COMMENT '{表的中文描述}'
PARTITIONED BY (
    dt                  STRING          COMMENT '日期分区, 格式: YYYYMMDD'
)
STORED AS ORC
TBLPROPERTIES (
    'orc.compress' = 'SNAPPY'
);
```

### 4.2 必填元数据字段

每张 DWD/DWM 表**必须**包含以下元数据字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `etl_time` | STRING | ETL 处理时间 |
| `dt` | STRING | 日期分区字段（分区键） |

### 4.3 数据存储规范

- **存储格式**: 统一使用 **ORC** 格式
- **压缩方式**: 统一使用 **SNAPPY** 压缩
- **分区策略**: 
  - 必须按日期 `dt` 进行分区
  - 数据量较大时可增加二级分区（如 `hour`）
  - 分区字段不允许出现在表字段中

---

## 5. ETL 开发规范

### 5.1 SQL 编写规范

```sql
-- ============================================================
-- 任务名: {任务名称}
-- 描述: {任务描述}
-- 负责人: {负责人}
-- 调度周期: {天/小时}
-- 依赖上游: {上游任务列表}
-- ============================================================

-- 设置执行参数
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;
SET hive.exec.parallel = true;
SET mapreduce.job.reduces = -1;

-- 目标表数据写入
INSERT OVERWRITE TABLE {target_db}.{target_table} PARTITION(dt = '${bizdate}')
SELECT
    -- 主键/业务键
    a.order_id,
    
    -- 维度字段（维度退化）
    a.user_id,
    b.channel_name                  AS channel_code,
    
    -- 度量字段（标准化处理）
    CAST(a.order_amount AS DECIMAL(18,2))   AS order_amount,
    a.item_cnt,
    
    -- 状态字段（编码统一）
    CASE 
        WHEN a.status IN ('1', 'valid')     THEN 1
        WHEN a.status IN ('0', 'invalid')   THEN 0
        ELSE 0
    END                             AS is_valid,
    
    -- 时间字段
    a.create_time,
    a.update_time,
    
    -- ETL 元数据
    CURRENT_TIMESTAMP()             AS etl_time
    
FROM {source_db}.{source_table} a
LEFT JOIN {dim_db}.{dim_table} b
    ON a.channel_id = b.channel_id
WHERE a.dt = '${bizdate}'
    AND a.order_id IS NOT NULL        -- 数据质量过滤
;
```

### 5.2 SQL 编写要求

1. **SELECT 字段顺序**: 按照目标表 DDL 中的字段定义顺序编写
2. **字段注释**: 关键字段必须添加行内注释
3. **表别名**: 多表关联时必须使用有意义的别名（推荐使用 `a`, `b`, `c` 或表名缩写）
4. **NULL 处理**: 关键字段必须进行 NULL 值处理
5. **类型转换**: 涉及精度运算的字段必须显式转换类型
6. **关键字大写**: SQL 关键字统一使用大写（`SELECT`, `FROM`, `WHERE` 等）

### 5.3 数据质量规范

每个 ETL 任务必须包含以下数据质量检查：

| 检查项 | 说明 | 必选 |
|--------|------|------|
| 主键唯一性 | 确保主键不重复 | ✅ |
| 空值检查 | 核心字段不允许为 NULL | ✅ |
| 行数波动 | 与前一天相比波动不超过阈值 | ✅ |
| 金额校验 | 金额字段不允许出现负值（特殊业务除外） | ⬜ |
| 时间合理性 | 时间字段在合理范围内 | ⬜ |

### 5.4 数据质量校验 SQL 示例

```sql
-- 主键唯一性检查
SELECT 
    COUNT(1) AS total_cnt,
    COUNT(DISTINCT order_id) AS distinct_cnt
FROM {db}.{table}
WHERE dt = '${bizdate}'
HAVING COUNT(1) <> COUNT(DISTINCT order_id);

-- 空值检查
SELECT COUNT(1) AS null_cnt
FROM {db}.{table}
WHERE dt = '${bizdate}'
    AND (order_id IS NULL OR user_id IS NULL);

-- 行数波动检查
SELECT 
    today.cnt AS today_cnt,
    yesterday.cnt AS yesterday_cnt,
    ABS(today.cnt - yesterday.cnt) / yesterday.cnt AS fluctuation_rate
FROM (
    SELECT COUNT(1) AS cnt FROM {db}.{table} WHERE dt = '${bizdate}'
) today
CROSS JOIN (
    SELECT COUNT(1) AS cnt FROM {db}.{table} WHERE dt = '${yesterday}'
) yesterday
HAVING ABS(today.cnt - yesterday.cnt) / yesterday.cnt > 0.3;
```

---

## 6. 性能优化规范

### 6.1 通用优化

| 优化项 | 说明 |
|--------|------|
| 分区裁剪 | 查询时必须指定分区条件，禁止全表扫描 |
| 小表广播 | JOIN 时小表使用 `MAPJOIN` 提示 |
| 数据倾斜 | 通过 `DISTRIBUTE BY` 或随机前缀处理倾斜 |
| 并行执行 | 无依赖的 Stage 允许并行执行 |

### 6.2 常见优化 Hint

```sql
-- MapJoin 优化（小表 < 25MB）
/*+ MAPJOIN(small_table) */

-- 数据倾斜处理
SET hive.optimize.skewjoin = true;
SET hive.skewjoin.key = 100000;

-- 合并小文件
SET hive.merge.mapfiles = true;
SET hive.merge.mapredfiles = true;
SET hive.merge.size.per.task = 256000000;
```

---

## 7. 变更管理

### 7.1 字段变更流程

1. 提交变更申请（需包含变更原因、影响评估）
2. 评审通过后执行 DDL 变更
3. 通知所有下游依赖方
4. 更新相关文档

### 7.2 字段变更原则

- **只增不删**: 已有字段不允许直接删除，如需废弃请标记为 `deprecated`
- **类型兼容**: 字段类型变更必须向上兼容
- **默认值**: 新增字段必须提供合理默认值

---

## 8. Checklist

开发完成后，请对照以下 Checklist 进行自检：

- [ ] 表名/字段名符合命名规范
- [ ] DDL 包含完整的 COMMENT
- [ ] 分区策略合理
- [ ] SQL 编写规范，关键字段有注释
- [ ] NULL 值已妥善处理
- [ ] 主键唯一性校验已添加
- [ ] 行数波动监控已配置
- [ ] 无全表扫描（已指定分区过滤）
- [ ] 已处理可能的数据倾斜
- [ ] 文档已更新（表描述、字段说明、血缘关系）
