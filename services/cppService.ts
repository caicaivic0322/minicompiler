
export const initCpp = async (): Promise<void> => {
  // No initialization needed for REST API
  console.log("[System] C++ Runtime: Using Piston API (Remote)");
  return Promise.resolve();
};

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  message?: string;
}

export const runCppCode = async (code: string, stdin: string, onOutput: (text: string) => void): Promise<void> => {
  onOutput("[System] Compiling and running via Piston API...\n");

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'cpp',
        version: '10.2.0', // GCC 10.2.0
        files: [
          {
            content: code
          }
        ],
        stdin: stdin
      }),
    });

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const result: PistonResponse = await response.json();

    if (result.message) {
      onOutput(`[Error] ${result.message}\n`);
      return;
    }

    if (result.run) {
      if (result.run.stdout) {
        onOutput(result.run.stdout);
      }
      if (result.run.stderr) {
        onOutput(`\n[Stderr]\n${result.run.stderr}`);
      }
      if (result.run.code !== 0) {
        onOutput(`\n[System] Process exited with code ${result.run.code}`);
      }
    }

  } catch (error: any) {
    onOutput(`[Error] Execution failed: ${error.message}\n`);
    console.error(error);
  }
};
