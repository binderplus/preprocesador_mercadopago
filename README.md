# [Preprocesador de reportes de conciliación de Mercado Pago](https://premp.binderplus.com.ar/)

Este proyecto transforma el reporte de _todas las operaciones_ de Mercado Pago a uno más similar a los 
extractos bancarios tradicionales, con el propósito de permitir la importación en programas de conciliación no diseñados
específicamente para MP.

Actualmente está optimizado para el caso de uso de empresas que reciben y envían transferencias. 
Puede no tener toda la funcionalidad necesaria para empresas que venden por Mercado Libre.

Específicamente, toma las columnas `TAXES_DISAGGREGATED` y `FEE_AMOUNT` y las coloca en filas nuevas. 

Por ejemplo, transforma:

| SOURCE_ID   | TRANSACTION_TYPE | TRANSACTION_AMOUNT | FEE_AMOUNT | SETTLEMENT_NET_AMOUNT | TAXES_DISAGGREGATED                                                                                 |
|-------------|------------------|--------------------|------------|-----------------------|-----------------------------------------------------------------------------------------------------|
| 95932048395 | SETTLEMENT       | 100000             | -1000      | 9600                  | [{financial_entity":"debitos_creditos", "amount": "-3000", "detail": "tax_withholding_collector"}]" |

En:

| SOURCE_ID        | TRANSACTION_TYPE                                    | TRANSACTION_AMOUNT | FEE_AMOUNT | SETTLEMENT_NET_AMOUNT | TAXES_DISAGGREGATED                                                                                 |
|------------------|-----------------------------------------------------|--------------------|------------|-----------------------|-----------------------------------------------------------------------------------------------------|
| 95932048395      | SETTLEMENT                                          | 100000             | -1000      | 9600                  | [{financial_entity":"debitos_creditos", "amount": "-3000", "detail": "tax_withholding_collector"}]" |
| 95932048395_tax0 | Impuesto debitos_creditos tax_withholding_collector | -3000              | -1000      | 9600                  | [{financial_entity":"debitos_creditos", "amount": "-3000", "detail": "tax_withholding_collector"}]" |
| 95932048395_fee  | Comisión + IVA                                      | -1000              | -1000      | 9600                  | [{financial_entity":"debitos_creditos", "amount": "-3000", "detail": "tax_withholding_collector"}]" |

Para evitar problemas, se recomienda generar el reporte con todas las columnas y en inglés.