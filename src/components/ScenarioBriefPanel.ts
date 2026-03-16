import { Panel } from './Panel';
import { h, replaceChildren } from '@/utils/dom-utils';

type ScenarioId =
  | 'home'
  | 'conflicts-live'
  | 'infrastructure-risk'
  | 'stability-report'
  | 'intent-warning'
  | 'simulation'
  | 'opinion-war';

const SCENARIO_CONFIG: Record<ScenarioId, { title: string; subtitle: string; bullets: string[]; prompt: string }> = {
  home: {
    title: '首页总览',
    subtitle: '聚合全局态势与关键风险提示，快速把握最重要变化。',
    bullets: [
      '全球态势总览与关键热点',
      '高风险区域快速提示',
      '主要情报流与简报入口',
      '关键指标与趋势概览',
      '快速跳转各场景分析',
    ],
    prompt: '请生成“首页总览”简报：快速概括当前最重要的态势、热点区域与风险提示。',
  },
  'conflicts-live': {
    title: '地区冲突实时监控台',
    subtitle: '聚合冲突区域、军事活动、抗议与新闻信号，快速识别风险升级。',
    bullets: [
      '冲突区域与军事基地分布',
      '军机/军舰实时位置与暗船提示',
      '多源信号收敛告警（新闻 + 军事 + 抗议）',
      '国家不稳定指数',
      '自动聚合冲突相关新闻',
    ],
    prompt: '请生成“地区冲突实时监控台”的最新简报：总结核心冲突、军事态势变化、信号收敛告警、短期风险判断，并给出3条最需要关注的事项。',
  },
  'infrastructure-risk': {
    title: '战略要地与关键基础设施风险监控',
    subtitle: '聚焦海底电缆、管道、数据中心与关键矿产，监测中断与异常信号。',
    bullets: [
      '海底电缆/油气管道/数据中心图层',
      '关键矿产与战略水道分布',
      '互联网中断与服务状态监测',
      '卫星火点与异常事件关联',
      '600km设施关联清单',
    ],
    prompt: '请生成“关键基础设施风险监控”的最新简报：概述异常事件、受影响设施、潜在连锁风险与下一步关注点。',
  },
  'stability-report': {
    title: '国家/地区稳定性评估报告',
    subtitle: '综合不稳定指数、新闻、冲突与预测市场信号，形成可分享评估。',
    bullets: [
      'CII国家不稳定指数',
      '自动聚合国内新闻与冲突',
      '预测市场信号（Polymarket）',
      '人口暴露与流离数据',
      '一键生成情报卡片',
    ],
    prompt: '请生成“稳定性评估报告”简报：给出CII现状、近期事件、趋势判断与风险等级结论。',
  },
  'intent-warning': {
    title: '对手意图推断与作战预警',
    subtitle: '结合军机军舰、基地激活、新闻威胁与异常节奏，评估意图概率。',
    bullets: [
      '军机/军舰活动与数量',
      '军事基地激活信号',
      '多源新闻威胁分类',
      '时序异常检测',
      '概率估计与预警触发',
    ],
    prompt: '请生成“对手意图推断与作战预警”简报：列出当前最可能意图、证据与反证，并给出概率估计。',
  },
  simulation: {
    title: '战略推演与情景模拟',
    subtitle: '在当前态势基础上推演可能路径，识别关键节点与分叉。',
    bullets: [
      '全球态势快照与关键指标',
      '历史冲突/事件库对照',
      '情景演进路径与分叉点',
      '红蓝对抗视角',
      '结构化情景分析输出',
    ],
    prompt: '请生成“战略推演与情景模拟”简报：给出3个可能演进路径、关键分叉点与风险提示。',
  },
  'opinion-war': {
    title: '民情与舆论战监测',
    subtitle: '追踪抗议与舆情传播路径，识别叙事扩散与情绪变化。',
    bullets: [
      '抗议/社会动荡追踪',
      '新闻可信度与偏向标注',
      '舆情与情绪趋势',
      '叙事扩散路径',
      'AI判断与风险提示',
    ],
    prompt: '请生成“民情与舆论战监测”简报：总结舆论主叙事、传播路径、情绪变化与潜在操控风险。',
  },
};

function getScenarioId(): ScenarioId {
  const page = new URLSearchParams(window.location.search).get('page') || 'conflicts-live';
  const normalized = (page === 'home' ? 'home' : page) as ScenarioId;
  return SCENARIO_CONFIG[normalized] ? normalized : 'conflicts-live';
}

function collectActiveLayers(): string[] {
  const toggles = Array.from(document.querySelectorAll('.layer-toggle')) as HTMLElement[];
  return toggles
    .filter((toggle) => toggle.querySelector('input[type="checkbox"]:checked'))
    .map((toggle) => toggle.querySelector('.layer-label')?.textContent?.trim())
    .filter((label): label is string => Boolean(label));
}

export class ScenarioBriefPanel extends Panel {
  constructor() {
    super({ id: 'scenario-brief', title: '场景简报', showCount: false, className: 'panel-wide span-2' });
    this.render();
    window.addEventListener('popstate', () => this.render());
  }

  protected render(): void {
    const scenarioId = getScenarioId();
    const scenario = SCENARIO_CONFIG[scenarioId];
    const layers = collectActiveLayers();

    replaceChildren(this.content,
      h('div', { className: 'scenario-brief-card' },
        h('div', { className: 'scenario-brief-title' }, scenario.title),
        h('div', { className: 'scenario-brief-subtitle' }, scenario.subtitle),
        h('ul', { className: 'scenario-brief-list' },
          ...scenario.bullets.map((item) => h('li', null, item)),
        ),
        h('div', { className: 'scenario-brief-layers' },
          h('span', { className: 'scenario-brief-label' }, '已启用图层'),
          layers.length === 0
            ? h('span', { className: 'scenario-brief-empty' }, '暂无启用图层')
            : h('div', { className: 'scenario-brief-tags' },
              ...layers.slice(0, 8).map((layer) => h('span', { className: 'scenario-brief-tag' }, layer)),
              layers.length > 8 ? h('span', { className: 'scenario-brief-more' }, `+${layers.length - 8}`) : false,
            ),
        ),
        h('button', {
          className: 'scenario-brief-btn',
          onClick: () => {
            document.dispatchEvent(new CustomEvent('wm:run-ai-query', {
              detail: {
                query: scenario.prompt,
                label: scenario.title,
              },
            }));
          },
        }, '生成场景简报'),
      ),
    );
  }
}
