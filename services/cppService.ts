interface CompileResponse {
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: string | null;
    output?: string;
  };
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number;
    signal?: string | null;
    output?: string;
  };
  message?: string;
  error?: string;
}


export const initCpp = async (): Promise<void> => {
  return Promise.resolve();
};

export const runCppCode = async (
  code: string,
  stdin: string,
  onOutput: (text: string) => void
): Promise<void> => {
  onOutput(`[System] Sending code to backend for compilation and execution...\n`);

  try {
    const response = await fetch('/api/compile/cpp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
      }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      onOutput(`\n[Error] API Request failed: ${response.status} ${response.statusText}\n${errorText}`);
      return;
    }

    const result: CompileResponse = await response.json();

    if (result.message) {
      onOutput(`\n[Error] ${result.message}\n`);
      return;
    }

    if (result.compile && result.compile.stderr) {
      onOutput(`[Compile Error]\n${result.compile.stderr}\n`);
    }

    if (result.run) {
      if (result.run.stdout) {
        onOutput(result.run.stdout);
      }
      if (result.run.stderr) {
        onOutput(`\n[Runtime Error]\n${result.run.stderr}\n`);
      }
      if (typeof result.run.code === 'number' && result.run.code !== 0) {
        onOutput(`\n[System] Process exited with code ${result.run.code}\n`);
      }
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    onOutput(`\n[Error] ${msg}`);
  }
};
