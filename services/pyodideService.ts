let pyodideInstance: any = null;
let pyodideLoadPromise: Promise<any> | null = null;

const PYODIDE_VERSION = "v0.25.0";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

export const initPyodide = async (): Promise<void> => {
  if (pyodideInstance) return;

  if (!pyodideLoadPromise) {
    pyodideLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
      script.onload = async () => {
        try {
          // @ts-ignore
          const loadedPyodide = await window.loadPyodide({
            indexURL: PYODIDE_INDEX_URL,
          });
          pyodideInstance = loadedPyodide;
          resolve(loadedPyodide);
        } catch (e) {
          reject(e);
        }
      };
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }

  await pyodideLoadPromise;
};

export const runPythonCode = async (code: string, stdin: string, onOutput: (text: string) => void): Promise<void> => {
  if (!pyodideInstance) {
    await initPyodide();
  }

  // Reset stdout redirection
  pyodideInstance.setStdout({ batched: (msg: string) => onOutput(msg + "\n") });
  pyodideInstance.setStderr({ batched: (msg: string) => onOutput(msg + "\n") });

  try {
    let inputIndex = 0;
    const inputStr = stdin || "";
    
    // Use Pyodide's native setStdin
    pyodideInstance.setStdin({
      stdin: () => {
        if (inputIndex < inputStr.length) {
          return inputStr.charCodeAt(inputIndex++);
        }
        return null;
      }
    });

    // Run user code
    await pyodideInstance.runPythonAsync(code);
  } catch (error: any) {
    onOutput(`Error: ${error.message}`);
  }
};
