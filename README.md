# 全都格式化 (AllFormat Documents)

一个 TRAE 技能（Skill），专为企业服务场景中的结构化文档批量生成而设计。

## 解决什么问题

在 2B（企业对企业）服务场景中，大量文档具有固定模板结构和重复套话，但每次都需要人工逐项填入数据、调整格式：

- **专利审查报告** — 模板固定，仅检索结果和分析结论不同
- **法律意见书** — 格式规范，仅案件事实和法律适用不同
- **审计报告** — 结构统一，仅财务数据和审计意见不同
- **投标文件** — 框架一致，仅项目参数和响应内容不同

单份报告耗时 30 分钟以上，且极易出现漏填、错填、格式错乱等问题。

## 核心价值

| 指标 | 使用前 | 使用后 |
|------|--------|--------|
| 单份报告耗时 | 30 分钟 | 3 秒 |
| 月度 100 份耗时 | 50 小时 | 5 分钟 |
| 格式错误率 | 难以避免 | 趋近于零 |
| 新人上手周期 | 1-2 周 | 即时可用 |

## 适用人群

- 知识产权代理所：专利检索分析报告、商标审查报告
- 律师事务所：法律意见书、合同审查报告、尽职调查报告
- 会计师事务所：审计报告、财务分析报告
- 咨询公司：行业研究报告、竞品分析报告
- 招投标服务机构：投标文件

## 工作原理

```
已有报告成品 + 编制指引
        ↓
  模板结构分析（AI 自动）
        ↓
  生成 Word 模板 + 数据填充管线
        ↓
  输出可复用 Skill 包
        ↓
  原始数据 → 自动生成格式化报告
```

## 安装到 TRAE

### 方式一：作为项目技能（推荐）

将本技能文件夹复制到你的项目目录下：

```bash
# 在你的项目根目录执行
mkdir -p .trae/skills
cp -r /path/to/all-format-skill .trae/skills/
```

TRAE IDE 会自动发现 `.trae/skills/all-format-skill/` 下的 `SKILL.md` 文件。

### 方式二：作为全局技能

将本技能文件夹复制到全局技能目录：

```bash
# macOS / Linux
mkdir -p ~/.trae-cn/skills
cp -r /path/to/all-format-skill ~/.trae-cn/skills/

# Windows
mkdir %userprofile%\.trae-cn\skills
xcopy /E /I C:\path\to\all-format-skill %userprofile%\.trae-cn\skills\all-format-skill
```

### 方式三：通过 zip 上传（TRAE Work）

1. 将 `all-format-skill/` 文件夹打包为 zip 文件
2. 打开 TRAE Work → 技能管理中心 → 上传技能
3. 选择打包好的 zip 文件，TRAE Work 会自动解析并安装

### 方式四：通过 .agents 技能目录

```bash
# 在项目根目录执行
mkdir -p .agents/skills
cp -r /path/to/all-format-skill .agents/skills/
```

然后在 TRAE IDE 设置中打开 **启用 .agents 技能目录** 开关。

## 使用流程

**第一步：学习模板**

上传 2-5 份已有的成品报告和一份编制指引（如有），Agent 会自动：
- 识别文档的章节结构
- 标记动态数据字段（如客户名称、日期、金额等）
- 提取固定套话和可变内容的边界
- 生成标准化 Word 模板

**第二步：提供数据**

以 JSON 或表格形式提供原始数据，Agent 将：
- 按字段映射规则填充模板
- 自动处理页眉页脚、目录、编号
- 生成可直接交付的 `.docx` 文件

**第三步：迭代优化**

如需调整格式或补充字段，直接对话告知，Agent 会更新 Skill 包配置。

## 项目结构

```
all-format-skill/
├── SKILL.md                          # 技能核心定义（TRAE 识别入口）
├── README.md                         # 项目说明
├── .gitignore
├── resources/                        # 可执行脚本与参考资源
│   ├── analyze-template.js           # 模板分析引擎
│   ├── generate-doc.js               # 文档生成引擎
│   └── utils.js                      # 通用工具函数
├── examples/                         # 输入/输出示例
│   └── patent-report/
│       ├── sample-data.json          # 示例数据
│       └── template-guide.md         # 编制指引样例
└── docs/                             # 参考文档
    ├── ARCHITECTURE.md               # 系统架构说明
    └── DEVELOPMENT.md                # 二次开发指南
```

## 示例：专利检索报告

### 1. 准备材料

- 3 份历史专利检索报告（Word 格式）
- 编制指引（说明各章节填写规范，可选）

### 2. 运行分析

```
用户：请基于这三份报告学习模板结构
Agent：已识别出以下结构：
  - 封面：报告编号、委托方、日期（动态）
  - 第一章 检索目的：固定套话
  - 第二章 技术领域分析：动态内容
  - 第三章 检索策略：半固定（策略描述+动态关键词）
  - ...
  共标记 12 个动态字段，生成模板文件。
```

### 3. 批量生成

```
用户：请为以下 10 所学校生成本周的专利检索报告
Agent：[生成 10 份 .docx 文件]
```

## 技术特点

- **零代码使用**：非技术人员通过对话即可完成模板学习和报告生成
- **经验固化**：资深员工的编制经验被编码为可复用 Skill，减少知识流失
- **格式一致性**：由机器保证输出格式统一，消除人为差异
- **按需加载**：TRAE 仅在判断任务相关时才加载本技能，不占用额外上下文

## 配置说明

在 `SKILL.md` 的约束部分可自定义以下行为：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `outputFormat` | 输出文档格式 | `docx` |
| `strictMode` | 是否严格校验必填字段 | `true` |
| `preserveStyles` | 是否保留原文档样式 | `true` |
| `fieldMarkers` | 动态字段标记规则 | `{{fieldName}}` |
| `maxBatchSize` | 单次批量生成最大数量 | `100` |

## 二次开发

如需扩展功能（如对接数据库、增加 PDF 输出、接入审批流），参考 `docs/DEVELOPMENT.md`。

## 许可证

MIT License

## 反馈与支持

如有问题或建议，欢迎提交 Issue 。
