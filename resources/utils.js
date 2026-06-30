/**
 * 通用工具函数
 */

const fs = require('fs');

/**
 * 从 Word 文档中提取纯文本（简化实现）
 * 实际项目中可集成 mammoth.js 等库
 */
async function extractTextFromDocx(buffer) {
  // 此处为简化示意，真实场景应使用 mammoth 或 unzip + xml 解析
  // const mammoth = require('mammoth');
  // const result = await mammoth.extractRawText({ buffer });
  // return result.value;
  return '[文档文本提取功能需要集成 mammoth.js]';
}

/**
 * 找出多份文本中的重复模式（固定内容）
 */
function findRepeatingPatterns(texts) {
  if (texts.length < 2) return [];

  const patterns = [];
  const baseText = texts[0];
  const otherTexts = texts.slice(1);

  // 按行比较找出相同的段落
  const baseLines = baseText.split('\n');

  baseLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.length < 5) return; // 忽略过短行

    const isCommon = otherTexts.every(t =>
      t.split('\n').some(l => l.trim() === trimmed)
    );

    if (isCommon) {
      patterns.push({ text: trimmed, lineIndex: idx });
    }
  });

  return patterns;
}

/**
 * 找出各文档间的差异片段（动态字段候选）
 */
function findVariableSegments(docTexts, fixedPatterns) {
  const candidates = [];
  const fixedSet = new Set(fixedPatterns.map(p => p.text));

  // 逐行扫描，找出不一致的部分
  const maxLines = Math.max(...docTexts.map(d => d.text.split('\n').length));

  for (let i = 0; i < maxLines; i++) {
    const lineValues = docTexts.map(d => {
      const lines = d.text.split('\n');
      return lines[i] ? lines[i].trim() : '';
    });

    // 如果该行在各文档中不一致，且不是固定内容
    const uniqueValues = [...new Set(lineValues.filter(v => v))];
    if (uniqueValues.length > 1 && !fixedSet.has(lineValues[0])) {
      candidates.push({
        values: uniqueValues,
        context: `第 ${i + 1} 行附近`,
        isRequired: true
      });
    }
  }

  return candidates;
}

/**
 * 填充模板中的占位符
 */
function fillTemplate(template, fieldMap) {
  let result = template;
  for (const [key, value] of Object.entries(fieldMap)) {
    const regex = new RegExp(escapeRegExp(key), 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

/**
 * 转义正则特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 校验数据是否包含所有必填字段
 */
function validateData(data, fields) {
  const missing = [];
  fields.forEach(field => {
    if (field.required && (data[field.name] === undefined || data[field.name] === '')) {
      missing.push(field.name);
    }
  });
  return missing;
}

/**
 * 加载配置文件
 */
function loadConfig(path) {
  if (!fs.existsSync(path)) {
    throw new Error(`配置文件不存在：${path}`);
  }
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

/**
 * 生成文件名（带时间戳）
 */
function generateFileName(baseName, ext = 'docx') {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${baseName}_${timestamp}.${ext}`;
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

module.exports = {
  extractTextFromDocx,
  findRepeatingPatterns,
  findVariableSegments,
  fillTemplate,
  validateData,
  loadConfig,
  generateFileName,
  deepMerge,
  escapeRegExp
};
