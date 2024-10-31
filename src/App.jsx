import {useState} from 'react'
import './App.css'
import {FileHandler} from "./FileHandler.jsx";

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <h1>
                Preprocesador de reportes de <br/>
                conciliación de MercadoPago
            </h1>

            <FileHandler />

        </>
    )
}

export default App
