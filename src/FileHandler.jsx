import {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {FaFileArrowUp, FaFileCircleCheck, FaFileCircleXmark, FaHourglassHalf, FaCircleXmark} from "react-icons/fa6";
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
            console.log(result)
            setState("initial")
        } catch (error) {
            console.error(error)
            setError(error)
            setState("error")
        }
    }, [])

    const {getRootProps, getInputProps, isDragAccept, isDragReject} = useDropzone({
        multiple: false,
        onDropAccepted: onDropAccepted,
        disabled: state === "processing",
        accept: {
            "application/vnd.ms-excel": [".xlsx", ".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx", ".xls"]
        }
    })

    let Icon;
    let message;
    let containerColor

    if (state === "initial") {
        Icon = FaFileArrowUp
        message = "Arrastre un archivo o haga click para cargar."
        containerColor = styles.neutral
    }

    if (state === "error") {
        Icon = FaCircleXmark
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
            message = "Solo archivos .xlsx"
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