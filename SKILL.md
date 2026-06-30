---
name: all-format-documents
description: 当用户需要批量生成结构相似的报告文档时，自动分析已有报告模板结构、识别动态字段并填充数据，生成格式化的 Word 文档。适用于专利检索报告、法律意见书、审计报告、投标文件等 2B 企业服务场景。不适用于需要创意写作、完全开放式内容或无固定模板的文档生成。
---

# 全都格式化 (AllFormat Documents)

## 描述

分析已有报告成品，自动提取模板结构、标记动态字段，并基于原始数据批量生成格式化 Word 文档。将单份报告制作时间从 30 分钟压缩到 3 秒。

## 使用场景

Use this skill when:

- 用户上传了 2-5 份已有的报告成品，要求学习模板结构
- 用户提供了原始数据（JSON/表格），要求基于已学习的模板生成报告
- 用户需要批量制作结构相似的文档（如专利检索报告、法律意见书、审计报告）
- 用户要求更新或调整已有的模板配置

Do NOT use this skill when:

- 用户只需要编辑或修改单份现有文档的内容（请使用常规编辑能力）
- 用户要求生成无固定结构、完全开放式的创意文案
- 用户未提供任何样本报告或数据，要求从零设计全新文档格式
- 用户仅询问文档编写的一般性建议，无具体模板和数据

## 指令

### 工作流一：学习模板 (learn-template)

当用户上传已有报告成品时执行：

1. **提取文本**：从每份样本文档中提取纯文本内容
2. **识别固定内容**：通过多文档逐行比对，找出所有文档中完全相同的段落（固定套话）
3. **识别动态字段**：找出各文档间不一致的部分，作为动态字段候选
4. **推断字段语义**：
   - 结合文档上下文（如"委托方："后的内容推断为 clientName）
   - 结合用户提供的编制指引（如有）优化字段命名
   - 基于内容特征推断字段类型（date/number/string/text）
5. **提取文档结构**：通过标题正则（第X章、1. 、(1) 等）重建章节层级
6. **输出模板配置**：以 JSON 格式输出模板配置，包含字段定义、结构层级和固定内容

### 工作流二：生成文档 (generate-doc)

当用户基于已学习模板提供原始数据时执行：

1. **加载模板配置**：读取已保存的模板配置文件
2. **校验数据**：检查所有必填字段是否已提供（strictMode 为 true 时）
3. **构建字段映射表**：将字段名映射到实际数据值
4. **填充占位符**：将模板中的 `{{fieldName}}` 替换为实际数据
5. **组装 Word 文档**：使用 docx 库生成格式化的 .docx 文件
6. **批量输出**：支持单次最多 100 份文档的批量生成

### 工作流三：更新模板 (update-template)

当用户要求调整模板时执行：

1. 接收用户的修改指令（如添加字段、修改标题、调整格式）
2. 更新模板配置文件
3. 验证字段完整性
4. 保存新版本

## 输入

```yaml
Input:
  - workflow: string          # 工作流类型：learn-template / generate-doc / update-template
  - sampleDocs?: array        # 样本文档列表（learn-template 时必填）
    - name: string
    - content: string         # 文档纯文本内容
  - guideText?: string        # 编制指引文本（可选）
  - data?: object | array     # 原始数据（generate-doc 时必填）
  - templateConfig?: object   # 模板配置（generate-doc 时如未提前学习则必填）
  - updates?: object          # 更新内容（update-template 时必填）
```

## 输出

```yaml
Output:
  - success: boolean
  - templateConfig?: object   # 模板配置对象（learn-template 成功时返回）
  - documents?: array         # 生成的文档 Buffer 列表（generate-doc 成功时返回）
  - message?: string          # 错误信息（失败时返回）
```

## 约束

- 报告编号、客户名称、日期等关键字段必须唯一且准确
- 日期格式统一为 `YYYY年MM月DD日`
- 单批次生成上限为 100 份文档
- 输出前必须检查格式一致性
- 必填字段缺失时必须明确告知用户缺失哪些字段

## 失败策略 (On Failure)

```yaml
On Failure:
  - 样本文档不足: 提示用户至少提供 2 份样本文档，当前样本数不足
  - 字段识别失败: 请求用户提供编制指引或手动标注关键字段
  - 数据校验失败: 返回缺少的必填字段列表，要求用户补充
  - 文档生成失败: 记录具体错误信息，尝试单份重试
  - 批量超限: 提示用户分批处理，每批不超过 100 份
```

## 参考资源

- 模板分析引擎实现：`resources/analyze-template.js`
- 文档生成引擎实现：`resources/generate-doc.js`
- 通用工具函数：`resources/utils.js`
- 专利检索报告示例数据：`examples/patent-report/sample-data.json`
- 专利检索报告编制指引：`examples/patent-report/template-guide.md`
- 系统架构说明：`docs/ARCHITECTURE.md`
- 二次开发指南：`docs/DEVELOPMENT.md`
