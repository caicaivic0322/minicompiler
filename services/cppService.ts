interface CompileResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

export const initCpp = async (): Promise<void> => {
  console.log("[System] C++ Runtime: Using Local Backend API");
  return Promise.resolve();
};

export const runCppCode = async (code: string, stdin: string, onOutput: (text: string) => void): Promise<void> => {
  onOutput("[System] Compiling and running via Local Backend...\n");

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

    if (result.stderr) {
      onOutput(`\n[Stderr]\n${result.stderr}`);
    }

    if (result.stdout) {
      onOutput(result.stdout);
    }

    if (result.code !== 0) {
      onOutput(`\n[System] Process exited with code ${result.code}`);
    }

  } catch (error: any) {
    onOutput(`[Error] Execution failed: ${error.message}\n`);
    console.error(error);
  }
};
