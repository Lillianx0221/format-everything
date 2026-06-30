/**
 * 全都格式化 Skill - 主入口
 * 负责协调模板学习、文档生成和模板更新三大工作流
 */

const { analyzeTemplate } = require('./analyze-template');
const { generateDocument } = require('./generate-doc');
const { loadConfig, validateData } = require('./utils');

class AllFormatSkill {
  constructor(options = {}) {
    this.config = {
      outputFormat: options.outputFormat || 'docx',
      strictMode: options.strictMode !== false,
      preserveStyles: options.preserveStyles !== false,
      fieldMarkers: options.fieldMarkers || { open: '{{', close: '}}' },
      maxBatchSize: options.maxBatchSize || 100
    };
    this.templateConfig = null;
  }

  /**
   * 工作流 1：学习模板
   * @param {Array<{name, content}>} sampleDocs - 样本文档列表
   * @param {string} guideText - 编制指引文本（可选）
   * @returns {Object} 模板配置对象
   */
  async learnTemplate(sampleDocs, guideText = '') {
    console.log('[AllFormat] 开始分析模板结构...');
    this.templateConfig = await analyzeTemplate(sampleDocs, {
      guideText,
      fieldMarkers: this.config.fieldMarkers
    });
    console.log(`[AllFormat] 模板学习完成，识别到 ${this.templateConfig.fields.length} 个动态字段`);
    return this.templateConfig;
  }

  /**
   * 工作流 2：生成文档
   * @param {Object|Array} data - 原始数据（单条或批量）
   * @param {Object} templateConfig - 模板配置（如未提前学习则必填）
   * @returns {Array<Buffer>} 生成的文档 Buffer 列表
   */
  async generate(data, templateConfig = null) {
    const config = templateConfig || this.templateConfig;
    if (!config) {
      throw new Error('未找到模板配置，请先执行 learnTemplate 或传入 templateConfig');
    }

    const dataList = Array.isArray(data) ? data : [data];
    if (dataList.length > this.config.maxBatchSize) {
      throw new Error(`批量数据超出限制（最大 ${this.config.maxBatchSize} 条）`);
    }

    console.log(`[AllFormat] 开始生成 ${dataList.length} 份文档...`);
    const results = [];

    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      if (this.config.strictMode) {
        const missing = validateData(item, config.fields);
        if (missing.length > 0) {
          throw new Error(`数据项 #${i + 1} 缺少必填字段：${missing.join(', ')}`);
        }
      }
      const docBuffer = await generateDocument(item, config, this.config);
      results.push(docBuffer);
    }

    console.log('[AllFormat] 文档生成完成');
    return results;
  }

  /**
   * 工作流 3：更新模板
   * @param {Object} updates - 更新内容
   */
  async updateTemplate(updates) {
    if (!this.templateConfig) {
      throw new Error('请先执行 learnTemplate 加载模板');
    }
    this.templateConfig = { ...this.templateConfig, ...updates };
    console.log('[AllFormat] 模板已更新');
    return this.templateConfig;
  }

  /**
   * 保存模板配置到文件
   */
  saveTemplateConfig(path) {
    const fs = require('fs');
    fs.writeFileSync(path, JSON.stringify(this.templateConfig, null, 2), 'utf-8');
    console.log(`[AllFormat] 模板配置已保存至 ${path}`);
  }

  /**
   * 从文件加载模板配置
   */
  loadTemplateConfig(path) {
    const fs = require('fs');
    this.templateConfig = JSON.parse(fs.readFileSync(path, 'utf-8'));
    console.log(`[AllFormat] 模板配置已从 ${path} 加载`);
    return this.templateConfig;
  }
}

module.exports = { AllFormatSkill };
