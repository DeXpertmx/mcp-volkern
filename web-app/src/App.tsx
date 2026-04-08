import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

// Tipos
interface InvoiceData {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  cif: string;
  direccion: string;
  consumoMensual: string;
  potenciaContratada: string;
  gastoAnual: string;
}

interface FormData extends InvoiceData {
  mensaje: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [_extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    cif: '',
    direccion: '',
    consumoMensual: '',
    potenciaContratada: '',
    gastoAnual: '',
    mensaje: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manejar subida de archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
    }
  };

  // Extraer datos de la factura
  const handleExtractData = async () => {
    if (!invoiceFile) return;

    setLoading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', invoiceFile);

      const response = await axios.post(`${API_URL}/api/extract-invoice`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;
      setExtractedData(data);
      setFormData(prev => ({
        ...prev,
        nombre: data.nombre || prev.nombre,
        email: data.email || prev.email,
        telefono: data.telefono || prev.telefono,
        empresa: data.empresa || prev.empresa,
        cif: data.cif || prev.cif,
        direccion: data.direccion || prev.direccion,
        consumoMensual: data.consumoMensual || prev.consumoMensual,
        potenciaContratada: data.potenciaContratada || prev.potenciaContratada,
        gastoAnual: data.gastoAnual || prev.gastoAnual
      }));
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al extraer los datos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/api/submit-lead`, {
        ...formData,
        invoiceFile: invoiceFile?.name
      });

      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar formulario
  const handleReset = () => {
    setStep('upload');
    setInvoiceFile(null);
    setExtractedData(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      cif: '',
      direccion: '',
      consumoMensual: '',
      potenciaContratada: '',
      gastoAnual: '',
      mensaje: ''
    });
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dimension Energy</h1>
        <p style={styles.subtitle}>Expertos en ahorro energético para empresas</p>
      </div>

      <div style={styles.card}>
        {step === 'upload' && (
          <>
            <h2 style={styles.stepTitle}>Sube tu factura de luz</h2>
            <p style={styles.stepDescription}>
              Extraeremos automáticamente los datos de tu factura para analizar tu consumo y ofrecerte la mejor propuesta de ahorro.
            </p>

            <div style={styles.uploadArea}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={styles.uploadLabel}>
                <svg style={styles.uploadIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{invoiceFile ? invoiceFile.name : 'Arrastra tu factura o haz clic para seleccionar'}</span>
              </label>
            </div>

            {invoiceFile && (
              <button
                onClick={handleExtractData}
                disabled={loading}
                style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
              >
                {loading ? 'Extrayendo datos...' : 'Extraer datos de la factura'}
              </button>
            )}

            {error && <p style={styles.error}>{error}</p>}
          </>
        )}

        {step === 'review' && (
          <>
            <h2 style={styles.stepTitle}>Revisa los datos extraídos</h2>
            <p style={styles.stepDescription}>
              Verifica que los datos sean correctos. Puedes editar cualquier campo antes de enviar.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre completo *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Empresa *</label>
                  <input
                    type="text"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>CIF/NIF *</label>
                  <input
                    type="text"
                    name="cif"
                    value={formData.cif}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Dirección *</label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Consumo mensual (kWh)</label>
                  <input
                    type="text"
                    name="consumoMensual"
                    value={formData.consumoMensual}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Potencia contratada (kW)</label>
                  <input
                    type="text"
                    name="potenciaContratada"
                    value={formData.potenciaContratada}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Gasto anual estimado (€)</label>
                  <input
                    type="text"
                    name="gastoAnual"
                    value={formData.gastoAnual}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mensaje adicional (opcional)</label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleInputChange}
                  rows={4}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  style={styles.buttonSecondary}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
                >
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>

            {error && <p style={styles.error}>{error}</p>}
          </>
        )}

        {step === 'success' && (
          <div style={styles.successContainer}>
            <svg style={styles.successIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 style={styles.successTitle}>¡Solicitud enviada con éxito!</h2>
            <p style={styles.successText}>
              Hemos recibido tu solicitud. Nuestro equipo de desarrollo de propuestas analizará tu caso y te enviaremos una propuesta personalizada en menos de 24 horas.
            </p>
            <button onClick={handleReset} style={styles.button}>
              Nueva consulta
            </button>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>© 2024 Dimension Energy. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

// Estilos
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    color: 'white'
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '300',
    opacity: 0.9
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '700px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  stepTitle: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333'
  },
  stepDescription: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: 1.6
  },
  uploadArea: {
    border: '2px dashed #667eea',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: '#f8f9ff'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#667eea'
  },
  uploadIcon: {
    width: '48px',
    height: '48px',
    marginBottom: '15px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroupFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '8px'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    transition: 'border-color 0.3s',
    outline: 'none'
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '10px'
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    minWidth: '160px'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  buttonSecondary: {
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center'
  },
  successContainer: {
    textAlign: 'center',
    padding: '20px'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    color: '#27ae60',
    marginBottom: '20px'
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px'
  },
  successText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '30px'
  },
  footer: {
    marginTop: '40px',
    color: 'white',
    fontSize: '14px',
    opacity: 0.8
  }
};

export default App;
