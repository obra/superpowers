# DM / APP 应用层数仓开发规则

## 1. 概述

DM（Data Mart，数据集市）和 APP（Application，应用层）是数仓体系中的**应用层**，直接面向业务需求，提供最终的数据消费服务。本文档定义了 DM/APP 层的开发规范，确保开发产出的高效性、一致性和可维护性。  

---

## 2. 分层定义

### 2.1 DM 层（数据集市层）

- **定位**: 面向特定分析主题或业务域，对 DWD/DWM 层数据进行聚合、汇总，形成面向分析场景的主题宽表。
- **核心职责**:
  - 主题域聚合汇总
  - 维度交叉分析
  - 核心业务指标的多维度计算
  - 面向分析师的自助查询基础表
- **服务对象**: BI 分析师、数据分析师

### 2.2 APP 层（应用数据层）

- **定位**: 直接面向具体应用场景或数据产品的结果表，通常是高度定制化的。
- **核心职责**:
  - 面向报表/Dashboard 的聚合数据
  - 面向接口/数据服务的结果数据
  - 面向算法/模型的特征数据
  - 面向推送/消息的触达数据
- **服务对象**: 数据产品、业务系统、算法模型

---

## 3. 命名规范

### 3.1 库名规范

```
格式: {层级}_{业务域/应用名}
示例: dm_trade, dm_finance, app_recommend, app_report
```

### 3.2 表名规范

```
格式: {层级}_{业务域}_{主题/场景}_{描述}_{更新周期}
示例:
  - dm_trade_seller_summary_di         -- 数据集市-交易域-商家汇总-日增量
  - dm_user_retention_analysis_di      -- 数据集市-用户域-留存分析-日增量
  - app_report_daily_revenue_df        -- 应用层-报表-日收入-日全量
  - app_recommend_user_feature_di      -- 应用层-推荐-用户特征-日增量
  - app_push_target_user_di           -- 应用层-推送-目标用户-日增量
```

### 3.3 指标命名规范

| 指标类型 | 命名规则 | 示例 |
|----------|----------|------|
| 计数指标 | `{对象}_cnt` | `order_cnt`, `user_cnt` |
| 金额指标 | `{描述}_amount` / `{描述}_amt` | `pay_amount`, `refund_amt` |
| 比率指标 | `{描述}_rate` / `{描述}_ratio` | `conversion_rate`, `cancel_ratio` |
| 均值指标 | `avg_{描述}` | `avg_order_amount`, `avg_duration` |
| 累计指标 | `cum_{描述}` / `total_{描述}` | `cum_revenue`, `total_orders` |
| 同/环比 | `{指标}_yoy` / `{指标}_mom` | `revenue_yoy`, `order_cnt_mom` |
| 排名指标 | `{描述}_rank` | `seller_rank`, `category_rank` |

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
-- 消费方: {下游报表/接口/系统名称}
-- 数据来源: {上游表列表}
-- ============================================================

CREATE TABLE IF NOT EXISTS {db_name}.{table_name} (
    -- ========== 维度字段 ==========
    seller_id               BIGINT          COMMENT '商家ID',
    seller_name             STRING          COMMENT '商家名称',
    category_id             BIGINT          COMMENT '类目ID',
    category_name           STRING          COMMENT '类目名称',
    
    -- ========== 核心指标 ==========
    order_cnt               BIGINT          COMMENT '订单数',
    pay_amount              DECIMAL(18,2)   COMMENT '支付金额(元)',
    pay_user_cnt            BIGINT          COMMENT '支付用户数',
    avg_order_amount        DECIMAL(18,2)   COMMENT '客单价(元)',
    
    -- ========== 同环比指标 ==========
    order_cnt_mom           DECIMAL(10,4)   COMMENT '订单数环比',
    pay_amount_yoy          DECIMAL(10,4)   COMMENT '支付金额同比',
    
    -- ========== 排名指标 ==========
    seller_rank             INT             COMMENT '商家排名',
    
    -- ========== ETL 元数据 ==========
    etl_time                STRING          COMMENT 'ETL 处理时间'
)
COMMENT '{表的中文描述}'
PARTITIONED BY (
    dt                      STRING          COMMENT '日期分区, 格式: YYYYMMDD'
)
STORED AS ORC
TBLPROPERTIES (
    'orc.compress' = 'SNAPPY'
);
```

### 4.2 DM/APP 层特殊要求

| 要求 | 说明 |
|------|------|
| 宽表优先 | DM 层尽量构建宽表，减少下游 JOIN 操作 |
| 冗余维度 | 常用维度名称应冗余到表中，避免频繁关联维度表 |
| 指标口径 | 每个指标字段必须在 COMMENT 中注明计算口径 |
| 消费方标注 | DDL 头部必须注明数据消费方 |

---

## 5. ETL 开发规范

### 5.1 DM 层 SQL 编写规范

```sql
-- ============================================================
-- 任务名: dm_trade_seller_summary_di
-- 描述: 商家维度交易汇总
-- 负责人: xxx
-- 调度周期: 天
-- ============================================================

SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT OVERWRITE TABLE dm_trade.dm_trade_seller_summary_di PARTITION(dt = '${bizdate}')
SELECT
    -- 维度
    a.seller_id,
    b.seller_name,
    a.category_id,
    c.category_name,
    
    -- 核心指标
    COUNT(DISTINCT a.order_id)                              AS order_cnt,
    SUM(a.pay_amount)                                       AS pay_amount,
    COUNT(DISTINCT a.user_id)                               AS pay_user_cnt,
    SUM(a.pay_amount) / COUNT(DISTINCT a.order_id)          AS avg_order_amount,
    
    -- 环比（需关联昨日数据）
    CASE 
        WHEN d.order_cnt > 0 
        THEN (COUNT(DISTINCT a.order_id) - d.order_cnt) / d.order_cnt
        ELSE NULL
    END                                                     AS order_cnt_mom,
    
    -- 同比（需关联去年同日数据）
    NULL                                                    AS pay_amount_yoy,
    
    -- 排名
    ROW_NUMBER() OVER (ORDER BY SUM(a.pay_amount) DESC)     AS seller_rank,
    
    -- ETL 元数据
    CURRENT_TIMESTAMP()                                     AS etl_time

FROM dwd_trade.dwd_trade_order_detail_di a
LEFT JOIN dim_db.dim_seller b
    ON a.seller_id = b.seller_id
LEFT JOIN dim_db.dim_category c
    ON a.category_id = c.category_id
LEFT JOIN dm_trade.dm_trade_seller_summary_di d
    ON a.seller_id = d.seller_id
    AND d.dt = DATE_SUB('${bizdate}', 1)
WHERE a.dt = '${bizdate}'
    AND a.is_valid = 1
GROUP BY
    a.seller_id,
    b.seller_name,
    a.category_id,
    c.category_name,
    d.order_cnt
;
```

### 5.2 APP 层 SQL 编写规范

APP 层在 DM 层规范基础上，还需要注意：

1. **结果导向**: SQL 输出必须直接满足消费方需求，无需二次加工
2. **性能优先**: 如数据量大，需考虑预计算和物化
3. **数据格式**: 输出字段类型需匹配下游系统要求
4. **幂等设计**: 支持重跑不产生脏数据

```sql
-- ============================================================
-- 任务名: app_report_daily_revenue_df
-- 描述: 日收入报表数据（供 BI Dashboard 展示）
-- 负责人: xxx
-- 消费方: Revenue Dashboard / 管理层日报
-- ============================================================

INSERT OVERWRITE TABLE app_report.app_report_daily_revenue_df PARTITION(dt = '${bizdate}')
SELECT
    '${bizdate}'                                            AS stat_date,
    channel_name,
    
    -- 收入指标（保留2位小数）
    CAST(SUM(pay_amount) AS DECIMAL(18,2))                  AS total_revenue,
    CAST(SUM(pay_amount) / COUNT(DISTINCT user_id) AS DECIMAL(18,2))  AS arpu,
    
    -- 订单指标
    COUNT(DISTINCT order_id)                                AS total_orders,
    COUNT(DISTINCT user_id)                                 AS paying_users,
    
    -- 展示用的格式化字段
    CONCAT(
        CAST(ROUND(SUM(pay_amount) / 10000, 2) AS STRING),
        '万'
    )                                                       AS revenue_display,
    
    CURRENT_TIMESTAMP()                                     AS etl_time
    
FROM dm_trade.dm_trade_channel_summary_di
WHERE dt = '${bizdate}'
GROUP BY channel_name
;
```

---

## 6. 指标管理规范

### 6.1 指标定义要求

每个 DM/APP 层的指标必须明确定义以下内容：

| 属性 | 说明 | 示例 |
|------|------|------|
| 指标中文名 | 业务含义一致的中文名称 | 支付GMV |
| 指标英文名 | 字段名 | `pay_amount` |
| 计算口径 | 精确的计算公式 | `SUM(订单表.支付金额) WHERE 订单状态='已支付'` |
| 统计维度 | 指标关联的维度 | 日期、渠道、类目 |
| 统计周期 | 时间粒度 | 天/周/月 |
| 数据来源 | 上游表和字段 | `dwd_trade.order_detail.pay_amount` |
| 负责人 | 指标 Owner | xxx |

### 6.2 指标一致性

- **同一指标不同表中口径必须一致**
- 口径变更需通知所有使用方
- 建议通过指标平台统一管理

---

## 7. 数据导出规范

### 7.1 导出到 MySQL/ClickHouse

```sql
-- 导出配置示例
-- 目标表: mysql_db.report_daily_revenue
-- 导出方式: 全量覆盖
-- 导出工具: DataX / Sqoop

-- 注意事项:
-- 1. 目标表需提前建好, 字段类型与 Hive 表一一对应
-- 2. 大数据量需分批导出, 避免目标库压力过大
-- 3. 导出完成后需校验行数一致性
```

### 7.2 导出字段类型映射

| Hive 类型 | MySQL 类型 | 注意事项 |
|-----------|------------|----------|
| BIGINT | BIGINT | 直接映射 |
| STRING | VARCHAR(N) | 需要指定长度 |
| DECIMAL(18,2) | DECIMAL(18,2) | 精度需一致 |
| INT | INT | 直接映射 |
| TINYINT | TINYINT | 直接映射 |

---

## 8. 性能优化建议

### 8.1 DM/APP 层专属优化

| 优化项 | 说明 |
|--------|------|
| 预计算 | 高频查询的复杂指标建议预计算 |
| 物化中间结果 | 多个 APP 表共用的中间逻辑抽取为 DWM 层 |
| 控制宽表宽度 | DM 宽表字段建议不超过 **200** 个 |
| 增量更新 | 数据量巨大的 APP 表考虑增量写入 |
| 并行度控制 | 导出任务并行度需评估目标库承受能力 |

### 8.2 查询优化

```sql
-- 避免: SELECT * 全字段查询
-- 推荐: 只查询需要的字段
SELECT seller_id, pay_amount, order_cnt
FROM dm_trade.dm_trade_seller_summary_di
WHERE dt = '${bizdate}';

-- 避免: 不带分区过滤
-- 推荐: 必须带分区条件
SELECT * 
FROM dm_trade.dm_trade_seller_summary_di
WHERE dt BETWEEN '20250101' AND '20250131';
```

---

## 9. 监控告警规范

### 9.1 必配监控项

| 监控项 | 说明 | 阈值建议 |
|--------|------|----------|
| 任务完成时间 | 确保产出时间满足 SLA | 根据业务 SLA 定制 |
| 数据行数 | 监控产出数据量异常 | 波动 > 30% 告警 |
| 空值比例 | 核心指标不允许大面积空值 | 空值率 > 5% 告警 |
| 指标波动 | 核心指标异常波动 | 波动 > 50% 告警 |
| 导出状态 | 数据导出是否成功 | 失败即告警 |

### 9.2 SLA 管理

| APP 重要级别 | SLA 要求 | 示例 |
|-------------|----------|------|
| P0 | 每日 08:00 前产出 | 管理层日报、核心 Dashboard |
| P1 | 每日 10:00 前产出 | 运营日报、业务 Dashboard |
| P2 | 每日 12:00 前产出 | 分析专题报表 |
| P3 | 每日 16:00 前产出 | 非紧急数据需求 |

---

## 10. Checklist

开发完成后，请对照以下 Checklist 进行自检：

- [ ] 表名/指标名符合命名规范
- [ ] DDL 中每个指标字段都注明了计算口径
- [ ] 消费方已在 DDL 头部标注
- [ ] 指标口径与其他表一致（无二义性）
- [ ] 同环比指标计算逻辑正确
- [ ] 分区策略满足下游查询需求
- [ ] 数据导出映射关系已确认
- [ ] 行数/指标波动监控已配置
- [ ] SLA 时间已与消费方确认
- [ ] 无全表扫描（已指定分区过滤）
- [ ] 文档已更新（指标口径、血缘关系）
