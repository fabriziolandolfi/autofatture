import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedInvoiceData {
  // Dati fornitore
  fornitoreNome?: string;
  fornitoreIndirizzo?: string;
  fornitoreCitta?: string;
  fornitoreCap?: string;
  fornitorePaese?: string;
  fornitorePartitaIva?: string;
  
  // Dati fattura
  numeroFattura?: string;
  dataFattura?: string;
  valuta?: string;
  imponibile?: string;
  iva?: string;
  totale?: string;
  
  // Descrizione
  descrizione?: string;
  
  // Suggerimento tipo documento
  tipoDocumentoSuggerito?: 'TD17' | 'TD18' | 'TD19';
  motivoSuggerimento?: string;
  
  // Testo grezzo estratto
  rawText?: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

export function parseInvoiceData(text: string): ParsedInvoiceData {
  const result: ParsedInvoiceData = {
    rawText: text,
  };
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Estrai numero fattura
  result.numeroFattura = extractInvoiceNumber(text);
  
  // Estrai data
  result.dataFattura = extractDate(text);
  
  // Estrai valuta
  result.valuta = extractCurrency(text);
  
  // Estrai importi
  const amounts = extractAmounts(text);
  result.totale = amounts.total;
  result.imponibile = amounts.subtotal;
  result.iva = amounts.vat;
  
  // Estrai dati fornitore (cerca pattern tipici)
  const supplierData = extractSupplierData(text);
  result.fornitoreNome = supplierData.name;
  result.fornitoreIndirizzo = supplierData.address;
  result.fornitoreCitta = supplierData.city;
  result.fornitoreCap = supplierData.postalCode;
  result.fornitorePaese = supplierData.country;
  result.fornitorePartitaIva = supplierData.vatId;
  
  // Estrai descrizione
  result.descrizione = extractDescription(text);
  
  // Suggerisci tipo documento
  const suggestion = suggestDocumentType(text, supplierData.country);
  result.tipoDocumentoSuggerito = suggestion.type;
  result.motivoSuggerimento = suggestion.reason;
  
  return result;
}

function extractInvoiceNumber(text: string): string | undefined {
  // Pattern comuni per numeri di fattura
  const patterns = [
    /invoice\s*(?:number|#|no\.?|n\.?)\s*:?\s*([A-Z0-9\-\/]+)/i,
    /rechnung\s*(?:nummer|nr\.?|no\.?)\s*:?\s*([A-Z0-9\-\/]+)/i,
    /facture\s*(?:number|n°|n\.?)\s*:?\s*([A-Z0-9\-\/]+)/i,
    /factura\s*(?:number|número|n\.?)\s*:?\s*([A-Z0-9\-\/]+)/i,
    /invoice\s*:?\s*([A-Z0-9\-\/]+)/i,
    /rechnung\s*:?\s*([A-Z0-9\-\/]+)/i,
    /n\.?\s*fattura\s*:?\s*([A-Z0-9\-\/]+)/i,
    /#\s*([A-Z0-9\-\/]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

function extractDate(text: string): string | undefined {
  // Pattern per date in vari formati
  const patterns = [
    /(?:date|data|datum)\s*:?\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(?:date|data|datum)\s*:?\s*(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/i,
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/,
    /(\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeDate(match[1]);
    }
  }
  
  return undefined;
}

function normalizeDate(dateStr: string): string {
  // Converti vari formati di data in YYYY-MM-DD
  const parts = dateStr.split(/[\/\.\-]/);
  
  if (parts.length !== 3) return dateStr;
  
  let year: string, month: string, day: string;
  
  if (parts[0].length === 4) {
    // Formato YYYY-MM-DD o YYYY/MM/DD
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
  } else {
    // Formato DD/MM/YYYY o MM/DD/YYYY
    // Assumiamo DD/MM/YYYY (formato europeo)
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
  }
  
  return `${year}-${month}-${day}`;
}

function extractCurrency(text: string): string {
  // Cerca simboli di valuta
  if (/\$/.test(text) || /USD/i.test(text)) return 'USD';
  if (/£/.test(text) || /GBP/i.test(text)) return 'GBP';
  if (/CHF/i.test(text)) return 'CHF';
  if (/€/.test(text) || /EUR/i.test(text)) return 'EUR';
  
  return 'EUR'; // Default
}

function extractAmounts(text: string): { total?: string; subtotal?: string; vat?: string } {
  const result: { total?: string; subtotal?: string; vat?: string } = {};
  
  // Pattern per importi con separatore decimale , o .
  const amountPattern = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
  const amounts: number[] = [];
  
  let match;
  while ((match = amountPattern.exec(text)) !== null) {
    const amount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(amount) && amount > 0) {
      amounts.push(amount);
    }
  }
  
  // Cerca pattern specifici per totale, imponibile, IVA
  const totalPattern = /(?:total|totale|gesamt|total\s+due|amount\s+due)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i;
  const subtotalPattern = /(?:subtotal|sub\s*total|imponibile|net\s+amount|netto)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i;
  const vatPattern = /(?:vat|iva|mwst|tax|gst)\s*:?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i;
  
  const totalMatch = text.match(totalPattern);
  const subtotalMatch = text.match(subtotalPattern);
  const vatMatch = text.match(vatPattern);
  
  if (totalMatch) {
    result.total = totalMatch[1].replace(/\./g, '').replace(',', '.');
  }
  if (subtotalMatch) {
    result.subtotal = subtotalMatch[1].replace(/\./g, '').replace(',', '.');
  }
  if (vatMatch) {
    result.vat = vatMatch[1].replace(/\./g, '').replace(',', '.');
  }
  
  // Se non troviamo pattern specifici, usiamo l'importo più grande come totale
  if (!result.total && amounts.length > 0) {
    result.total = Math.max(...amounts).toFixed(2);
  }
  
  return result;
}

function extractSupplierData(text: string): {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  vatId?: string;
} {
  const result: any = {};
  
  // Cerca VAT ID / Partita IVA
  const vatPatterns = [
    /(?:vat\s*(?:id|number|no)|ust-?id|partita\s*iva|p\.?\s*iva|nif|siret)\s*:?\s*([A-Z0-9]+)/i,
    /([A-Z]{2}\d{8,12})/, // Pattern per VAT ID europeo (es. DE123456789)
  ];
  
  for (const pattern of vatPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.vatId = match[1];
      
      // Estrai paese dal VAT ID se presente
      if (/^[A-Z]{2}\d/.test(match[1])) {
        result.country = match[1].substring(0, 2);
      }
      break;
    }
  }
  
  // Cerca nome azienda (solitamente nelle prime righe o dopo "from", "bill from", ecc.)
  const namePatterns = [
    /(?:from|bill\s*from|seller|supplier|venditore|fornitore)\s*:?\s*\n?([^\n]+)/i,
    /^([A-Z][A-Za-z\s&.,]+(?:GmbH|AG|Ltd|Inc|LLC|SRL|S\.r\.l|SPA|S\.p\.A|S\.A|Corp|Company))/m,
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.name = match[1].trim();
      break;
    }
  }
  
  // Cerca indirizzo
  const addressPatterns = [
    /(?:address|adresse|indirizzo|straße|street)\s*:?\s*([^\n]+)/i,
    /(\d{1,5}\s+[A-Za-z\s]+(?:Street|Str|Avenue|Ave|Rd|Road|Blvd|Boulevard|Platz|Straße))/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.address = match[1].trim();
      break;
    }
  }
  
  // Cerca città e CAP
  const cityPatterns = [
    /(\d{4,6})\s+([A-Za-z\s]+?)(?:\n|$)/,
    /([A-Za-z\s]+),?\s*([A-Z]{2})\s*(?:\n|$)/,
  ];
  
  for (const pattern of cityPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && /^\d{4,6}$/.test(match[1])) {
        result.postalCode = match[1];
        result.city = match[2].trim();
      } else {
        result.city = match[1].trim();
      }
      break;
    }
  }
  
  // Se non abbiamo il paese, prova a dedurlo dal contesto
  if (!result.country) {
    const countryPatterns = [
      /\b(Germany|Deutschland|DE)\b/i,
      /\b(France|Frankreich|FR)\b/i,
      /\b(Spain|Spanien|ES)\b/i,
      /\b(Italy|Italien|IT)\b/i,
      /\b(Netherlands|Niederlande|NL)\b/i,
      /\b(United\s*Kingdom|UK|GB)\b/i,
      /\b(USA|United\s*States|US)\b/i,
    ];
    
    for (let i = 0; i < countryPatterns.length; i++) {
      const match = text.match(countryPatterns[i]);
      if (match) {
        const countryCodes = ['DE', 'FR', 'ES', 'IT', 'NL', 'GB', 'US'];
        result.country = countryCodes[i];
        break;
      }
    }
  }
  
  return result;
}

function extractDescription(text: string): string | undefined {
  // Cerca descrizioni di servizi o beni
  const descPatterns = [
    /(?:description|descrizione|beschreibung)\s*:?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
    /(?:service|servizio|dienstleistung)\s*:?\s*([^\n]+)/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 200); // Limita a 200 caratteri
    }
  }
  
  return undefined;
}

function suggestDocumentType(
  text: string,
  country?: string
): { type?: 'TD17' | 'TD18' | 'TD19'; reason?: string } {
  const textLower = text.toLowerCase();
  
  // UE countries
  const ueCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
    'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  
  // Cerca parole chiave per servizi
  const serviceKeywords = [
    'service', 'servizio', 'dienstleistung', 'consulting', 'consulenza',
    'software', 'license', 'licenza', 'subscription', 'abbonamento',
    'royalty', 'commission', 'provvigione', 'fee', 'commissione'
  ];
  
  // Cerca parole chiave per beni
  const goodsKeywords = [
    'goods', 'beni', 'ware', 'waren', 'product', 'prodotto', 'produkt',
    'item', 'articolo', 'material', 'materiale', 'equipment', 'attrezzatura'
  ];
  
  const hasServices = serviceKeywords.some(kw => textLower.includes(kw));
  const hasGoods = goodsKeywords.some(kw => textLower.includes(kw));
  
  // Se è un paese UE
  if (country && ueCountries.includes(country)) {
    if (hasServices) {
      return {
        type: 'TD17',
        reason: `Fornitore UE (${country}) + servizi rilevati → TD17 (Integrazione servizi intracomunitari)`
      };
    }
    if (hasGoods) {
      return {
        type: 'TD18',
        reason: `Fornitore UE (${country}) + beni rilevati → TD18 (Integrazione beni intracomunitari)`
      };
    }
    // Default per UE
    return {
      type: 'TD17',
      reason: `Fornitore UE (${country}) → TD17 (default per operazioni intracomunitarie)`
    };
  }
  
  // Se è extra-UE
  if (country && !ueCountries.includes(country)) {
    if (hasServices) {
      return {
        type: 'TD17',
        reason: `Fornitore extra-UE (${country}) + servizi → TD17 (Autofattura servizi da estero)`
      };
    }
    if (hasGoods) {
      return {
        type: 'TD19',
        reason: `Fornitore extra-UE (${country}) + beni → TD19 (Autofattura beni da non residenti)`
      };
    }
    // Default per extra-UE
    return {
      type: 'TD17',
      reason: `Fornitore extra-UE (${country}) → TD17 (default, verificare se beni o servizi)`
    };
  }
  
  // Se non riusciamo a determinare il paese
  if (hasServices) {
    return {
      type: 'TD17',
      reason: 'Servizi rilevati → TD17 (verificare paese del fornitore)'
    };
  }
  if (hasGoods) {
    return {
      type: 'TD19',
      reason: 'Beni rilevati → TD19 (verificare paese del fornitore)'
    };
  }
  
  return {
    type: undefined,
    reason: 'Impossibile determinare automaticamente il tipo documento. Seleziona manualmente.'
  };
}
