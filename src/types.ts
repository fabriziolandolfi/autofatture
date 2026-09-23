export type TipoDocumento = 'TD17' | 'TD18' | 'TD19';

export interface DatiTrasmissione {
  idPaese: string;
  idCodice: string;
  progressivoInvio: string;
  formatoTrasmissione: 'FPA12' | 'FPR12';
  codiceDestinatario: string;
  pecDestinatario?: string;
}

export interface DatiAnagraficiCedente {
  idPaese: string;
  idCodice: string;
  denominazione?: string;
  nome?: string;
  cognome?: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
}

export interface DatiAnagraficiCessionario {
  idPaese: string;
  idCodice: string;
  codiceFiscale?: string;
  denominazione?: string;
  nome?: string;
  cognome?: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
  regimeFiscale: string;
}

export interface DatiGeneraliDocumento {
  tipoDocumento: TipoDocumento;
  divisa: string;
  data: string;
  numero: string;
  causale?: string[];
  importoTotaleDocumento?: string;
}

export interface DettaglioLinea {
  numeroLinea: number;
  descrizione: string;
  quantita?: string;
  unitaMisura?: string;
  prezzoUnitario: string;
  aliquotaIVA: string;
  natura?: string;
  prezzoTotale: string;
}

export interface DatiRiepilogo {
  aliquotaIVA: string;
  imponibile: string;
  imposta: string;
  natura?: string;
  riferimentoNormativo?: string;
}

export interface AutofatturaData {
  tipoDocumento: TipoDocumento;
  datiTrasmissione: DatiTrasmissione;
  cedentePrestatore: DatiAnagraficiCedente;
  cessionarioCommittente: DatiAnagraficiCessionario;
  datiGeneraliDocumento: DatiGeneraliDocumento;
  dettaglioLinee: DettaglioLinea[];
  datiRiepilogo: DatiRiepilogo[];
}

export interface WizardState {
  step: number;
  tipoDocumento: TipoDocumento | null;
  datiTrasmissione: DatiTrasmissione;
  cedentePrestatore: DatiAnagraficiCedente;
  cessionarioCommittente: DatiAnagraficiCessionario;
  datiGeneraliDocumento: DatiGeneraliDocumento;
  dettaglioLinee: DettaglioLinea[];
  datiRiepilogo: DatiRiepilogo[];
}
