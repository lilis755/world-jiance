const APP_NAME = '全球态势分析';
const APP_TAGLINE = '融合情报、实时信号与决策级简报的一体化系统。';

export function renderLanding(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="landing-shell">
      <header class="landing-header">
        <div class="landing-brand">
          <div class="landing-logo">GSA</div>
          <div class="landing-title">
            <div class="landing-name">${APP_NAME}</div>
            <div class="landing-tagline">${APP_TAGLINE}</div>
          </div>
        </div>
        <div class="landing-actions">
          <a class="landing-btn ghost" href="?page=conflicts-live&layers=conflicts,bases,military,ais,iranAttacks,hotspots,sanctions">进入冲突监控</a>
          <a class="landing-btn" href="?page=infrastructure-risk&layers=cables,pipelines,datacenters,outages,minerals,fires,waterways">进入设施风险</a>
        </div>
      </header>

      <section class="landing-hero">
        <div class="landing-hero-copy">
          <div class="landing-kicker">全球态势情报系统</div>
          <h1>把复杂的全球信息，拆成可执行的任务视图。</h1>
          <p>
            从一个“全堆在一起”的大屏，切换为多个聚焦任务的视图。每个视图只保留
            该任务最关键的面板、信号与预警。
          </p>
          <div class="landing-cta">
            <a class="landing-btn" href="?page=conflicts-live&layers=conflicts,bases,military,ais,iranAttacks,hotspots,sanctions">冲突与升级</a>
            <a class="landing-btn ghost" href="?page=infrastructure-risk&layers=cables,pipelines,datacenters,outages,minerals,fires,waterways">关键设施风险</a>
          </div>
          <div class="landing-logos">
            <span class="landing-logo-chip">开源情报</span>
            <span class="landing-logo-chip">地理情报</span>
            <span class="landing-logo-chip">信号情报</span>
            <span class="landing-logo-chip">风险预警</span>
            <span class="landing-logo-chip">态势简报</span>
          </div>
        </div>
        <div class="landing-hero-card">
          <div class="hero-card-title">系统能力</div>
          <ul>
            <li>多源情报融合（新闻、信号、事件）</li>
            <li>地图态势 + 时间过滤 + 空间关系</li>
            <li>风险评分与升级检测</li>
            <li>AI 自动生成态势简报与焦点</li>
          </ul>
          <div class="landing-standards">
            <div>符合分析框架：多源交叉验证、趋势与异常检测、空间关联。</div>
            <div class="landing-standards-meta">系统定位：情报态势分析 | 决策辅助 | 风险预警</div>
          </div>
        </div>
      </section>

      <section class="landing-views">
        <h2>任务视图</h2>
        <div class="landing-grid">
          <a class="landing-card" href="?page=conflicts-live&layers=conflicts,bases,military,ais,iranAttacks,hotspots,sanctions">
            <div class="card-title">地区冲突实时监控台</div>
            <div class="card-desc">冲突态势、军机军舰、告警与态势简报。</div>
          </a>
          <a class="landing-card" href="?page=infrastructure-risk&layers=cables,pipelines,datacenters,outages,minerals,fires,waterways">
            <div class="card-title">关键基础设施风险监控</div>
            <div class="card-desc">电缆/管道/数据中心/火点与中断信号。</div>
          </a>
          <a class="landing-card" href="?page=stability-report&layers=conflicts,protests,outages,displacement,climate,hotspots">
            <div class="card-title">国家稳定性评估报告</div>
            <div class="card-desc">不稳定指数、新闻聚合与预测市场。</div>
          </a>
          <a class="landing-card" href="?page=intent-warning&layers=military,flights,ais,bases,gpsJamming,hotspots,conflicts">
            <div class="card-title">对手意图推断与预警</div>
            <div class="card-desc">军事实体态势、异常检测与研判入口。</div>
          </a>
          <a class="landing-card" href="?page=simulation&layers=conflicts,hotspots,climate,displacement,tradeRoutes,waterways">
            <div class="card-title">战略推演与情景模拟</div>
            <div class="card-desc">态势快照、历史冲突与推演入口。</div>
          </a>
          <a class="landing-card" href="?page=opinion-war&layers=protests,conflicts,hotspots,climate">
            <div class="card-title">民情与舆论战监测</div>
            <div class="card-desc">抗议动荡、新闻可信度与舆情信号。</div>
          </a>
        </div>
      </section>

      <section class="landing-footer">
        <div>基于多源OSINT、地理空间情报与AI推理引擎。</div>
        <div class="landing-meta">版本 ${__APP_VERSION__}</div>
      </section>
    </div>
  `;
}
