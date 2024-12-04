import './App.css'
import {FileHandler} from "./FileHandler.jsx";

function App() {

    return (
        <>
            <h1 className="title">
                Preprocesador de reportes de conciliación de MercadoPago
            </h1>

            <p className="read-the-docs">
                Cargue el reporte de liquidaciones para obtener un reporte con un formato similar al de un extracto
                bancario tradicional.

                Para un correcto funcionamiento, configure el reporte para que incluya todas las columnas y que los
                nombres de las columnas estén en inglés. <a href="https://github.com/binderplus/preprocesador_mercadopago/">Más información.</a>
            </p>

            <FileHandler/>

        </>
    )
}

export default App
