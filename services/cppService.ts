const DEFAULT_PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

const getPistonApiUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_PISTON_API_URL;
  const raw = typeof envUrl === 'string' ? envUrl.trim() : '';
  return raw || DEFAULT_PISTON_API_URL;
};


export const initCpp = async (): Promise<void> => {
  return Promise.resolve();
};

export const runCppCode = async (
  code: string,
  stdin: string,
  onOutput: (text: string) => void
): Promise<void> => {
  onOutput(`[System] Sending code to Piston for compilation and execution...\n`);

  try {
    const apiUrl = getPistonApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        language: 'cpp',
        version: '10.2.0',
        files: [{ name: 'main.cpp', content: code }],
        stdin: stdin,
      }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      onOutput(`\n[Error] API Request failed: ${response.status} ${response.statusText}\n${errorText}`);
      return;
    }

    const result = await response.json();

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
      if (result.run.code !== 0) {
        onOutput(`\n[System] Process exited with code ${result.run.code}\n`);
      }
    }
  } catch (err: any) {
    const msg = err?.message || String(err);
    onOutput(`\n[Error] ${msg}`);
  }
};
