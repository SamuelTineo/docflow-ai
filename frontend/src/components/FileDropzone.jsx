import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function FileDropzone({ onFile, accept, label = 'Sube el documento a analizar' }) {
  const { t } = useLanguage()
  const [error, setError] = useState(null)

  const onDrop = useCallback(accepted => {
    setError(null)
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const onDropRejected = useCallback(rejected => {
    const code = rejected[0]?.errors[0]?.code
    if (code === 'file-invalid-type') setError(t('drop_err_type'))
    else if (code === 'file-too-large') setError(t('drop_err_size'))
    else setError(t('drop_err_generic'))
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border rounded-2xl p-10 text-center cursor-pointer transition-all group ${
          isDragActive
            ? 'border-blue-300 bg-gradient-to-br from-blue-500 to-violet-600 scale-[1.01]'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-transparent bg-gradient-to-br from-blue-600 to-violet-600 hover:opacity-90'
        }`}
      >
        <input {...getInputProps()} />

        {/* Icon tile */}
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${
          isDragActive
            ? 'bg-white shadow-lg scale-110'
            : error
            ? 'bg-white'
            : 'bg-white group-hover:shadow-md group-hover:scale-105'
        }`}>
          <UploadCloud
            size={30}
            strokeWidth={2}
            className={error ? 'text-red-400' : isDragActive ? 'text-blue-500' : 'text-violet-600'}
          />
        </div>

        <p className="font-semibold text-white text-base mb-1">
          {isDragActive ? 'Suelta el archivo aquí' : label}
        </p>
        <p className="text-sm text-white/70 mb-4">PDF, DOCX, PPTX, PNG, JPG — máx. 50 MB</p>

      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">!</span>
          {error}
        </p>
      )}
    </div>
  )
}
