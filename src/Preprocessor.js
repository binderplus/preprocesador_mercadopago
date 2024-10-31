export function process(file) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./PreprocessorWorker.js', import.meta.url), {type: 'module'});

        console.log(file)
        worker.postMessage(file)

        worker.onmessage = event => {
            downloadFile(event.data)
            resolve(event.data);
        }

        worker.onerror = event => {
            console.log(event)
            reject(event.message);
        }
    })
}

function downloadFile(file) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link)
}