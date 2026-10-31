# La rule más específica decide el verdict

Cuando varias rules coinciden con un dominio, decide la de dominio más largo, sin importar de qué lista venga. Si una allow y una block tienen exactamente el mismo dominio, gana la allow. Elegimos esto frente a "la allowlist siempre gana" porque permite tanto liberar `miempresa.dynv6.net` cuando upstream bloquea `dynv6.net`, como bloquear `evil.example.com` dentro de un `example.com` permitido. Cambiar esta regla después altera verdicts existentes, así que sería un cambio breaking.

## Considered Options

- **La allowlist siempre gana**: más simple, pero no deja bloquear un subdominio dentro de un dominio permitido.
- **La blocklist siempre gana**: deja la allowlist inútil contra falsos positivos del upstream, que no garantiza que sus dominios sigan siendo desechables.
