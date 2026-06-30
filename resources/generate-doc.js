/**
 * 文档生成引擎
 * 基于模板配置和原始数据，生成格式化的 Word 文档
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const { fillTemplate } = require('./utils');

/**
 * 生成单份文档
 * @param {Object} data - 原始数据
 * @param {Object} templateConfig - 模板配置
 * @param {Object} globalConfig - 全局配置
 * @returns {Buffer} Word 文档 Buffer
 */
async function generateDocument(data, templateConfig, globalConfig) {
  const { structure, fields, fixedPatterns } = templateConfig;

  // 1. 构建字段映射表
  const fieldMap = buildFieldMap(data, fields);

  // 2. 将模板结构转换为 docx 元素
  const children = [];

  for (const section of structure) {
    // 章节标题
    children.push(
      new Paragraph({
        text: fillTemplate(section.title, fieldMap),
        heading: mapHeadingLevel(section.level),
        spacing: { before: 400, after: 200 }
      })
    );

    // 查找该章节下的固定内容段落
    const sectionContent = findSectionContent(section, fixedPatterns, fieldMap);
    sectionContent.forEach(paragraph => {
      children.push(paragraph);
    });
  }

  // 3. 组装 Word 文档
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children
    }]
  });

  return await Packer.toBuffer(doc);
}

/**
 * 构建字段映射表（字段名 -> 值）
 */
function buildFieldMap(data, fields) {
  const map = {};
  fields.forEach(field => {
    const value = data[field.name];
    map[field.name] = value !== undefined ? value : `[${field.name}]`;
    // 同时注册占位符格式
    map[`${field.markers.open}${field.name}${field.markers.close}`] = map[field.name];
  });
  return map;
}

/**
 * 查找章节对应的正文内容
 */
function findSectionContent(section, fixedPatterns, fieldMap) {
  const paragraphs = [];

  fixedPatterns.forEach(pattern => {
    const filled = fillTemplate(pattern, fieldMap);
    const lines = filled.split('\n').filter(l => l.trim());

    lines.forEach(line => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })], // 12pt
          spacing: { after: 120, line: 360 },
          alignment: AlignmentType.JUSTIFIED
        })
      );
    });
  });

  return paragraphs;
}

/**
 * 映射标题层级
 */
function mapHeadingLevel(level) {
  const map = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4
  };
  return map[level] || HeadingLevel.HEADING_4;
}

/**
 * 批量生成文档并保存
 * @param {Array} dataList - 数据列表
 * @param {string} outputDir - 输出目录
 */
async function batchGenerate(dataList, templateConfig, globalConfig, outputDir) {
  const fs = require('fs');
  const path = require('path');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];
  for (let i = 0; i < dataList.length; i++) {
    const buffer = await generateDocument(dataList[i], templateConfig, globalConfig);
    const fileName = `${dataList[i].fileName || `report_${i + 1}`}.docx`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, buffer);
    results.push(filePath);
  }

  return results;
}

module.exports = { generateDocument, batchGenerate, buildFieldMap };
