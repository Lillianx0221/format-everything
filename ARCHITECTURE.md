# 系统架构说明

## 总体架构

全都格式化 Skill 采用分层架构设计，由三层核心模块组成：

```
┌─────────────────────────────────────────┐
│           用户交互层 (Agent Dialogue)        │
│    对话引导 / 文件上传 / 结果预览 / 反馈修正     │
├─────────────────────────────────────────┤
│           业务逻辑层 (Core Engine)           │
│  模板分析引擎  │  数据填充管线  │  文档生成引擎   │
├─────────────────────────────────────────┤
│           基础设施层 (Infrastructure)        │
│  文件解析  │  文本比对  │  Word 渲染  │  配置管理   │
└─────────────────────────────────────────┘
```

## 核心模块职责

### 1. 模板分析引擎 (analyze-template.js)

负责从已有成品报告中学习模板结构，是系统的"理解"能力来源。

**输入**：2-5 份成品报告（Word 或纯文本）+ 可选编制指引
**输出**：模板配置 JSON（含字段定义、结构层级、固定内容）

**关键技术点**：
- **重复模式检测**：通过多文档逐行比对，识别固定套话段落
- **差异片段提取**：找出各文档间不一致的部分，作为动态字段候选
- **字段语义推断**：结合上下文和编制指引，为候选字段赋予有意义的名称
- **结构层级识别**：通过标题正则（第X章、1. 、(1) 等）重建文档大纲

### 2. 文档生成引擎 (generate-doc.js)

负责将原始数据填充到模板中，输出格式化的 Word 文档。

**输入**：原始数据对象 + 模板配置
**输出**：.docx 文件 Buffer

**关键技术点**：
- **占位符替换**：将 `{{fieldName}}` 替换为实际数据值
- **样式继承**：保留原模板的字体、字号、段落间距、页边距等样式
- **目录生成**：自动根据标题层级生成可更新的目录域
- **批量输出**：支持单次最多 100 份文档的批量生成

### 3. 数据填充管线 (Data Pipeline)

连接模板与数据的桥梁，负责字段映射、校验和转换。

**处理流程**：
```
原始数据 JSON
    ↓
字段存在性校验（strictMode）
    ↓
数据类型转换（string / number / date / text）
    ↓
字段映射表构建（fieldName → value）
    ↓
占位符全局替换
    ↓
样式渲染与排版
```

## 数据模型

### 模板配置 (TemplateConfig)

```typescript
interface TemplateConfig {
  version: string;           // 配置版本号
  createdAt: string;         // 创建时间
  sampleCount: number;       // 学习样本数量
  structure: Section[];      // 文档章节结构
  fields: Field[];           // 动态字段定义
  fixedPatterns: string[];   // 固定内容段落
  fieldMarkers: Markers;     // 占位符标记规则
  guideApplied: boolean;     // 是否使用了编制指引
}

interface Section {
  level: number;             // 标题层级 1-4
  title: string;             // 章节标题（可能含占位符）
  lineIndex: number;         // 在原文中的行号
}

interface Field {
  id: string;                // 字段唯一标识
  name: string;              // 字段名称（用于数据映射）
  description: string;       // 字段描述/上下文
  required: boolean;         // 是否必填
  type: 'string' | 'number' | 'date' | 'text';
  examples: string[];        // 样例值
  markers: {
    open: string;
    close: string;
    placeholder: string;     // 如 {{clientName}}
  };
}
```

## 扩展点设计

系统在以下位置预留了扩展接口：

| 扩展点 | 说明 | 示例场景 |
|--------|------|----------|
| `extractTextFromDocx` | 文档解析器 | 替换为支持 PDF、WPS 的解析器 |
| `guessFieldName` | 字段命名策略 | 接入 NLP 模型提升命名准确率 |
| `generateDocument` | 渲染后端 | 增加 PDF、PPT 输出支持 |
| `validateData` | 数据校验规则 | 接入外部数据库验证客户名称 |

## 性能特征

- **模板学习**：单次处理 5 份 50 页以内的报告，耗时 < 10 秒
- **单份生成**：平均 < 1 秒
- **批量生成**：100 份文档，总耗时 < 5 秒（不含 I/O）
- **内存占用**：单进程 < 200MB
