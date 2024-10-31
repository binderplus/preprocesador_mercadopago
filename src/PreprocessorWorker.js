import {read, write, utils} from "xlsx";

onmessage = async function (event) {
    const inputFile = event.data
    const [inFileName, inFileExtension] = getNameAndExtension(inputFile);

    const wb = read(await inputFile.bytes(), {type: "array"})
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

function processData(data) {
    let addedRows = 0
    let outData = structuredClone(data)
    for (let [i, row] of data.entries()) {
        const newRows = getNewRows(row)
        outData.splice(i + addedRows + 1, 0, ...newRows)
        addedRows += newRows.length
    }

    console.log(outData)
    return outData
}

function getNewRows(row) {
    let newRows = []

    for (const [column, rule] of Object.entries(rowRules)) {
        if (column in row) {
            newRows.push(...rule(row))
        }
    }

    return newRows
}

const rowRules = {
    TAXES_DISAGGREGATED: (row) => {
        let rows = []
        const taxes = JSON.parse(row['TAXES_DISAGGREGATED'])

        for (const [i, tax] of taxes.entries()) {
            const newRow = structuredClone(row)
            newRow['SOURCE_ID'] += `_tax${i}`
            newRow['TRANSACTION_AMOUNT'] = tax['amount']
            newRow['TRANSACTION_TYPE'] = `Impuesto ${tax['financial_entity']} ${tax['detail']}`

            rows.push(newRow)
        }

        return rows
    },

    FEE_AMOUNT: (row) => {
        let rows = []
        const fee = parseFloat(row['FEE_AMOUNT'])

        if (fee !== 0) {
            const newRow = structuredClone(row)
            newRow['SOURCE_ID'] += "_fee"
            newRow['TRANSACTION_AMOUNT'] = fee
            newRow['TRANSACTION_TYPE'] = "Comisión + IVA"

            rows.push(newRow)
        }

        return rows
    },
}

function getNameAndExtension(file) {
    const path = file.name

    const path_arr = path.split(".")
    const name = path_arr.slice(0, path_arr.length - 1).join(".")
    const extension = path_arr[path_arr.length - 1];

    return [name, extension]

}

