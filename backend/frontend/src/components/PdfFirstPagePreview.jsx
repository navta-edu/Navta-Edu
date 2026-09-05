import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export default function PdfFirstPagePreview({ pdfUrl }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (!pdfUrl) {
    return (
      <div style={styles.empty}>
        PDF preview is not available.
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      {loading && !error && (
        <div style={styles.loading}>
          Loading PDF preview...
        </div>
      )}

      {error && (
        <div style={styles.error}>
          Unable to load PDF preview.
        </div>
      )}

      <Document
        file={pdfUrl}
        loading=""
        error=""
        onLoadSuccess={() => {
          setLoading(false)
          setError(false)
        }}
        onLoadError={(err) => {
          console.error('PDF preview error:', err)
          setLoading(false)
          setError(true)
        }}
      >
        {!error && (
          <Page
            pageNumber={1}
            width={700}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        )}
      </Document>
    </div>
  )
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '720px',
    maxHeight: '750px',
    overflow: 'hidden',
    marginTop: '20px',
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative'
  },

  loading: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px'
  },

  error: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#ef4444',
    fontSize: '14px'
  },

  empty: {
    marginTop: '20px',
    padding: '30px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.5)',
    color: '#64748b',
    textAlign: 'center'
  }
}
