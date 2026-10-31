# Disposable Check

Librería que decide si un email o dominio pertenece a un servicio de correo desechable, usando una lista mantenida por la comunidad más reglas propias del usuario.

## Language

### Dominios y reglas

**Disposable domain**:
Dominio de un servicio que entrega direcciones de correo temporales sin registro (p. ej. mailinator.com, 10minutemail.com).
_Avoid_: temporary domain, throwaway domain, burner domain

**Canonical domain**:
La forma única de escribir un dominio: ASCII, minúsculas, IDN en punycode y sin punto final. Toda comparación se hace entre canonical domains.
_Avoid_: normalized domain, clean domain

**Rule**:
Una entrada de una lista; coincide con su propio dominio y con todos sus subdominios.
_Avoid_: entry, pattern, wildcard

**Matched rule**:
La rule más específica (la de dominio más largo) que coincide con un dominio; es la única que decide el verdict.
_Avoid_: match, hit

### Listas

**Upstream**:
El repositorio disposable-email-domains (CC0), única fuente del built-in blocklist.

**Built-in blocklist**:
Snapshot del upstream que viene incluido en cada versión publicada de la librería. Nunca se edita a mano.
_Avoid_: default list, upstream list

**Custom allowlist**:
Rules del usuario que marcan dominios como no desechables, aunque el built-in blocklist los incluya.
_Avoid_: whitelist, exceptions

**Custom blocklist**:
Rules del usuario que marcan dominios como desechables, además del built-in blocklist.
_Avoid_: blacklist, extra domains

### Evaluación

**Checker**:
Un conjunto fijo de rules (built-in blocklist más custom lists) contra el que se evalúan emails y dominios. No cambia después de creado.
_Avoid_: validator, detector, instance

**Verdict**:
El resultado de evaluar un email o dominio: `disposable` (la matched rule viene de una blocklist), `allowed` (viene de la custom allowlist), `not-listed` (ninguna rule coincide) o `invalid` (el input no se puede interpretar como email o dominio).
_Avoid_: status, result, valid
