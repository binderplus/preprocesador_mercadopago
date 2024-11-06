# [Preprocesador de reportes de conciliación de Mercado Pago](https://premp.binderplus.com.ar/)

Este proyecto transforma el reporte de liquidaciones de Mercado Pago a uno más similar a los 
extractos bancarios tradicionales, con el propósito de permitir la importación en programas de conciliación no diseñados
específicamente para MP (como, por ejemplo, Odoo).

Actualmente está optimizado para el caso de uso de empresas que reciben y envían transferencias. 
Puede no tener toda la funcionalidad necesaria para empresas que venden por Mercado Libre.

Específicamente, hace lo siguiente:
 - Elimina las filas de saldo inicial, total de movimientos, reserve for payout 
(y cualquier otra sin `EXTERNAL_REFERENCE`)
 - Cambia el formato de la columna `DATE` para eliminar el huso horario y 
las fracciones de segundo
 - Traduce algunos términos de la columna `DESCRIPTION`, 
 - Toma las columnas `TAXES_DISAGGREGATED` y `MP_FEE_AMOUNT` y las coloca en filas nuevas. 

Por ejemplo, transforma:

| DATE                          | SOURCE_ID   | EXTERNAL_REFERENCE     | RECORD_TYPE               | DESCRIPTION        | GROSS_AMOUNT | MP_FEE_AMOUNT | TAXES_DISAGGREGATED                                                                                 | BALANCE |
|-------------------------------|-------------|------------------------|---------------------------|--------------------|--------------|---------------|-----------------------------------------------------------------------------------------------------|---------|
| 2024-10-01T00:00:00.000-03:00 |             |                        | initial_available_balance |                    |              |               |                                                                                                     | 0       |
| 2024-10-01T00:00:00.000-03:00 | 95932048395 | 3670377883134          | release                   | payment            | 100000       | -1000         | [{financial_entity":"debitos_creditos", "amount": "-3000", "detail": "tax_withholding_collector"}]" | 96000   |
| 2024-10-01T13:00:00.000-03:00 | 89344433513 |                        | release                   | reserve_for_payout | -96000       |               | []                                                                                                  | 0       |
| 2024-10-01T13:00:01.000-03:00 | 89344433513 |                        | release                   | reserve_for_payout | 96000        |               | []                                                                                                  | 96000   |
| 2024-10-01T13:00:01.000-03:00 | 89344433513 | LEORZG90K0R84X0P9EGJ46 | release                   | payout             | -96000       |               | []                                                                                                  | 0       |
|                               |             |                        | total                     |                    | 4000         | -1000         |                                                                                                     | 0       |

En:

| DATE                | SOURCE_ID        | EXTERNAL_REFERENCE     | RECORD_TYPE               | DESCRIPTION                                           | GROSS_AMOUNT | BALANCE |
|---------------------|------------------|------------------------|---------------------------|-------------------------------------------------------|--------------|---------|
| 2024-10-01 00:00:00 | 95932048395      | 3670377883134          | release                   | Transferencia recibida                                | 100000       | 100000  |
| 2024-10-01 00:00:00 | 95932048395_tax0 | 3670377883134          | release                   | Impuesto debitos creditos (tax withholding collector) | -3000        | 97000   |
| 2024-10-01 00:00:00 | 95932048395_fee  | 3670377883134          | release                   | Comisión + IVA                                        | -1000        | 96000   |
| 2024-10-01 13:00:01 | 89344433513      | LEORZG90K0R84X0P9EGJ46 | release                   | Transferencia enviada                                 | -96000       | 0       |

Para evitar problemas, se recomienda generar el reporte con todas las columnas y en inglés.

## Desarrollo y extensión
Cualquier extensión a este proyecto debe hacerse en un fork. No se aceptan PRs o Issues. 

Recomendamos hacer deploy a GitHub Pages con la acción incluida (en `.github/workflows`) y apuntar un dominio
o subdominio a la misma. Si no se desea hacer esto último 
(es decir, se prefiere acceder desde usuario.github.io/repo/preprocesador_mp), hay que modificar `vite.config.js` 
siguiendo [esta documentacion](https://es.vitejs.dev/guide/static-deploy#github-pages).

Para agregar funcionalidad, se recomienda agregar funciones que modifiquen elementos de una fila 
a la lista `updateRules` y funciones que transformen columnas en nuevas filas al diccionario `transposeRules`.
Ambos están definidos en `PreprocessorWorker.js`.

Por ejemplo, para consolidar las columnas `DESCRIPTION`, `PAYER_NAME`, `PAYER_ID_TYPE` y `PAYER_ID_NUMBER`, 
se debería agregar el siguiente elemento a `updateRules`:

```js
// Reglas que modifican filas.
const updateRules = [
    [...],
    consolidateColumns
]

function consolidateColumns(row) {
    row['DESCRIPTION'] = `${row['DESCRIPTION']} ${row['PAYER_NAME']} ${row['PAYER_ID_TYPE']} ${row['PAYER_ID_NUMBER']}`
    delete row['PAYER_NAME']
    delete row['PAYER_ID_TYPE']
    delete row['PAYER_ID_NUMBER']
}
```

Y para agregar una regla que transforme la columna `FINANCING_FEE_AMOUNT` en filas, habría que agregar 
el siguiente elemento a `transposeRules`:

```js
// Reglas que transforman columnas en filas. El key es el nombre de la columna a transponer.
// originalRow: Fila antes de aplicarle updateRules
// updatedRow: Fila después de aplicarle updateRules
// Ambas son necesarias porque updateRules puede eliminar columnas necesarias para las nuevas filas.
const transposeRules = {
    [...],

    FINANCING_FEE_AMOUNT: (originalRow, updatedRow) => {
        let rows = []
        const fee = parseFloat(originalRow['FINANCING_FEE_AMOUNT'])

        if (fee !== 0) {
            let newRow = structuredClone(updatedRow)
            newRow['SOURCE_ID'] += "_financing_fee"
            newRow['GROSS_AMOUNT'] = fee
            newRow['DESCRIPTION'] = "Comisión por ofrecer cuotas sin interés"

            rows.push(newRow)
        }

        return rows
    },
}
```
