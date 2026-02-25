interface CompileResponse {
  run?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  message?: string;
}

export const initCpp = async (): Promise<void> => {
  console.log("[System] C++ Runtime: Using Local Backend Proxy to Piston");
  return Promise.resolve();
};

export const runCppCode = async (code: string, stdin: string, onOutput: (text: string) => void): Promise<void> => {
  onOutput("[System] Compiling and running via Backend Proxy...\n");

  try {
    const response = await fetch('/api/compile/cpp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin
      }),
    });

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const result: CompileResponse = await response.json();

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
