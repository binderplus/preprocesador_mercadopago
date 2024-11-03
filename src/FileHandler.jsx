import {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {FaFileArrowUp, FaFileCircleCheck, FaFileCircleXmark, FaHourglassHalf} from "react-icons/fa6";
import {process} from "./Preprocessor.js";
import styles from './FileHandler.module.css'

export const FileHandler = () => {
    const [state, setState] = useState("initial")
    const [error, setError] = useState("")

    const onDropAccepted = useCallback(async acceptedFiles => {
        setState("processing")
        let result;
        try {
            result = await process(acceptedFiles[0])
        } catch (error) {
            setState("error")
            console.error(error)
            setError(error)
            return
        }
        setState("initial")
    }, [])

    const {getRootProps, getInputProps, isDragAccept, isDragReject} = useDropzone({
        multiple: false,
        onDropAccepted: onDropAccepted,
        disabled: state === "processing",
        accept: {
            "application/vnd.ms-excel": [".xlsx", ".xls", ".csv"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx", ".xls", ".csv"],
            "text/csv": [".csv"]
        }
    })

    let Icon;
    let message;
    let containerColor

    if (state === "initial") {
        Icon = FaFileArrowUp
        message = "Arrastre el reporte de todas las operaciones para obtener un reporte con un formato similar al de un extracto bancario tradicional."
        containerColor = "neutral"
    }

    if (state === "error") {
        Icon = FaHourglassHalf
        message = error
        containerColor = styles.red
    }

    if (state === "processing") {
        Icon = FaHourglassHalf
        message = "Procesando..."
        containerColor = styles.green
    }

    if (state !== "processing") {
        if (isDragAccept) {
            Icon = FaFileCircleCheck
            message = "Suelte aquí..."
            containerColor = styles.green
        } else if (isDragReject) {
            Icon = FaFileCircleXmark
            message = "Solo archivos .csv o .xlsx"
            containerColor = styles.red
        }
    }

    const containerClass = styles.container + " " + containerColor

    return (<div {...getRootProps({className: containerClass})}>
        <input {...getInputProps()} />
        <Icon/>
        <p>{message}</p>
    </div>)
}