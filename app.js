// app.js
const express = require('express');
const { trace, SpanStatusCode } = require('@opentelemetry/api');

const app = express();
const port = process.env.PORT || 3000;
const tracer = trace.getTracer('windows-local-node-demo');

app.use(express.json());

function simularEtapa(nomeEtapa, ms) {
  return tracer.startActiveSpan(nomeEtapa, async (span) => {
    try {
      span.setAttribute('demo.delay_ms', ms);
      await new Promise((resolve) => setTimeout(resolve, ms));
      span.setStatus({ code: SpanStatusCode.OK });
    } finally {
      span.end();
    }
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ambiente: 'windows-local' });
});

app.get('/pedidos', async (req, res) => {
  try {
    await simularEtapa('validar-requisicao', 40);
    await simularEtapa('consultar-catalogo-simulado', 120);

    res.json({
      sucesso: true,
      pedidos: [
        { id: 101, item: 'Plano Observabilidade', status: 'confirmado' },
        { id: 102, item: 'Auditoria de Logs', status: 'em_analise' },
      ],
    });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get('/erro-teste', async (req, res) => {
  const span = trace.getActiveSpan();
  try {
    await simularEtapa('etapa-antes-da-falha', 50);
    throw new Error('Falha simulada no processamento local do Windows');
  } catch (err) {
    if (span) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    }
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});