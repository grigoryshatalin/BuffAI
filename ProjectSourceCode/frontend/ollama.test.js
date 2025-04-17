const { Ollama } = require("@langchain/ollama");

async function run() {
    try {
        const ollama = new Ollama({
            model: "gemma3",
            baseUrl: "http://ollama:11434",
        });

        const response = await ollama.invoke("poop");

        console.log(response);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();