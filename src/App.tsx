import { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Globe,
  Truck,
  Package,
  Upload,
  Eye,
  Copy,
  CheckCircle,
  Info,
  FileCheck,
  FileUp,
  Loader2,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { TipoDocumento, DettaglioLinea, DatiRiepilogo } from './types';
import {
  generateXML,
  getDefaultCausale,
  getDefaultNatura,
  getDefaultRiferimentoNormativo,
  downloadXML,
} from './utils/xmlGenerator';
import { extractTextFromPDF, parseInvoiceData, ParsedInvoiceData } from './utils/pdfParser';

// ==================== STEP 0: Caricamento PDF ====================
function StepUploadPDF({
  onPDFParsed,
  onSkip,
}: {
  onPDFParsed: (data: ParsedInvoiceData) => void;
  onSkip: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Per favore carica un file PDF');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const text = await extractTextFromPDF(file);
      const parsedData = parseInvoiceData(text);
      onPDFParsed(parsedData);
    } catch (err) {
      console.error('Errore nel parsing del PDF:', err);
      setError('Errore durante la lettura del PDF. Prova a inserimento manuale.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <FileUp className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Carica la fattura estera</h2>
        <p className="text-gray-600">Carica il PDF della fattura del fornitore estero per estrarre automaticamente i dati</p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-lg font-medium text-gray-700">Analisi del PDF in corso...</p>
            <p className="text-sm text-gray-500">Estrazione dei dati dalla fattura</p>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Trascina qui il PDF della fattura
            </p>
            <p className="text-sm text-gray-500 mb-4">oppure</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-all font-medium shadow-lg shadow-blue-200">
              <FileUp className="w-5 h-5" />
              Seleziona file PDF
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-4">Formati supportati: PDF</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">oppure</span>
        </div>
      </div>

      {/* Skip / Manual Entry */}
      <div className="text-center">
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
        >
          <Edit3 className="w-5 h-5" />
          Procedi con inserimento manuale
        </button>
        <p className="text-sm text-gray-500 mt-3">
          Se non hai il PDF o preferisci inserire i dati manualmente
        </p>
      </div>

      {/* Info */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Come funziona:</strong> L'app estrarrà automaticamente i dati dalla fattura (numero, data, fornitore, importi) e suggerirà il corretto tipo documento (TD17, TD18, TD19). Potrai sempre modificare i dati estratti prima di generare l'XML.
        </div>
      </div>
    </div>
  );
}

// ==================== STEP 1: Scelta Tipo Documento ====================
function StepTipoDocumento({
  selected,
  onSelect,
  suggestion,
}: {
  selected: TipoDocumento | null;
  onSelect: (tipo: TipoDocumento) => void;
  suggestion?: { type?: TipoDocumento; reason?: string };
}) {
  const options = [
    {
      id: 'TD17' as TipoDocumento,
      icon: Globe,
      title: 'TD17',
      subtitle: 'Servizi dall\'estero',
      description: 'Acquisto di servizi da fornitori UE o extra-UE. Si applica quando un soggetto italiano acquista servizi da un fornitore non residente.',
      examples: ['Consulenze informatiche', 'Servizi legali internazionali', 'Abbonamenti software SaaS', 'Royalties e licenze'],
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'TD18' as TipoDocumento,
      icon: Truck,
      title: 'TD18',
      subtitle: 'Beni intracomunitari',
      description: 'Acquisto di beni da fornitori di altri Stati membri UE. Si applica per cessioni intracomunitari di beni.',
      examples: ['Acquisto merci da fornitori UE', 'Beni strumentali da UE', 'Materie prime intracomunitarie', 'Componenti da fornitori UE'],
      color: 'from-green-500 to-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'TD19' as TipoDocumento,
      icon: Package,
      title: 'TD19',
      subtitle: 'Beni da non residenti',
      description: 'Acquisto di beni da soggetti non residenti ex art.17 comma 2 DPR 633/72. Si applica per beni acquistati da extra-UE.',
      examples: ['Beni da fornitori extra-UE', 'Importazioni di merci', 'Acquisti da Paesi terzi', 'Beni strumentali extra-UE'],
      color: 'from-purple-500 to-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Che tipo di operazione hai effettuato?</h2>
        <p className="text-gray-600">Seleziona il tipo di documento in base alla natura dell'operazione</p>
      </div>

      {/* Suggerimento dal PDF */}
      {suggestion?.type && suggestion?.reason && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-800">
            <strong>Suggerimento automatico:</strong> {suggestion.reason}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          const isSuggested = suggestion?.type === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg ${
                isSelected
                  ? `${option.borderColor} ${option.bgColor} shadow-lg scale-[1.02]`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              )}
              {isSuggested && !isSelected && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Suggerito
                  </span>
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="mb-2">
                <span className="text-lg font-bold text-gray-800">{option.title}</span>
                <span className="text-sm text-gray-500 ml-2">— {option.subtitle}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Esempi:</p>
                {option.examples.map((ex, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    {ex}
                  </p>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== STEP 2: Dati Trasmissione ====================
interface DatiTrasmissioneForm {
  idPaese: string;
  idCodice: string;
  progressivoInvio: string;
  formatoTrasmissione: string;
  codiceDestinatario: string;
  pecDestinatario: string;
}

function StepDatiTrasmissione({
  data,
  onChange,
}: {
  data: DatiTrasmissioneForm;
  onChange: (data: DatiTrasmissioneForm) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dati di Trasmissione</h2>
        <p className="text-gray-600">Inserisci i dati del soggetto che trasmette il file allo SdI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IdPaese *</label>
          <input
            type="text"
            value={data.idPaese}
            onChange={(e) => onChange({ ...data, idPaese: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="IT"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IdCodice (P.IVA o CF) *</label>
          <input
            type="text"
            value={data.idCodice}
            onChange={(e) => onChange({ ...data, idCodice: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="01234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Progressivo Invio *</label>
          <input
            type="text"
            value={data.progressivoInvio}
            onChange={(e) => onChange({ ...data, progressivoInvio: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="00001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato Trasmissione *</label>
          <select
            value={data.formatoTrasmissione}
            onChange={(e) => onChange({ ...data, formatoTrasmissione: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="FPR12">FPR12 (Ordinaria)</option>
            <option value="FPA12">FPA12 (Pubblica Amministrazione)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codice Destinatario *</label>
          <input
            type="text"
            value={data.codiceDestinatario}
            onChange={(e) => onChange({ ...data, codiceDestinatario: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0000000"
            maxLength={7}
          />
          <p className="text-xs text-gray-500 mt-1">Usa "0000000" se il destinatario è te stesso</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PEC Destinatario (opzionale)</label>
          <input
            type="email"
            value={data.pecDestinatario}
            onChange={(e) => onChange({ ...data, pecDestinatario: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="pec@esempio.it"
          />
        </div>
      </div>
    </div>
  );
}

// ==================== STEP 3: Dati Cedente (Fornitore Estero) ====================
interface CedenteForm {
  idPaese: string;
  idCodice: string;
  denominazione: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
}

function StepCedente({
  data,
  onChange,
  parsedData,
}: {
  data: CedenteForm;
  onChange: (data: CedenteForm) => void;
  parsedData?: ParsedInvoiceData | null;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dati del Fornitore Estero</h2>
        <p className="text-gray-600">Inserisci i dati del cedente/prestatore (soggetto estero)</p>
      </div>

      {/* Dati estratti dal PDF */}
      {parsedData && (parsedData.fornitoreNome || parsedData.fornitorePaese) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Dati estratti dal PDF</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
            {parsedData.fornitoreNome && <p><strong>Nome:</strong> {parsedData.fornitoreNome}</p>}
            {parsedData.fornitorePaese && <p><strong>Paese:</strong> {parsedData.fornitorePaese}</p>}
            {parsedData.fornitorePartitaIva && <p><strong>P.IVA:</strong> {parsedData.fornitorePartitaIva}</p>}
            {parsedData.fornitoreCitta && <p><strong>Città:</strong> {parsedData.fornitoreCitta}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paese del fornitore *</label>
          <input
            type="text"
            value={data.idPaese}
            onChange={(e) => onChange({ ...data, idPaese: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="DE"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA / ID Fiscale *</label>
          <input
            type="text"
            value={data.idCodice}
            onChange={(e) => onChange({ ...data, idCodice: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ID fiscale del fornitore estero"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Denominazione / Ragione Sociale *</label>
          <input
            type="text"
            value={data.denominazione}
            onChange={(e) => onChange({ ...data, denominazione: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome della società estera"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
          <input
            type="text"
            value={data.indirizzo}
            onChange={(e) => onChange({ ...data, indirizzo: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Via e numero civico"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
          <input
            type="text"
            value={data.cap}
            onChange={(e) => onChange({ ...data, cap: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="00000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comune *</label>
          <input
            type="text"
            value={data.comune}
            onChange={(e) => onChange({ ...data, comune: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Città del fornitore"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia (se applicabile)</label>
          <input
            type="text"
            value={data.provincia}
            onChange={(e) => onChange({ ...data, provincia: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="EE per estero"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nazione *</label>
          <input
            type="text"
            value={data.nazione}
            onChange={(e) => onChange({ ...data, nazione: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="DE"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
}

// ==================== STEP 4: Dati Cessionario (Italiano) ====================
interface CessionarioForm {
  idPaese: string;
  idCodice: string;
  codiceFiscale: string;
  denominazione: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
  regimeFiscale: string;
}

function StepCessionario({
  data,
  onChange,
}: {
  data: CessionarioForm;
  onChange: (data: CessionarioForm) => void;
}) {
  const regimiFiscali = [
    { value: 'RF01', label: 'RF01 - Ordinario' },
    { value: 'RF02', label: 'RF02 - Contribuenti minimi (fino al 2015)' },
    { value: 'RF04', label: 'RF04 - Agricoltura e attività connesse' },
    { value: 'RF05', label: 'RF05 - Vendita sali e tabacchi' },
    { value: 'RF06', label: 'RF06 - Commercio fiammiferi' },
    { value: 'RF07', label: 'RF07 - Editoria' },
    { value: 'RF08', label: 'RF08 - Gestione servizi telefonia pubblica' },
    { value: 'RF10', label: 'RF10 - Enti spettacoli' },
    { value: 'RF12', label: 'RF12 - Agenzie viaggi e turismo' },
    { value: 'RF13', label: 'RF13 - Agriturismo' },
    { value: 'RF14', label: 'RF14 - Vendite a domicilio' },
    { value: 'RF15', label: 'RF15 - Commercio ambulante' },
    { value: 'RF16', label: 'RF16 - IVA per cassa P.A.' },
    { value: 'RF17', label: 'RF17 - IVA per cassa (art.32-bis DL 83/2012)' },
    { value: 'RF19', label: 'RF19 - Regime forfettario (L.190/2014)' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dati del Cessionario (Tu)</h2>
        <p className="text-gray-600">Inserisci i dati del soggetto italiano che emette l'autofattura</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IdPaese *</label>
          <input
            type="text"
            value={data.idPaese}
            onChange={(e) => onChange({ ...data, idPaese: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="IT"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA *</label>
          <input
            type="text"
            value={data.idCodice}
            onChange={(e) => onChange({ ...data, idCodice: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="01234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale (opzionale)</label>
          <input
            type="text"
            value={data.codiceFiscale}
            onChange={(e) => onChange({ ...data, codiceFiscale: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="RSSMRA80A01H501Z"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Regime Fiscale *</label>
          <select
            value={data.regimeFiscale}
            onChange={(e) => onChange({ ...data, regimeFiscale: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {regimiFiscali.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Denominazione / Ragione Sociale *</label>
          <input
            type="text"
            value={data.denominazione}
            onChange={(e) => onChange({ ...data, denominazione: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="La tua ragione sociale"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
          <input
            type="text"
            value={data.indirizzo}
            onChange={(e) => onChange({ ...data, indirizzo: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Via e numero civico"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CAP *</label>
          <input
            type="text"
            value={data.cap}
            onChange={(e) => onChange({ ...data, cap: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="00100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comune *</label>
          <input
            type="text"
            value={data.comune}
            onChange={(e) => onChange({ ...data, comune: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Roma"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
          <input
            type="text"
            value={data.provincia}
            onChange={(e) => onChange({ ...data, provincia: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="RM"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nazione *</label>
          <input
            type="text"
            value={data.nazione}
            onChange={(e) => onChange({ ...data, nazione: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="IT"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
}

// ==================== STEP 5: Dati Fattura e Linee ====================
interface DatiGeneraliForm {
  divisa: string;
  data: string;
  numero: string;
  causale: string[];
  importoTotaleDocumento: string;
}

function StepDatiFattura({
  tipoDocumento,
  datiGenerali,
  onDatiGeneraliChange,
  linee,
  onLineeChange,
  riepilogo,
  onRiepilogoChange,
  parsedData,
}: {
  tipoDocumento: TipoDocumento;
  datiGenerali: DatiGeneraliForm;
  onDatiGeneraliChange: (data: DatiGeneraliForm) => void;
  linee: DettaglioLinea[];
  onLineeChange: (linee: DettaglioLinea[]) => void;
  riepilogo: DatiRiepilogo[];
  onRiepilogoChange: (riepilogo: DatiRiepilogo[]) => void;
  parsedData?: ParsedInvoiceData | null;
}) {
  const addLinea = () => {
    const newLinea: DettaglioLinea = {
      numeroLinea: linee.length + 1,
      descrizione: '',
      quantita: '1',
      unitaMisura: '',
      prezzoUnitario: '0',
      aliquotaIVA: '0',
      natura: getDefaultNatura(tipoDocumento),
      prezzoTotale: '0',
    };
    onLineeChange([...linee, newLinea]);
  };

  const updateLinea = (index: number, field: keyof DettaglioLinea, value: string) => {
    const updated = [...linee];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'prezzoUnitario' || field === 'quantita') {
      const qty = parseFloat(field === 'quantita' ? value : updated[index].quantita || '1');
      const price = parseFloat(field === 'prezzoUnitario' ? value : updated[index].prezzoUnitario);
      updated[index].prezzoTotale = (qty * price).toFixed(2);
    }
    onLineeChange(updated);
  };

  const removeLinea = (index: number) => {
    const updated = linee.filter((_, i) => i !== index).map((l, i) => ({ ...l, numeroLinea: i + 1 }));
    onLineeChange(updated);
  };

  const addRiepilogo = () => {
    const newRiepilogo: DatiRiepilogo = {
      aliquotaIVA: '0',
      imponibile: '0',
      imposta: '0',
      natura: getDefaultNatura(tipoDocumento),
      riferimentoNormativo: getDefaultRiferimentoNormativo(tipoDocumento),
    };
    onRiepilogoChange([...riepilogo, newRiepilogo]);
  };

  const updateRiepilogo = (index: number, field: keyof DatiRiepilogo, value: string) => {
    const updated = [...riepilogo];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'aliquotaIVA' || field === 'imponibile') {
      const aliquota = parseFloat(field === 'aliquotaIVA' ? value : updated[index].aliquotaIVA) / 100;
      const imponibile = parseFloat(field === 'imponibile' ? value : updated[index].imponibile);
      updated[index].imposta = (imponibile * aliquota).toFixed(2);
    }
    onRiepilogoChange(updated);
  };

  const removeRiepilogo = (index: number) => {
    onRiepilogoChange(riepilogo.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dati della Fattura Estera</h2>
        <p className="text-gray-600">Verifica e completa i dati estratti dalla fattura originale</p>
      </div>

      {/* Dati estratti dal PDF */}
      {parsedData && (parsedData.numeroFattura || parsedData.dataFattura || parsedData.totale) && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Dati estratti dal PDF (verifica e modifica se necessario)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700">
            {parsedData.numeroFattura && <p><strong>N° Fattura:</strong> {parsedData.numeroFattura}</p>}
            {parsedData.dataFattura && <p><strong>Data:</strong> {parsedData.dataFattura}</p>}
            {parsedData.totale && <p><strong>Totale:</strong> {parsedData.totale} {parsedData.valuta}</p>}
            {parsedData.valuta && <p><strong>Valuta:</strong> {parsedData.valuta}</p>}
          </div>
        </div>
      )}

      {/* Dati generali documento */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dati Documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Divisa *</label>
            <select
              value={datiGenerali.divisa}
              onChange={(e) => onDatiGeneraliChange({ ...datiGenerali, divisa: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fattura *</label>
            <input
              type="date"
              value={datiGenerali.data}
              onChange={(e) => onDatiGeneraliChange({ ...datiGenerali, data: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero Fattura *</label>
            <input
              type="text"
              value={datiGenerali.numero}
              onChange={(e) => onDatiGeneraliChange({ ...datiGenerali, numero: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="INV/2024/001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo Totale</label>
            <input
              type="number"
              step="0.01"
              value={datiGenerali.importoTotaleDocumento}
              onChange={(e) => onDatiGeneraliChange({ ...datiGenerali, importoTotaleDocumento: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Causale</label>
          <textarea
            value={datiGenerali.causale.join('\n')}
            onChange={(e) => onDatiGeneraliChange({ ...datiGenerali, causale: e.target.value.split('\n') })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Una riga per ogni causale (max 200 caratteri per riga)"
          />
        </div>
      </div>

      {/* Dettaglio Linee */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Dettaglio Linee</h3>
          <button
            onClick={addLinea}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Aggiungi Linea
          </button>
        </div>
        {linee.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nessuna linea inserita. Clicca "Aggiungi Linea" per iniziare.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {linee.map((linea, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Linea {linea.numeroLinea}</span>
                  <button
                    onClick={() => removeLinea(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Rimuovi
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione *</label>
                    <input
                      type="text"
                      value={linea.descrizione}
                      onChange={(e) => updateLinea(index, 'descrizione', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrizione del servizio/bene"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantità</label>
                    <input
                      type="number"
                      step="0.01"
                      value={linea.quantita}
                      onChange={(e) => updateLinea(index, 'quantita', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo Unitario *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={linea.prezzoUnitario}
                      onChange={(e) => updateLinea(index, 'prezzoUnitario', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prezzo Totale</label>
                    <input
                      type="text"
                      value={linea.prezzoTotale}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aliquota IVA (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={linea.aliquotaIVA}
                      onChange={(e) => updateLinea(index, 'aliquotaIVA', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Natura (se esente)</label>
                    <select
                      value={linea.natura || ''}
                      onChange={(e) => updateLinea(index, 'natura', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Nessuna</option>
                      <option value="N1">N1 - Escluse ex art.15</option>
                      <option value="N2">N2 - Non soggette</option>
                      <option value="N3">N3 - Non imponibili</option>
                      <option value="N4">N4 - Esenti</option>
                      <option value="N5">N5 - Regime del margine</option>
                      <option value="N6">N6 - Inverse charge</option>
                      <option value="N6.1">N6.1 - Inversione contabile - cessione di rottami</option>
                      <option value="N6.2">N6.2 - Inversione contabile - cessione oro</option>
                      <option value="N6.3">N6.3 - Subappalto edilizia</option>
                      <option value="N6.4">N6.4 - Operazioni settore edile</option>
                      <option value="N6.5">N6.5 - Cessioni beni elettronici</option>
                      <option value="N6.6">N6.6 - Cessioni cellulari e tablet</option>
                      <option value="N6.7">N6.7 - Operazioni settore energetico</option>
                      <option value="N6.8">N6.8 - Operazioni settore ambientale</option>
                      <option value="N6.9">N6.9 - Altri reverse charge</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dati Riepilogo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Dati Riepilogo IVA</h3>
          <button
            onClick={addRiepilogo}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + Aggiungi Riepilogo
          </button>
        </div>
        {riepilogo.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun riepilogo inserito. Clicca "Aggiungi Riepilogo" per iniziare.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {riepilogo.map((r, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Riepilogo {index + 1}</span>
                  <button
                    onClick={() => removeRiepilogo(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Rimuovi
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aliquota IVA (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={r.aliquotaIVA}
                      onChange={(e) => updateRiepilogo(index, 'aliquotaIVA', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Imponibile *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={r.imponibile}
                      onChange={(e) => updateRiepilogo(index, 'imponibile', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Imposta</label>
                    <input
                      type="text"
                      value={r.imposta}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Natura (se esente)</label>
                    <select
                      value={r.natura || ''}
                      onChange={(e) => updateRiepilogo(index, 'natura', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Nessuna</option>
                      <option value="N1">N1 - Escluse ex art.15</option>
                      <option value="N2">N2 - Non soggette</option>
                      <option value="N3">N3 - Non imponibili</option>
                      <option value="N4">N4 - Esenti</option>
                      <option value="N5">N5 - Regime del margine</option>
                      <option value="N6">N6 - Inverse charge</option>
                      <option value="N6.9">N6.9 - Altri reverse charge</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Riferimento Normativo</label>
                    <input
                      type="text"
                      value={r.riferimentoNormativo || ''}
                      onChange={(e) => updateRiepilogo(index, 'riferimentoNormativo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Art.17 comma 2 DPR 633/1972"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== STEP 6: Preview e Download ====================
function StepPreview({
  xml,
  tipoDocumento,
  onDownload,
}: {
  xml: string;
  tipoDocumento: TipoDocumento;
  onDownload: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toISOString().split('T')[0];
  const filename = `${tipoDocumento}_${today.replace(/-/g, '')}.xml`;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <FileCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">XML Generato con Successo!</h2>
        <p className="text-gray-600">Il file XML è pronto per essere scaricato e importato nel tuo software di fatturazione</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onDownload}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-medium shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-5 h-5" />
          Scarica XML ({filename})
        </button>
        <button
          onClick={copyToClipboard}
          className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium flex items-center justify-center gap-2 transition-all"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copiato!' : 'Copia XML'}
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-mono">{filename}</span>
          <span className="text-gray-500 text-xs">{xml.length} bytes</span>
        </div>
        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed max-h-96 overflow-y-auto">
          {xml}
        </pre>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Ricorda:</strong> Verifica sempre i dati generati prima di inviare il file allo SdI. 
          L'XML deve essere conforme alle specifiche tecniche dell'Agenzia delle Entrate (v1.2).
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [step, setStep] = useState(0);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [datiTrasmissione, setDatiTrasmissione] = useState<DatiTrasmissioneForm>({
    idPaese: 'IT',
    idCodice: '',
    progressivoInvio: '00001',
    formatoTrasmissione: 'FPR12',
    codiceDestinatario: '0000000',
    pecDestinatario: '',
  });
  const [cedentePrestatore, setCedentePrestatore] = useState<CedenteForm>({
    idPaese: '',
    idCodice: '',
    denominazione: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: 'EE',
    nazione: '',
  });
  const [cessionarioCommittente, setCessionarioCommittente] = useState<CessionarioForm>({
    idPaese: 'IT',
    idCodice: '',
    codiceFiscale: '',
    denominazione: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    nazione: 'IT',
    regimeFiscale: 'RF01',
  });
  const [datiGeneraliDocumento, setDatiGeneraliDocumento] = useState<DatiGeneraliForm>({
    divisa: 'EUR',
    data: new Date().toISOString().split('T')[0],
    numero: '',
    causale: [] as string[],
    importoTotaleDocumento: '',
  });
  const [dettaglioLinee, setDettaglioLinee] = useState<DettaglioLinea[]>([]);
  const [datiRiepilogo, setDatiRiepilogo] = useState<DatiRiepilogo[]>([]);
  const [generatedXML, setGeneratedXML] = useState('');

  const steps = [
    'Carica PDF',
    'Tipo Documento',
    'Dati Trasmissione',
    'Fornitore Estero',
    'Dati Italiani',
    'Dati Fattura',
    'Anteprima XML',
  ];

  const handlePDFParsed = (data: ParsedInvoiceData) => {
    setParsedData(data);
    setPdfUploaded(true);

    // Precompila i campi con i dati estratti
    if (data.fornitorePaese) {
      setCedentePrestatore(prev => ({
        ...prev,
        idPaese: data.fornitorePaese || '',
        nazione: data.fornitorePaese || '',
      }));
    }
    if (data.fornitoreNome) {
      setCedentePrestatore(prev => ({ ...prev, denominazione: data.fornitoreNome! }));
    }
    if (data.fornitorePartitaIva) {
      setCedentePrestatore(prev => ({ ...prev, idCodice: data.fornitorePartitaIva! }));
    }
    if (data.fornitoreIndirizzo) {
      setCedentePrestatore(prev => ({ ...prev, indirizzo: data.fornitoreIndirizzo! }));
    }
    if (data.fornitoreCitta) {
      setCedentePrestatore(prev => ({ ...prev, comune: data.fornitoreCitta! }));
    }
    if (data.fornitoreCap) {
      setCedentePrestatore(prev => ({ ...prev, cap: data.fornitoreCap! }));
    }
    if (data.numeroFattura) {
      setDatiGeneraliDocumento(prev => ({ ...prev, numero: data.numeroFattura! }));
    }
    if (data.dataFattura) {
      setDatiGeneraliDocumento(prev => ({ ...prev, data: data.dataFattura! }));
    }
    if (data.valuta) {
      setDatiGeneraliDocumento(prev => ({ ...prev, divisa: data.valuta! }));
    }
    if (data.totale) {
      setDatiGeneraliDocumento(prev => ({ ...prev, importoTotaleDocumento: data.totale! }));
    }
    if (data.descrizione) {
      // Aggiungi una linea con la descrizione estratta
      const linea: DettaglioLinea = {
        numeroLinea: 1,
        descrizione: data.descrizione,
        quantita: '1',
        prezzoUnitario: data.totale || '0',
        aliquotaIVA: '0',
        natura: 'N6',
        prezzoTotale: data.totale || '0',
      };
      setDettaglioLinee([linea]);
    }

    // Se c'è un suggerimento per il tipo documento, pre-selezionalo
    if (data.tipoDocumentoSuggerito) {
      setTipoDocumento(data.tipoDocumentoSuggerito);
      setDatiGeneraliDocumento(prev => ({
        ...prev,
        causale: getDefaultCausale(data.tipoDocumentoSuggerito!),
      }));
    }

    // Vai al prossimo step
    setStep(1);
  };

  const handleSkipUpload = () => {
    setPdfUploaded(false);
    setStep(1);
  };

  const handleTipoDocumentoSelect = (tipo: TipoDocumento) => {
    setTipoDocumento(tipo);
    setDatiGeneraliDocumento((prev) => ({
      ...prev,
      causale: getDefaultCausale(tipo),
    }));
  };

  const generateXMLAndPreview = () => {
    if (!tipoDocumento) return;

    const data = {
      tipoDocumento,
      datiTrasmissione: {
        ...datiTrasmissione,
        formatoTrasmissione: datiTrasmissione.formatoTrasmissione as 'FPA12' | 'FPR12',
      },
      cedentePrestatore,
      cessionarioCommittente,
      datiGeneraliDocumento: {
        ...datiGeneraliDocumento,
        tipoDocumento,
      },
      dettaglioLinee,
      datiRiepilogo,
    };

    const xml = generateXML(data);
    setGeneratedXML(xml);
  };

  const handleNext = () => {
    if (step === 5) {
      generateXMLAndPreview();
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleDownload = () => {
    if (!tipoDocumento) return;
    const today = new Date().toISOString().split('T')[0];
    const filename = `${tipoDocumento}_${today.replace(/-/g, '')}.xml`;
    downloadXML(generatedXML, filename);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true; // Upload PDF è opzionale
      case 1: return tipoDocumento !== null;
      case 2: return datiTrasmissione.idCodice !== '' && datiTrasmissione.progressivoInvio !== '';
      case 3: return cedentePrestatore.denominazione !== '' && cedentePrestatore.idPaese !== '';
      case 4: return cessionarioCommittente.denominazione !== '' && cessionarioCommittente.idCodice !== '';
      case 5: return datiGeneraliDocumento.numero !== '' && (dettaglioLinee.length > 0 || datiRiepilogo.length > 0);
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AutoFattura XML</h1>
              <p className="text-xs text-gray-500">Generatore autofatture elettroniche SdI da PDF</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium text-xs">TD17</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium text-xs">TD18</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium text-xs">TD19</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i < step
                      ? 'bg-green-500 text-white'
                      : i === step
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 text-center hidden lg:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {step === 0 && (
            <StepUploadPDF onPDFParsed={handlePDFParsed} onSkip={handleSkipUpload} />
          )}
          {step === 1 && (
            <StepTipoDocumento
              selected={tipoDocumento}
              onSelect={handleTipoDocumentoSelect}
              suggestion={parsedData ? { type: parsedData.tipoDocumentoSuggerito, reason: parsedData.motivoSuggerimento } : undefined}
            />
          )}
          {step === 2 && (
            <StepDatiTrasmissione data={datiTrasmissione} onChange={setDatiTrasmissione} />
          )}
          {step === 3 && (
            <StepCedente data={cedentePrestatore} onChange={setCedentePrestatore} parsedData={parsedData} />
          )}
          {step === 4 && (
            <StepCessionario data={cessionarioCommittente} onChange={setCessionarioCommittente} />
          )}
          {step === 5 && (
            <StepDatiFattura
              tipoDocumento={tipoDocumento!}
              datiGenerali={datiGeneraliDocumento}
              onDatiGeneraliChange={setDatiGeneraliDocumento}
              linee={dettaglioLinee}
              onLineeChange={setDettaglioLinee}
              riepilogo={datiRiepilogo}
              onRiepilogoChange={setDatiRiepilogo}
              parsedData={parsedData}
            />
          )}
          {step === 6 && (
            <StepPreview xml={generatedXML} tipoDocumento={tipoDocumento!} onDownload={handleDownload} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              step === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Indietro
          </button>
          
          {step < steps.length - 1 && (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {step === 5 ? (
                <>
                  <Eye className="w-5 h-5" />
                  Genera XML
                </>
              ) : (
                <>
                  Avanti
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-700">Carica PDF</h4>
            </div>
            <p className="text-xs text-gray-500">Carica la fattura estera in PDF: i dati verranno estratti automaticamente per velocizzare la compilazione.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-gray-700">Validazione</h4>
            </div>
            <p className="text-xs text-gray-500">Verifica sempre l'XML con il validatore ufficiale dell'Agenzia delle Entrate prima dell'invio.</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-green-500" />
              <h4 className="text-sm font-semibold text-gray-700">Conformità</h4>
            </div>
            <p className="text-xs text-gray-500">Generato secondo specifiche tecniche FatturaPA v1.2 (provvedimento del 30/10/2018 e succ. mod.)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
