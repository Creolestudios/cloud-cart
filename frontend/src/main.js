// ============================================================
// CloudCart Dashboard — Main Application
// ============================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:80/api';

const app = document.getElementById('app');

// Service status data
const services = [
  {
    name: 'Auth Service',
    icon: '🔐',
    tech: 'Node.js / Express / JWT',
    port: 4001,
    status: 'healthy',
    metrics: { requests: '12.4K', latency: '23ms', uptime: '99.9%' },
  },
  {
    name: 'Product Service',
    icon: '📦',
    tech: 'Python / FastAPI / PostgreSQL',
    port: 4002,
    status: 'healthy',
    metrics: { requests: '8.7K', latency: '15ms', uptime: '99.8%' },
  },
  {
    name: 'Order Service',
    icon: '🛒',
    tech: 'Node.js / Express / MongoDB',
    port: 4003,
    status: 'healthy',
    metrics: { requests: '5.2K', latency: '31ms', uptime: '99.7%' },
  },
];

// Pipeline stages
const pipelineStages = [
  { icon: '📝', label: 'Commit' },
  { icon: '🔍', label: 'Lint' },
  { icon: '🧪', label: 'Test' },
  { icon: '🐳', label: 'Build' },
  { icon: '🔒', label: 'Scan' },
  { icon: '🚀', label: 'Deploy' },
  { icon: '📊', label: 'Monitor' },
];

// Architecture nodes
const archNodes = [
  { icon: '🌐', name: 'Client', tech: 'Browser' },
  { icon: '🔀', name: 'API Gateway', tech: 'Nginx' },
  { icon: '🔐', name: 'Auth', tech: 'Node.js' },
  { icon: '📦', name: 'Products', tech: 'FastAPI' },
  { icon: '🛒', name: 'Orders', tech: 'Node.js' },
  { icon: '🗄️', name: 'Databases', tech: 'PG + Mongo' },
  { icon: '📨', name: 'Queue', tech: 'RabbitMQ' },
  { icon: '📊', name: 'Monitoring', tech: 'Prometheus' },
];

function renderApp() {
  app.innerHTML = `
    <!-- Header -->
    <header class="header animate-in">
      <div class="header-logo">
        <div class="logo-icon">CC</div>
        <div>
          <h1>CloudCart</h1>
          <span class="version">v1.0.0</span>
        </div>
      </div>
      <div class="header-status">
        <span class="pulse"></span>
        All Systems Operational
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card animate-in animate-delay-1">
        <div class="stat-icon">🐳</div>
        <div class="stat-value">7</div>
        <div class="stat-label">Containers Running</div>
        <div class="stat-change positive">↑ All healthy</div>
      </div>
      <div class="stat-card animate-in animate-delay-2">
        <div class="stat-icon">📊</div>
        <div class="stat-value">26.3K</div>
        <div class="stat-label">Total Requests (24h)</div>
        <div class="stat-change positive">↑ 12% vs yesterday</div>
      </div>
      <div class="stat-card animate-in animate-delay-3">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">23ms</div>
        <div class="stat-label">Avg Response Time</div>
        <div class="stat-change positive">↓ 8% improvement</div>
      </div>
      <div class="stat-card animate-in animate-delay-4">
        <div class="stat-icon">✅</div>
        <div class="stat-value">99.9%</div>
        <div class="stat-label">Uptime (30 days)</div>
        <div class="stat-change positive">↑ SLA met</div>
      </div>
    </div>

    <!-- Services -->
    <h2 class="section-title animate-in animate-delay-2">🔧 Microservices Status</h2>
    <div class="services-grid">
      ${services.map((svc, i) => `
        <div class="service-card animate-in animate-delay-${i + 2}" id="service-${svc.port}">
          <div class="service-header">
            <div class="service-name">${svc.icon} ${svc.name}</div>
            <span class="service-badge badge-${svc.status}">${svc.status}</span>
          </div>
          <div class="service-tech">${svc.tech} · Port ${svc.port}</div>
          <div class="service-metrics">
            <div class="service-metric">
              <div class="metric-value">${svc.metrics.requests}</div>
              <div class="metric-label">Requests</div>
            </div>
            <div class="service-metric">
              <div class="metric-value">${svc.metrics.latency}</div>
              <div class="metric-label">P95 Latency</div>
            </div>
            <div class="service-metric">
              <div class="metric-value">${svc.metrics.uptime}</div>
              <div class="metric-label">Uptime</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Architecture Flow -->
    <div class="architecture-section animate-in animate-delay-3">
      <h2 class="section-title">🏗️ Architecture Flow</h2>
      <div class="arch-flow">
        ${archNodes.map((node, i) => `
          ${i > 0 ? '<span class="arch-arrow">→</span>' : ''}
          <div class="arch-node">
            <div class="node-icon">${node.icon}</div>
            <div class="node-name">${node.name}</div>
            <div class="node-tech">${node.tech}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CI/CD Pipeline -->
    <div class="pipeline-section animate-in animate-delay-4">
      <h2 class="section-title">⚙️ CI/CD Pipeline</h2>
      <div class="pipeline-stages">
        ${pipelineStages.map((stage, i) => `
          ${i > 0 ? '<div class="stage-connector"></div>' : ''}
          <div class="pipeline-stage">
            <div class="stage-circle">${stage.icon}</div>
            <span class="stage-label">${stage.label}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      CloudCart · Cloud-Native Microservices Platform · 
      <a href="https://github.com/your-org/cloudcart" target="_blank">GitHub</a> · 
      Built with 🐳 Docker, ☸️ Kubernetes, ⚙️ Terraform
    </footer>
  `;

  // Check real health endpoints
  checkServiceHealth();
}

async function checkServiceHealth() {
  for (const svc of services) {
    try {
      const response = await fetch(`http://localhost:${svc.port}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const data = await response.json();
      updateServiceStatus(svc.port, 'healthy');
    } catch {
      updateServiceStatus(svc.port, 'warning');
    }
  }
}

function updateServiceStatus(port, status) {
  const card = document.getElementById(`service-${port}`);
  if (!card) return;
  
  const badge = card.querySelector('.service-badge');
  if (badge) {
    badge.className = `service-badge badge-${status}`;
    badge.textContent = status;
  }
}

// Initial render
renderApp();

// Auto-refresh health every 30 seconds
setInterval(checkServiceHealth, 30000);
