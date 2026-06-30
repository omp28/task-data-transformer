import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay } from './components/ResultDisplay';

function App() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile && !resumeFile) {
      alert('Please upload at least one file (CSV or Resume)');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (csvFile) formData.append('csv', csvFile);
      if (resumeFile) formData.append('resume', resumeFile);
      if (configFile) formData.append('config', configFile);

      const response = await fetch('http://localhost:3000/api/transform', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: `Request failed: ${error}`,
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCsvFile(null);
    setResumeFile(null);
    setConfigFile(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Candidate Data Transformer
              </h1>
              <p className="text-gray-600">
                Multi-source candidate profile builder with trust-aware evidence fusion
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FileUpload
                label="CSV File (Structured Data)"
                accept=".csv"
                onChange={setCsvFile}
              />

              <FileUpload
                label="Resume (PDF/DOCX)"
                accept=".pdf,.docx"
                onChange={setResumeFile}
              />

              <FileUpload
                label="Projection Config (Optional JSON)"
                accept=".json"
                onChange={setConfigFile}
              />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || (!csvFile && !resumeFile)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                    text-white font-semibold py-3 px-6 rounded-lg 
                    transition-colors duration-200"
                >
                  {loading ? 'Processing...' : 'Transform Data'}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg 
                    hover:bg-gray-50 transition-colors duration-200"
                >
                  Reset
                </button>
              </div>
            </form>

            <ResultDisplay result={result} />
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Supports CSV, PDF, and DOCX files. Configurable output projection with E.164 phone formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
