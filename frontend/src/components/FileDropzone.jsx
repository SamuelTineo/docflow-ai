import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function FileDropzone({ onFile, accept, label = 'Arrastrá un archivo o hacé click' }) {
  const onDrop = useCallback(accepted => { if (accepted[0]) onFile(accepted[0]) }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <div className="text-4xl mb-3">{isDragActive ? '📂' : '📁'}</div>
      <p className="text-gray-600 font-medium">{isDragActive ? 'Soltá el archivo aquí' : label}</p>
      <p className="text-sm text-gray-400 mt-1">PDF, DOCX, PNG, JPG — máx. 50 MB</p>
    </div>
  )
}
