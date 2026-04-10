# Cost Model

## Tiers
- Prototype (1k-5k users): low fixed costs, API-aware controls
- Early Traction (10k-50k users): optimize caching and request routing
- Growth (100k+ users): consider partial self-hosting and async processing

## Cost Drivers
- Inference/API usage for AI-heavy products
- Compute and egress for high-throughput workloads
- Observability and data storage as traffic scales

## Guardrails
- Define target cost-per-active-user
- Trigger budget alert when trend exceeds 20% forecast
- Review provider contract and fallback options quarterly
