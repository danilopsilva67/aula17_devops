require('dotenv').config();

const { trace } = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { Resource } = require('@opentelemetry/resources');

const rawEndpoint = (
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  process.env.ELASTIC_OTLP_ENDPOINT ||
  'http://187.41.104.18:8200'
).trim().replace(/[\[\]]/g, '');

const url = rawEndpoint.endsWith('/v1/traces')
  ? rawEndpoint
  : `${rawEndpoint.replace(/\/+$/, '')}/v1/traces`;

const sdk = new NodeSDK({
  resource: Resource.default().merge(
    new Resource({
      'service.name': 'github-testeaula17',
      'service.version': '1.0.0',
      'deployment.environment': 'production',
    })
  ),
  traceExporter: new OTLPTraceExporter({ url }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});
//start
sdk.start();

const tracer = trace.getTracer('manual-boot-check');
const bootSpan = tracer.startSpan('boot-check-aula17');
bootSpan.end();

async function shutdownGracefully(signal) {
  console.log(`Recebido ${signal}, finalizando OpenTelemetry...`);
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry finalizado com sucesso.');
  } catch (err) {
    console.error('Falha ao finalizar OpenTelemetry:', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdownGracefully('SIGINT'));
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
