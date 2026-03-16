import { IntelligenceServiceClient } from '@/generated/client/worldmonitor/intelligence/v1/service_client';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const client = new IntelligenceServiceClient('', { fetch: (...args) => globalThis.fetch(...args) });

const MAX_CONTEXT_CHARS = 3500;
const MAX_HISTORY_MESSAGES = 6;

type ScenarioId =
  | 'home'
  | 'conflicts-live'
  | 'infrastructure-risk'
  | 'stability-report'
  | 'intent-warning'
  | 'simulation'
  | 'opinion-war';

interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface BriefDocumentState {
  title: string;
  markdown: string;
  html: string;
  generatedAt: number;
}

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  home: '首页',
  'conflicts-live': '冲突监控',
  'infrastructure-risk': '设施风险',
  'stability-report': '稳定评估',
  'intent-warning': '意图预警',
  simulation: '战略推演',
  'opinion-war': '舆论监测',
};

const SCENARIO_BRIEF_META: Record<ScenarioId, { title: string; hint: string; prompt: string }> = {
  home: {
    title: '全局态势总览简报',
    hint: '面向总览场景，汇总当前页面最值得关注的风险、信号变化与优先观察方向。',
    prompt: '请基于当前页面全部可见信息，生成一份“全球态势总览简报”。输出必须使用中文，采用适合直接交付或展示的简报格式，包含：1. 核心结论；2. 当前最值得关注的5个风险点；3. 关键地图/事件/新闻信号；4. 未来24-72小时观察重点；5. 建议分析员下一步重点跟踪的对象。语言要简洁、判断明确、结构清晰，不要写空泛套话。',
  },
  'conflicts-live': {
    title: '冲突监控简报',
    hint: '围绕冲突升级、军事活动、相关新闻和预警信号输出简报。',
    prompt: '请基于当前“冲突监控”页面的全部可见信息，生成一份“地区冲突态势简报”。输出必须使用中文，并适合直接向上级或客户汇报。重点围绕：1. 当前最活跃的冲突地区；2. 军机/军舰/基地活动是否出现异常；3. 新闻、抗议、军事活动是否出现信号收敛；4. 潜在升级区域与原因；5. 未来48小时最值得关注的3件事。要求结论明确、信息密集、避免空话。',
  },
  'infrastructure-risk': {
    title: '关键设施风险简报',
    hint: '围绕电缆、油气、数据中心、火点与中断信号形成设施风险判断。',
    prompt: '请基于当前“设施风险”页面的全部可见信息，生成一份“关键基础设施风险简报”。输出必须使用中文，并以可交付简报形式书写。重点包括：1. 当前高风险设施或区域；2. 海底电缆、油气管道、数据中心、矿产或港口相关风险信号；3. 互联网中断、火点、异常活动之间是否存在关联；4. 需要重点核查的设施清单；5. 建议立即跟踪的威胁迹象。表达要求简洁直接，适合展示。',
  },
  'stability-report': {
    title: '稳定性评估简报',
    hint: '围绕国家不稳定性、新闻、抗议、经济与网络中断信号生成评估简报。',
    prompt: '请基于当前“稳定评估”页面的全部可见信息，生成一份“国家/地区稳定性评估简报”。输出必须使用中文，并采用正式简报格式。重点包括：1. 当前不稳定性最高的国家或地区；2. 驱动评分上升的主要因素；3. 新闻、抗议、冲突、互联网中断、经济压力之间的关系；4. 哪些国家处于由低风险向中高风险转变的阶段；5. 后续跟踪建议。要求结构化、直观、可用于对外展示。',
  },
  'intent-warning': {
    title: '意图预警简报',
    hint: '围绕对手部署、军事活动、异常时序和支持/反对证据形成预警简报。',
    prompt: '请基于当前“意图预警”页面的全部可见信息，生成一份“对手意图与预警简报”。输出必须使用中文，适合直接汇报。请重点写：1. 当前最可能的行动意图；2. 支持该判断的证据；3. 反对或削弱该判断的证据；4. 哪些军事或舆情信号显示意图正在强化；5. 未来24-72小时的预警点。请用分析员口吻写，避免泛泛而谈。',
  },
  simulation: {
    title: '战略推演简报',
    hint: '围绕情景演化、关键分叉点和可能后果输出推演型简报。',
    prompt: '请基于当前“战略推演”页面的全部可见信息，生成一份“战略情景推演简报”。输出必须使用中文，并适合用于方案讨论或演示。重点包括：1. 当前基线态势；2. 最可能的3条演化路径；3. 哪些关键节点会导致情景分叉；4. 每条路径的主要触发条件与风险后果；5. 分析员应优先验证的变量。输出要像专业推演简报，而不是普通聊天回答。',
  },
  'opinion-war': {
    title: '舆论战监测简报',
    hint: '围绕舆情、叙事扩散、媒体偏向和情绪变化输出信息战简报。',
    prompt: '请基于当前“舆论监测”页面的全部可见信息，生成一份“民情与舆论战监测简报”。输出必须使用中文，并适合直接展示或交付。重点写：1. 当前最突出的舆论议题或信息战叙事；2. 情绪和民意变化是否集中于特定地区；3. 哪些来源或传播链最值得警惕；4. 哪些叙事更可能是真实民意，哪些更像协调操控；5. 后续需要持续跟踪的传播节点。要求直观、结构清晰、结论明确。',
  },
};

function getScenarioId(): ScenarioId {
  const page = new URLSearchParams(window.location.search).get('page') || 'conflicts-live';
  const normalized = (page === 'home' ? 'home' : page) as ScenarioId;
  return SCENARIO_LABELS[normalized] ? normalized : 'conflicts-live';
}

function collectActiveLayers(): string[] {
  const toggles = Array.from(document.querySelectorAll('.layer-toggle')) as HTMLElement[];
  return toggles
    .filter((toggle) => toggle.querySelector('input[type="checkbox"]:checked'))
    .map((toggle) => toggle.querySelector('.layer-label')?.textContent?.trim())
    .filter((label): label is string => Boolean(label));
}

function collectPanelContext(): string {
  const panels = Array.from(document.querySelectorAll('.panel')) as HTMLElement[];
  const parts: string[] = [];

  for (const panel of panels) {
    const panelId = panel.dataset.panel;
    if (!panelId || panelId === 'map') continue;
    if (panel.closest('.group-view-overlay')) continue;
    const title = panel.querySelector('.panel-title')?.textContent?.trim() || panelId;
    const text = panel.querySelector('.panel-content')?.textContent?.trim();
    if (!text) continue;
    const clipped = text.replace(/\s+/g, ' ').slice(0, 900);
    parts.push(`【${title}】${clipped}`);
  }

  const joined = parts.join('\n\n');
  return joined.slice(0, MAX_CONTEXT_CHARS);
}

export class AiChatDrawer {
  private panel: HTMLElement;
  private history: HTMLElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private briefBtn: HTMLButtonElement;
  private briefPopover: HTMLElement | null = null;
  private briefModal: HTMLElement | null = null;
  private briefDocument: BriefDocumentState | null = null;
  private inFlight = false;
  private messages: AiChatMessage[] = [];
  private boundRunQuery: ((e: Event) => void) | null = null;
  private boundDocumentClick: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.panel = document.createElement('div');
    this.panel.className = 'ai-chat-panel';
    this.panel.innerHTML = `
      <div class="ai-chat-header">
        <span class="ai-chat-title">AI态势助手</span>
      </div>
      <div class="ai-chat-history"></div>
      <form class="ai-chat-input-row">
        <button class="ai-chat-brief" type="button" title="生成当前页面简报">生成简报</button>
        <textarea class="ai-chat-input" rows="3" placeholder="输入你要分析的问题..."></textarea>
        <button class="ai-chat-send" type="submit">发送</button>
      </form>
    `;

    this.history = this.panel.querySelector('.ai-chat-history') as HTMLElement;
    this.input = this.panel.querySelector('.ai-chat-input') as HTMLTextAreaElement;
    this.sendBtn = this.panel.querySelector('.ai-chat-send') as HTMLButtonElement;
    this.briefBtn = this.panel.querySelector('.ai-chat-brief') as HTMLButtonElement;

    const form = this.panel.querySelector('.ai-chat-input-row') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.handleSend();
    });
    this.briefBtn.addEventListener('click', () => {
      this.toggleBriefPopover();
    });

    this.boundRunQuery = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string; label?: string }>).detail;
      if (!detail?.query) return;
      void this.handleSend(detail.query, detail.label);
    };
    document.addEventListener('wm:run-ai-query', this.boundRunQuery);
    this.boundDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.ai-chat-brief')) return;
      if (target.closest('.ai-brief-popover')) return;
      if (target.closest('.ai-brief-modal')) return;
      this.hideBriefPopover();
    };
    document.addEventListener('click', this.boundDocumentClick);

    this.renderMessages();
  }

  public mount(container: HTMLElement): void {
    if (!container.isConnected) return;
    if (this.panel.parentElement === container) return;
    container.replaceChildren(this.panel);
  }

  public destroy(): void {
    this.panel.remove();
    this.briefModal?.remove();
    if (this.boundRunQuery) {
      document.removeEventListener('wm:run-ai-query', this.boundRunQuery);
      this.boundRunQuery = null;
    }
    if (this.boundDocumentClick) {
      document.removeEventListener('click', this.boundDocumentClick);
      this.boundDocumentClick = null;
    }
  }

  private renderMessages(): void {
    if (this.messages.length === 0) {
      this.history.innerHTML = '<div class="ai-chat-empty">输入问题开始分析。</div>';
      return;
    }
    this.history.innerHTML = this.messages
      .map((m) => `
        <div class="ai-chat-msg ${m.role}">
          <div class="ai-chat-msg-role">${m.role === 'user' ? '你' : 'AI'}</div>
          <div class="ai-chat-msg-body">${m.role === 'assistant' ? m.content : this.escapeHtml(m.content)}</div>
        </div>
      `)
      .join('');
    this.history.scrollTop = this.history.scrollHeight;
  }

  private toggleBriefPopover(): void {
    if (this.briefPopover) {
      this.hideBriefPopover();
      return;
    }

    const scenarioId = getScenarioId();
    const meta = SCENARIO_BRIEF_META[scenarioId];
    const popover = document.createElement('div');
    popover.className = 'ai-brief-popover';
    popover.innerHTML = `
      <div class="ai-brief-popover-title">${this.escapeHtml(meta.title)}</div>
      <div class="ai-brief-popover-body">${this.escapeHtml(meta.hint)}</div>
      <div class="ai-brief-popover-actions">
        <button class="ai-brief-popover-btn" type="button" data-action="close">关闭</button>
        <button class="ai-brief-popover-btn primary" type="button" data-action="run">开始生成</button>
      </div>
    `;

    popover.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest<HTMLButtonElement>('.ai-brief-popover-btn');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'close') {
        this.hideBriefPopover();
        return;
      }
      if (action === 'run') {
        this.hideBriefPopover();
        void this.handleGenerateBrief(scenarioId, meta);
      }
    });

    this.panel.querySelector('.ai-chat-input-row')?.appendChild(popover);
    this.briefPopover = popover;
  }

  private hideBriefPopover(): void {
    this.briefPopover?.remove();
    this.briefPopover = null;
  }

  private async handleGenerateBrief(
    scenarioId: ScenarioId,
    meta: { title: string; prompt: string },
  ): Promise<void> {
    if (this.inFlight) return;

    this.inFlight = true;
    this.sendBtn.disabled = true;
    this.briefBtn.disabled = true;

    this.openBriefModal(meta.title);
    this.setBriefModalLoading(meta.title, '正在生成简报...');

    try {
      const geoContext = this.buildContextString();
      const query = this.buildScenarioBriefPrompt(scenarioId, meta.prompt);
      const resp = await client.deductSituation({ query, geoContext });
      const markdown = resp.analysis?.trim() || '';
      if (!markdown) {
        this.setBriefModalError(meta.title, '未生成到可用简报内容。');
        return;
      }

      const html = await marked.parse(markdown);
      const safe = DOMPurify.sanitize(html);
      this.briefDocument = {
        title: meta.title,
        markdown,
        html: safe,
        generatedAt: Date.now(),
      };
      this.renderBriefModalDocument(this.briefDocument);
    } catch (err) {
      console.error('[AiBrief] Error:', err);
      this.setBriefModalError(meta.title, '生成简报时发生错误。');
    } finally {
      this.inFlight = false;
      this.sendBtn.disabled = false;
      this.briefBtn.disabled = false;
    }
  }

  private buildScenarioBriefPrompt(scenarioId: ScenarioId, basePrompt: string): string {
    const reportHeader = [
      `当前场景：${SCENARIO_LABELS[scenarioId]}`,
      '请输出为正式中文简报，不要解释你如何生成，不要写“以下是简报”。',
      '请严格使用以下政治/情报报告版式：',
      '# 标题',
      '## 一、执行摘要',
      '## 二、核心态势判断',
      '## 三、关键信号与证据',
      '## 四、风险评估',
      '## 五、未来24-72小时观察重点',
      '## 六、行动建议',
      '要求：每节都必须有内容；表达简洁、判断明确、像正式汇报材料；不要出现聊天语气；尽量把信息写成可直接展示或交付的简报。',
    ].join('\n');
    return `${reportHeader}\n\n${basePrompt}`;
  }

  private openBriefModal(title: string): void {
    if (!this.briefModal) {
      const modal = document.createElement('div');
      modal.className = 'ai-brief-modal';
      modal.innerHTML = `
        <div class="ai-brief-modal-backdrop"></div>
        <div class="ai-brief-modal-dialog">
          <div class="ai-brief-modal-header">
            <div>
              <div class="ai-brief-modal-title"></div>
              <div class="ai-brief-modal-meta"></div>
            </div>
            <button class="ai-brief-modal-close" type="button">关闭</button>
          </div>
          <div class="ai-brief-modal-toolbar">
            <button class="ai-brief-modal-btn" type="button" data-action="copy">复制</button>
            <button class="ai-brief-modal-btn" type="button" data-action="markdown">导出Markdown</button>
            <button class="ai-brief-modal-btn primary" type="button" data-action="word">导出Word</button>
          </div>
          <div class="ai-brief-modal-content"></div>
        </div>
      `;
      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.classList.contains('ai-brief-modal-backdrop') || target.closest('.ai-brief-modal-close')) {
          this.hideBriefModal();
          return;
        }
        const actionBtn = target.closest<HTMLElement>('.ai-brief-modal-btn');
        const action = actionBtn?.dataset.action;
        if (!action || !this.briefDocument) return;
        if (action === 'copy') {
          void navigator.clipboard.writeText(this.briefDocument.markdown).catch(() => {});
          return;
        }
        if (action === 'markdown') {
          this.downloadFile(`${this.briefDocument.title}.md`, 'text/markdown;charset=utf-8', this.briefDocument.markdown);
          return;
        }
        if (action === 'word') {
          const docHtml = this.wrapWordDocument(this.briefDocument.title, this.briefDocument.html, this.briefDocument.generatedAt);
          this.downloadFile(`${this.briefDocument.title}.doc`, 'application/msword;charset=utf-8', docHtml);
        }
      });
      document.body.appendChild(modal);
      this.briefModal = modal;
    }

    const titleEl = this.briefModal.querySelector('.ai-brief-modal-title');
    const metaEl = this.briefModal.querySelector('.ai-brief-modal-meta');
    if (titleEl) titleEl.textContent = title;
    if (metaEl) metaEl.textContent = '';
    this.briefModal.classList.add('visible');
  }

  private hideBriefModal(): void {
    this.briefModal?.classList.remove('visible');
  }

  private setBriefModalLoading(title: string, message: string): void {
    this.openBriefModal(title);
    const metaEl = this.briefModal?.querySelector('.ai-brief-modal-meta');
    const contentEl = this.briefModal?.querySelector('.ai-brief-modal-content');
    if (metaEl) metaEl.textContent = '生成中';
    if (contentEl) contentEl.innerHTML = `<div class="ai-brief-modal-empty">${this.escapeHtml(message)}</div>`;
  }

  private setBriefModalError(title: string, message: string): void {
    this.openBriefModal(title);
    const metaEl = this.briefModal?.querySelector('.ai-brief-modal-meta');
    const contentEl = this.briefModal?.querySelector('.ai-brief-modal-content');
    if (metaEl) metaEl.textContent = '生成失败';
    if (contentEl) contentEl.innerHTML = `<div class="ai-brief-modal-empty">${this.escapeHtml(message)}</div>`;
  }

  private renderBriefModalDocument(doc: BriefDocumentState): void {
    this.openBriefModal(doc.title);
    const metaEl = this.briefModal?.querySelector('.ai-brief-modal-meta');
    const contentEl = this.briefModal?.querySelector('.ai-brief-modal-content');
    if (metaEl) metaEl.textContent = `生成时间：${new Date(doc.generatedAt).toLocaleString('zh-CN')}`;
    if (contentEl) {
      contentEl.innerHTML = `
        <article class="ai-brief-report">
          <header class="ai-brief-report-header">
            <div class="ai-brief-report-kicker">全球态势分析系统</div>
            <h1>${this.escapeHtml(doc.title)}</h1>
            <div class="ai-brief-report-stamp">内部简报 · ${new Date(doc.generatedAt).toLocaleString('zh-CN')}</div>
          </header>
          <div class="ai-brief-report-body">${doc.html}</div>
        </article>
      `;
    }
  }

  private wrapWordDocument(title: string, bodyHtml: string, generatedAt: number): string {
    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${this.escapeHtml(title)}</title>
          <style>
            body { font-family: "SimSun", serif; padding: 32px; color: #111; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 22px; border-bottom: 1px solid #999; padding-bottom: 4px; }
            p, li { font-size: 14px; line-height: 1.7; }
            .stamp { color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="stamp">全球态势分析系统 | ${new Date(generatedAt).toLocaleString('zh-CN')}</div>
          <h1>${this.escapeHtml(title)}</h1>
          ${bodyHtml}
        </body>
      </html>
    `.trim();
  }

  private downloadFile(filename: string, mimeType: string, content: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private async handleSend(explicitQuery?: string, label?: string): Promise<void> {
    if (this.inFlight) return;
    const query = (explicitQuery ?? this.input.value).trim();
    if (!query) return;

    if (!explicitQuery) this.input.value = '';
    this.inFlight = true;
    this.sendBtn.disabled = true;
    this.briefBtn.disabled = true;

    const userContent = label ? `${label}：${query}` : query;
    const userMsg: AiChatMessage = { role: 'user', content: userContent, ts: Date.now() };
    this.messages.push(userMsg);
    this.renderMessages();

    const placeholder: AiChatMessage = { role: 'assistant', content: '<span class="ai-chat-typing">分析中...</span>', ts: Date.now() };
    this.messages.push(placeholder);
    this.renderMessages();

    try {
      const geoContext = this.buildContextString();
      const resp = await client.deductSituation({ query, geoContext });
      const analysis = resp.analysis ? await marked.parse(resp.analysis) : '';
      const safe = analysis ? DOMPurify.sanitize(analysis) : this.escapeHtml('暂无可用分析结果。');
      placeholder.content = safe;
    } catch (err) {
      console.error('[AiChat] Error:', err);
      placeholder.content = this.escapeHtml('分析过程中发生错误。');
    } finally {
      this.inFlight = false;
      this.sendBtn.disabled = false;
      this.briefBtn.disabled = false;
      this.renderMessages();
    }
  }

  private buildContextString(): string {
    const scenarioId = getScenarioId();
    const scenarioLabel = SCENARIO_LABELS[scenarioId] || '当前页面';
    const layers = collectActiveLayers();
    const panelContext = collectPanelContext();
    const history = this.messages
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(m => !(m.role === 'assistant' && m.content.includes('分析中...')));

    const parts: string[] = [];
    parts.push(`当前页面：${scenarioLabel}`);
    parts.push(`启用图层：${layers.join('、') || '暂无'}`);
    if (panelContext) parts.push(`面板摘要：\n${panelContext}`);
    if (history.length > 0) {
      parts.push('对话历史：');
      for (const m of history) {
        parts.push(`${m.role === 'user' ? 'User' : 'AI'}: ${this.stripHtml(m.content)}`);
      }
    }
    return parts.join('\n');
  }

  private stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private escapeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
}
