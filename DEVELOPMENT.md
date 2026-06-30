# 二次开发指南

## 环境准备

```bash
# 克隆仓库
git clone https://github.com/yourname/all-format-skill.git
cd all-format-skill

# 安装依赖
npm install

# 运行测试
npm test
```

## 添加新的文档类型支持

以"法律意见书"为例，演示如何扩展新的文档类型：

### 1. 创建示例目录

```bash
mkdir examples/legal-opinion
```

### 2. 准备样本数据

收集 3-5 份历史法律意见书，去除敏感信息后放入示例目录。同时编写 `template-guide.md` 说明编制规范。

### 3. 测试模板学习

```javascript
const { AllFormatSkill } = require('./src');

const skill = new AllFormatSkill();

const samples = [
  { name: '意见书A', content: '...' },
  { name: '意见书B', content: '...' },
  { name: '意见书C', content: '...' }
];

(async () => {
  const config = await skill.learnTemplate(samples, guideText);
  skill.saveTemplateConfig('examples/legal-opinion/template-config.json');
})();
```

### 4. 调优字段识别

如果自动识别的字段名不够准确，可以在 `template-config.json` 中手动调整：

```json
{
  "fields": [
    {
      "id": "field_1",
      "name": "clientName",
      "description": "委托方名称",
      "required": true
    }
  ]
}
```

## 自定义字段标记规则

默认使用 `{{fieldName}}` 作为占位符，如需改为其他格式：

```javascript
const skill = new AllFormatSkill({
  fieldMarkers: { open: '【', close: '】' }
});

// 模板中写作：【委托方名称】
```

## 接入外部数据源

将数据填充管线对接企业数据库或 CRM 系统：

```javascript
const { AllFormatSkill } = require('./src');
const { queryClientDatabase } = require('./adapters/client-db');

class EnterpriseSkill extends AllFormatSkill {
  async generateFromClientId(clientId, templateConfig) {
    const data = await queryClientDatabase(clientId);
    return this.generate(data, templateConfig);
  }
}
```

## 添加 PDF 输出支持

当前默认输出 Word 格式，如需增加 PDF：

```bash
npm install puppeteer
```

在 `src/generate-doc.js` 中增加渲染分支：

```javascript
async function generatePDF(data, templateConfig) {
  const html = renderToHTML(data, templateConfig);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
}
```

## 集成到 CI/CD 流水线

```yaml
# .github/workflows/generate-reports.yml
name: Batch Generate Reports
on:
  schedule:
    - cron: '0 9 * * 1'  # 每周一早 9 点
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: node scripts/batch-generate.js
      - uses: actions/upload-artifact@v4
        with:
          name: reports
          path: output/*.docx
```

## 调试技巧

### 查看模板配置

```javascript
const config = skill.templateConfig;
console.log(JSON.stringify(config, null, 2));
```

### 验证字段映射

```javascript
const { buildFieldMap } = require('./src/generate-doc');
const map = buildFieldMap(data, config.fields);
console.log(map);
```

### 输出中间产物

在 `generateDocument` 中插入调试代码，将填充后的文本保存到 `temp/` 目录，便于检查替换是否正确。

## 提交贡献

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/xxx`
3. 提交改动：`git commit -am 'Add xxx'`
4. 推送分支：`git push origin feature/xxx`
5. 提交 Pull Request

## 常见问题

**Q: 模板学习时识别字段数过少？**
A: 增加样本文档数量（建议 3-5 份），或提供更详细的编制指引。

**Q: 生成的文档格式与原文不一致？**
A: 当前版本基于 docx 库重建文档，复杂样式（如页眉页脚中的图片）可能需要手动调整。

**Q: 支持中文竖排或特殊排版吗？**
A: 当前版本主要支持常规横排文档。特殊排版需求建议通过自定义渲染后端实现。
