let pyodideInstance: any = null;
let pyodideLoadPromise: Promise<any> | null = null;

const PYODIDE_VERSION = "v0.25.0";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;
const PYTHON_TIMEOUT_MS = 5000;

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

const createTimedPythonSource = (code: string, timeoutMs: number) => {
  const timeoutSeconds = timeoutMs / 1000;

  return `
import sys as __minicompiler_sys
import time as __minicompiler_time

__minicompiler_code = ${JSON.stringify(code)}
__minicompiler_deadline = __minicompiler_time.monotonic() + ${timeoutSeconds}
__minicompiler_previous_trace = __minicompiler_sys.gettrace()

def __minicompiler_trace(frame, event, arg):
    if __minicompiler_time.monotonic() > __minicompiler_deadline:
        raise TimeoutError("Python execution timed out after ${timeoutSeconds} seconds")
    return __minicompiler_trace

__minicompiler_globals = {
    "__name__": "__main__",
    "__file__": "main.py",
}

__minicompiler_sys.settrace(__minicompiler_trace)
try:
    exec(compile(__minicompiler_code, "main.py", "exec"), __minicompiler_globals)
finally:
    __minicompiler_sys.settrace(__minicompiler_previous_trace)
`;
};

const describePythonError = (error: any) => {
  const rawMessage = error?.message || String(error);

  if (/EOFError|EOF when reading a line/i.test(rawMessage)) {
    return '输入不足：程序还在等待 input()，但输入区没有更多内容。请在 Input 区补充输入后重试。';
  }

  if (/TimeoutError|timed out/i.test(rawMessage)) {
    return `Python 运行超时（超过 ${Math.round(PYTHON_TIMEOUT_MS / 1000)} 秒）。请检查是否存在死循环，或把任务拆小后再运行。`;
  }

  return rawMessage;
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
    await pyodideInstance.runPythonAsync(createTimedPythonSource(code, PYTHON_TIMEOUT_MS));
  } catch (error: any) {
    const friendlyMessage = describePythonError(error);
    onOutput(`Error: ${friendlyMessage}`);
    throw new Error('Python execution failed.');
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
