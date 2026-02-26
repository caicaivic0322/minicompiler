// JSCPP is loaded via <script> tag in index.html, exposed as window.JSCPP
declare const JSCPP: any;

let jscppReady = false;

export const initCpp = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof JSCPP !== 'undefined') {
      jscppReady = true;
      resolve();
      return;
    }
    // Poll briefly in case the script is still loading
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof JSCPP !== 'undefined') {
        clearInterval(interval);
        jscppReady = true;
        resolve();
      } else if (attempts > 20) {
        clearInterval(interval);
        reject(new Error('JSCPP load timeout'));
      }
    }, 200);
  });
};

export const runCppCode = async (
  code: string,
  stdin: string,
  onOutput: (text: string) => void
): Promise<void> => {
  if (!jscppReady) {
    try {
      await initCpp();
    } catch (e: any) {
      onOutput(`[Error] C++ runtime not ready: ${e.message}\n`);
      return;
    }
  }

  return new Promise<void>((resolve) => {
    try {
      const exitCode = JSCPP.run(code, stdin, {
        stdio: {
          write: (s: string) => {
            onOutput(s);
          },
        },
        unsigned_overflow: 'error',
        maxExecutionSteps: 10_000_000,
      });

      if (exitCode !== 0) {
        onOutput(`\n[System] Process exited with code ${exitCode}`);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      onOutput(`\n[Error] ${msg}`);
    }
    resolve();
  });
};
