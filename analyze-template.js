/**
 * 模板分析引擎
 * 自动识别文档结构、提取动态字段、生成字段映射表
 */

const { extractTextFromDocx, findRepeatingPatterns, findVariableSegments } = require('./utils');

/**
 * 分析样本文档，提取模板结构
 * @param {Array} sampleDocs - 样本文档数组
 * @param {Object} options - 配置选项
 */
async function analyzeTemplate(sampleDocs, options = {}) {
  const { guideText = '', fieldMarkers } = options;

  // 1. 提取所有样本文本的纯文本内容
  const docTexts = sampleDocs.map(doc => ({
    name: doc.name,
    text: doc.content || (await extractTextFromDocx(doc.buffer))
  }));

  // 2. 找出多份文档中的重复结构（固定内容）
  const fixedPatterns = findRepeatingPatterns(docTexts.map(d => d.text));

  // 3. 找出差异部分（动态字段候选）
  const variableCandidates = findVariableSegments(docTexts, fixedPatterns);

  // 4. 结合编制指引优化字段识别
  const fields = inferFields(variableCandidates, guideText, fieldMarkers);

  // 5. 提取样式信息（标题层级、段落样式等）
  const structure = extractDocumentStructure(docTexts[0].text);

  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    sampleCount: sampleDocs.length,
    structure,
    fields,
    fixedPatterns: fixedPatterns.map(p => p.text),
    fieldMarkers,
    guideApplied: guideText.length > 0
  };
}

/**
 * 从差异片段中推断字段定义
 */
function inferFields(candidates, guideText, markers) {
  const fields = [];
  const guideHints = parseGuideHints(guideText);

  candidates.forEach((candidate, idx) => {
    // 基于位置和上下文推断字段名
    let fieldName = guessFieldName(candidate, guideHints);

    fields.push({
      id: `field_${idx + 1}`,
      name: fieldName,
      description: candidate.context || '',
      required: candidate.isRequired !== false,
      type: inferFieldType(candidate.values),
      examples: candidate.values.slice(0, 3),
      markers: {
        open: markers.open,
        close: markers.close,
        placeholder: `${markers.open}${fieldName}${markers.close}`
      }
    });
  });

  return fields;
}

/**
 * 基于上下文猜测字段名称
 */
function guessFieldName(candidate, guideHints) {
  // 如果有编制指引的提示，优先使用
  const contextMatch = guideHints.find(h =>
    candidate.context.includes(h.keyword)
  );
  if (contextMatch) return contextMatch.fieldName;

  // 基于内容特征推断
  const sample = candidate.values[0] || '';
  if (/\d{4}[年/-]\d{1,2}[月/-]\d{1,2}/.test(sample)) return 'date';
  if (/^(甲方|乙方|委托方|受托方|客户)/.test(candidate.context)) return 'clientName';
  if (/\d+/.test(sample) && sample.length < 20) return 'serialNumber';
  if (sample.length > 100) return 'content';

  return `field_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 推断字段数据类型
 */
function inferFieldType(values) {
  if (values.every(v => /^\d+$/.test(v))) return 'number';
  if (values.every(v => /^\d{4}[年/-]\d{1,2}[月/-]\d{1,2}/.test(v))) return 'date';
  if (values.some(v => v.includes('\n') || v.length > 200)) return 'text';
  return 'string';
}

/**
 * 解析编制指引中的字段提示
 */
function parseGuideHints(guideText) {
  if (!guideText) return [];
  const hints = [];
  const regex = /["「『]([^"」』]+)["」』].*?填[写入学].*?([\u4e00-\u9fa5_a-zA-Z0-9]+)/g;
  let match;
  while ((match = regex.exec(guideText)) !== null) {
    hints.push({ keyword: match[1], fieldName: match[2] });
  }
  return hints;
}

/**
 * 提取文档层级结构
 */
function extractDocumentStructure(text) {
  const lines = text.split('\n');
  const structure = [];
  const headingRegex = /^(第[一二三四五六七八九十]+章|[\d]+\.\s*|【.+】)/;

  lines.forEach((line, idx) => {
    if (headingRegex.test(line.trim())) {
      structure.push({
        level: estimateLevel(line),
        title: line.trim(),
        lineIndex: idx
      });
    }
  });

  return structure;
}

function estimateLevel(line) {
  if (/^第[一二三四五六七八九十]+章/.test(line)) return 1;
  if (/^\d+\./.test(line)) return 2;
  if (/^\(\d+\)/.test(line)) return 3;
  return 4;
}

module.exports = { analyzeTemplate, inferFields, guessFieldName };
