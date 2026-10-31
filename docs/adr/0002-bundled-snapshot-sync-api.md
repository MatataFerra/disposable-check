# Built-in blocklist como snapshot empaquetado y API síncrona

La lista de upstream se copia dentro de cada versión publicada y nunca se descarga en runtime. Así la API del core es síncrona, funciona offline y da el mismo verdict en Node, edge y browser. El costo es que la lista solo se actualiza publicando una versión nueva (patch) y que los bundles de browser cargan unos 57 KB gzip. Pasar después a descargar la lista obligaría a una API async, que sería un cambio breaking para todos los usuarios.
