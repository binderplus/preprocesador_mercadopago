import {read, write, utils} from "xlsx";

onmessage = async function (event) {
    const inputFile = event.data
    const [inFileName, inFileExtension] = getNameAndExtension(inputFile);

    const wb = read(await inputFile.arrayBuffer(), {type: "array"})
    const sheet = wb.SheetNames[0];
    let data = utils.sheet_to_json(wb.Sheets[sheet]);

    data = processData(data)

    wb.Sheets[sheet] = utils.json_to_sheet(data);
    const outFile = new File(
        [write(wb, {bookType: inFileExtension, type: "array", FS: ";"})],
        `${inFileName}.procesado.${inFileExtension}`,
        {type: inputFile.type}
    )
    postMessage(outFile)
}

function getNameAndExtension(file) {
    const path = file.name

    const path_arr = path.split(".")
    const name = path_arr.slice(0, path_arr.length - 1).join(".")
    const extension = path_arr[path_arr.length - 1];

    return [name, extension]

}

function processData(data) {
    let outData = []

    for (let row of data) {
        const replacementRows = getReplacementRows(row)
        outData.push(...replacementRows)
    }

    console.log(outData)
    return outData
}

function getReplacementRows(row) {
    // Filtra saldo inicial, total, reserve for payout
    if (!('EXTERNAL_REFERENCE' in row)) return []

    let replacementRows = []

    const updatedRow = applyUpdateRules(row)
    replacementRows.push(updatedRow)

    const newRows = applyTransposeRules(row, updatedRow)
    replacementRows.push(...newRows)

    return replacementRows
}

function applyUpdateRules(row) {
    let updatedRow = structuredClone(row)
    deleteColumnsHandledByInsertRules(updatedRow)
    formatDate(updatedRow)
    translateDescription(updatedRow)

    return updatedRow
}

function deleteColumnsHandledByInsertRules(row) {
    for (const rule in transposeRules) {
        if (rule in row) {
            delete row[rule]
        }
    }
}

function formatDate(row) {
    if (!('DATE' in row)) return;
    row['DATE'] = row['DATE'].substring(0, row['DATE'].length - 10).replaceAll("T", " ")
}

function translateDescription(row) {
    const translations = {
        "payment": "Transferencia recibida",
        "payout": "Transferencia enviada"
    }

    for (const [key, value] of Object.entries(translations)) {
        row['DESCRIPTION'] = row['DESCRIPTION'].replaceAll(key, value)
    }

}

function applyTransposeRules(originalRow, updatedRow) {
    let newRows = []
    for (const [column, rule] of Object.entries(transposeRules)) {
        if (column in originalRow) {
            try {
                newRows.push(...rule(originalRow, updatedRow))
            } catch (e) {
                console.log("originalRow:", originalRow)
                console.log("updatedRow:", updatedRow)
                throw new Error(`Error on ${column}: ${e.message} \n originalRow: ${originalRow}, \n updatedRow: ${updatedRow}`, {cause: e})
            }
        }
    }

    return newRows
}

const transposeRules = {
    TAXES_DISAGGREGATED: (originalRow, updatedRow) => {
        let taxes
        try {
            taxes = JSON.parse(originalRow['TAXES_DISAGGREGATED'])
        } catch (e) {
            console.warn("Can't parse taxes: ", originalRow['TAXES_DISAGGREGATED'], e)
            return []
        }

        if (!Array.isArray(taxes) || !taxes.length) {
            return []
        }

        let rows = []
        for (const [i, tax] of taxes.entries()) {
            let newRow = structuredClone(updatedRow)

            newRow['SOURCE_ID'] += `_tax${i}`
            newRow['GROSS_AMOUNT'] = parseFloat(tax['amount'])
            newRow['DESCRIPTION'] = `Impuesto ${tax['financial_entity'].replaceAll("_", " ")} (${tax['detail'].replaceAll("_", " ")})`
            updatedRow['BALANCE_AMOUNT'] = parseFloat(updatedRow['BALANCE_AMOUNT']) - newRow['GROSS_AMOUNT']

            rows.push(newRow)
        }

        return rows
    },

    FEE_AMOUNT: (originalRow, updatedRow) => {
        let rows = []
        const fee = parseFloat(originalRow['FEE_AMOUNT'])

        if (fee !== 0) {
            let newRow = structuredClone(updatedRow)
            newRow['SOURCE_ID'] += "_fee"
            newRow['GROSS_AMOUNT'] = fee
            newRow['DESCRIPTION'] = "Comisión + IVA"
            updatedRow['BALANCE_AMOUNT'] = parseFloat(updatedRow['BALANCE_AMOUNT']) - newRow['GROSS_AMOUNT']

            rows.push(newRow)
        }

        return rows
    },
}

