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

  const stdoutDecoder = new TextDecoder();
  const stderrDecoder = new TextDecoder();
  const flushDecoder = (decoder: TextDecoder) => {
    const remaining = decoder.decode();
    if (remaining) onOutput(remaining);
  };

  // Use raw handlers so output without a trailing newline is not lost.
  pyodideInstance.setStdout({
    raw: (charCode: number) => {
      onOutput(stdoutDecoder.decode(new Uint8Array([charCode]), { stream: true }));
    }
  });
  pyodideInstance.setStderr({
    raw: (charCode: number) => {
      onOutput(stderrDecoder.decode(new Uint8Array([charCode]), { stream: true }));
    }
  });

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
  } finally {
    try {
      await pyodideInstance.runPythonAsync(`
import sys
sys.stdout.flush()
sys.stderr.flush()
`);
    } finally {
      flushDecoder(stdoutDecoder);
      flushDecoder(stderrDecoder);
    }
  }
};
