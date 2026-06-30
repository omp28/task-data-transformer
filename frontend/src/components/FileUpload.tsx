import { useState } from 'react';

interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
}

export function FileUpload({ label, accept, onChange }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || '');
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      {fileName && (
        <p className="text-xs text-gray-500">Selected: {fileName}</p>
      )}
    </div>
  );
}
