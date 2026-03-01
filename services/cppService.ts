import { buildApiUrl } from '../constants';

export const initCpp = async (): Promise<void> => {
  // Piston API via Proxy is stateless and doesn't need initialization, but we keep this for interface compatibility
  return Promise.resolve();
};

export const runCppCode = async (
  code: string,
  stdin: string,
  onOutput: (text: string) => void
): Promise<void> => {
  onOutput(`[System] Sending code to backend for compilation and execution...\n`);

  try {
    const apiUrl = buildApiUrl('/api/compile/cpp');
    const response = await fetch(apiUrl, {
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

    const result = await response.json();

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

