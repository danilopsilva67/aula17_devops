// instrumentation.js
require('dotenv').config();

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_NAMESPACE } = require('@opentelemetry/semantic-conventions');

const rawEndpoint =
  process.env.ELASTIC_OTLP_ENDPOINT ||
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  'http://187.41.104.18:8200';

const otlpEndpoint = rawEndpoint.endsWith('/v1/traces')
  ? rawEndpoint
  : `${rawEndpoint.replace(/\/+$/, '')}/v1/traces`;

const rawHeaders = process.env.ELASTIC_OTLP_HEADERS || '';
const normalizedAuth = rawHeaders.startsWith('Authorization=')
  ? rawHeaders.slice('Authorization='.length).trim()
  : rawHeaders.trim();

const traceExporter = new OTLPTraceExporter({
  url: otlpEndpoint,
  headers: normalizedAuth ? { Authorization: normalizedAuth } : {},
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'windows-local-node-demo',
    [ATTR_SERVICE_NAMESPACE]: process.env.OTEL_SERVICE_NAMESPACE || 'observabilidade-local',
    'host.os.family': 'windows',
    'deployment.environment.name': process.env.OTEL_ENV || 'local-windows',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

function shutdown(signal) {
  sdk
    .shutdown()
    .then(() => console.log(`[OTel] Finalizado (${signal}) com sucesso.`))
    .catch((err) => console.error('[OTel] Erro ao finalizar:', err))
    .finally(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));