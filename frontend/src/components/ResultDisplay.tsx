interface ResultDisplayProps {
  result: any;
}

export function ResultDisplay({ result }: ResultDisplayProps) {
  if (!result) return null;

  return (
    <div className="mt-8 space-y-4">
      {!result.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{result.error}</p>
        </div>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium mb-2">Warnings</p>
          <ul className="text-sm space-y-1">
            {result.warnings.map((warning: string, i: number) => (
              <li key={i}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="font-medium">✓ Pipeline completed successfully</p>
        </div>
      )}

      {result.profile && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Canonical Profile</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Name:</span> {result.profile.fullName || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Emails:</span>{' '}
              {result.profile.emails?.join(', ') || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Phones:</span>{' '}
              {result.profile.phones?.join(', ') || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Years Experience:</span>{' '}
              {result.profile.yearsExperience || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Skills:</span>{' '}
              {result.profile.skills?.map((s: any) => s.name).join(', ') || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Confidence:</span>{' '}
              {(result.profile.overallConfidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {(result.profile || result.projected) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">JSON Output</h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-xs max-h-96">
            {JSON.stringify(result.projected || result.profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
