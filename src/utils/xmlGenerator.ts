import { AutofatturaData, TipoDocumento } from '../types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDecimal(value: string, decimals: number = 2): string {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals).replace('.', ',');
}

function getTipoDocumentoDescription(tipo: TipoDocumento): string {
  switch (tipo) {
    case 'TD17': return 'Integrazione/Autofattura per acquisto di servizi dall\'estero';
    case 'TD18': return 'Integrazione per acquisto di beni intracomunitari';
    case 'TD19': return 'Integrazione/Autofattura per acquisto di beni ex art.17 c.2 DPR 633/72';
  }
}

export function generateXML(data: AutofatturaData): string {
  const {
    datiTrasmissione,
    cedentePrestatore,
    cessionarioCommittente,
    datiGeneraliDocumento,
    dettaglioLinee,
    datiRiepilogo,
  } = data;

  // Build CedentePrestatore
  let cedenteXML = `    <CedentePrestatore>\n`;
  cedenteXML += `      <DatiAnagrafici>\n`;
  cedenteXML += `        <IdFiscaleIVA>\n`;
  cedenteXML += `          <IdPaese>${escapeXml(cedentePrestatore.idPaese)}</IdPaese>\n`;
  cedenteXML += `          <IdCodice>${escapeXml(cedentePrestatore.idCodice)}</IdCodice>\n`;
  cedenteXML += `        </IdFiscaleIVA>\n`;
  if (cedentePrestatore.denominazione) {
    cedenteXML += `        <Denominazione>${escapeXml(cedentePrestatore.denominazione)}</Denominazione>\n`;
  } else {
    if (cedentePrestatore.nome) cedenteXML += `        <Nome>${escapeXml(cedentePrestatore.nome)}</Nome>\n`;
    if (cedentePrestatore.cognome) cedenteXML += `        <Cognome>${escapeXml(cedentePrestatore.cognome)}</Cognome>\n`;
  }
  cedenteXML += `        <RegimeFiscale>RF01</RegimeFiscale>\n`;
  cedenteXML += `      </DatiAnagrafici>\n`;
  cedenteXML += `      <Sede>\n`;
  cedenteXML += `        <Indirizzo>${escapeXml(cedentePrestatore.indirizzo)}</Indirizzo>\n`;
  cedenteXML += `        <CAP>${escapeXml(cedentePrestatore.cap)}</CAP>\n`;
  cedenteXML += `        <Comune>${escapeXml(cedentePrestatore.comune)}</Comune>\n`;
  if (cedentePrestatore.provincia) {
    cedenteXML += `        <Provincia>${escapeXml(cedentePrestatore.provincia)}</Provincia>\n`;
  }
  cedenteXML += `        <Nazione>${escapeXml(cedentePrestatore.nazione)}</Nazione>\n`;
  cedenteXML += `      </Sede>\n`;
  cedenteXML += `    </CedentePrestatore>\n`;

  // Build CessionarioCommittente
  let cessionarioXML = `    <CessionarioCommittente>\n`;
  cessionarioXML += `      <DatiAnagrafici>\n`;
  cessionarioXML += `        <IdFiscaleIVA>\n`;
  cessionarioXML += `          <IdPaese>${escapeXml(cessionarioCommittente.idPaese)}</IdPaese>\n`;
  cessionarioXML += `          <IdCodice>${escapeXml(cessionarioCommittente.idCodice)}</IdCodice>\n`;
  cessionarioXML += `        </IdFiscaleIVA>\n`;
  if (cessionarioCommittente.codiceFiscale) {
    cessionarioXML += `        <CodiceFiscale>${escapeXml(cessionarioCommittente.codiceFiscale)}</CodiceFiscale>\n`;
  }
  if (cessionarioCommittente.denominazione) {
    cessionarioXML += `        <Denominazione>${escapeXml(cessionarioCommittente.denominazione)}</Denominazione>\n`;
  } else {
    if (cessionarioCommittente.nome) cessionarioXML += `        <Nome>${escapeXml(cessionarioCommittente.nome)}</Nome>\n`;
    if (cessionarioCommittente.cognome) cessionarioXML += `        <Cognome>${escapeXml(cessionarioCommittente.cognome)}</Cognome>\n`;
  }
  cessionarioXML += `        <RegimeFiscale>${escapeXml(cessionarioCommittente.regimeFiscale)}</RegimeFiscale>\n`;
  cessionarioXML += `      </DatiAnagrafici>\n`;
  cessionarioXML += `      <Sede>\n`;
  cessionarioXML += `        <Indirizzo>${escapeXml(cessionarioCommittente.indirizzo)}</Indirizzo>\n`;
  cessionarioXML += `        <CAP>${escapeXml(cessionarioCommittente.cap)}</CAP>\n`;
  cessionarioXML += `        <Comune>${escapeXml(cessionarioCommittente.comune)}</Comune>\n`;
  if (cessionarioCommittente.provincia) {
    cessionarioXML += `        <Provincia>${escapeXml(cessionarioCommittente.provincia)}</Provincia>\n`;
  }
  cessionarioXML += `        <Nazione>${escapeXml(cessionarioCommittente.nazione)}</Nazione>\n`;
  cessionarioXML += `      </Sede>\n`;
  cessionarioXML += `    </CessionarioCommittente>\n`;

  // Build DatiGeneraliDocumento
  let datiGeneraliXML = `      <DatiGeneraliDocumento>\n`;
  datiGeneraliXML += `        <TipoDocumento>${datiGeneraliDocumento.tipoDocumento}</TipoDocumento>\n`;
  datiGeneraliXML += `        <Divisa>${escapeXml(datiGeneraliDocumento.divisa)}</Divisa>\n`;
  datiGeneraliXML += `        <Data>${datiGeneraliDocumento.data}</Data>\n`;
  datiGeneraliXML += `        <Numero>${escapeXml(datiGeneraliDocumento.numero)}</Numero>\n`;
  if (datiGeneraliDocumento.importoTotaleDocumento) {
    datiGeneraliXML += `        <ImportoTotaleDocumento>${formatDecimal(datiGeneraliDocumento.importoTotaleDocumento)}</ImportoTotaleDocumento>\n`;
  }
  if (datiGeneraliDocumento.causale && datiGeneraliDocumento.causale.length > 0) {
    datiGeneraliDocumento.causale.forEach(causale => {
      datiGeneraliXML += `        <Causale>${escapeXml(causale)}</Causale>\n`;
    });
  }
  datiGeneraliXML += `      </DatiGeneraliDocumento>\n`;

  // Build DettaglioLinee
  let lineeXML = '';
  dettaglioLinee.forEach(linea => {
    lineeXML += `      <DettaglioLinee>\n`;
    lineeXML += `        <NumeroLinea>${linea.numeroLinea}</NumeroLinea>\n`;
    lineeXML += `        <Descrizione>${escapeXml(linea.descrizione)}</Descrizione>\n`;
    if (linea.quantita) {
      lineeXML += `        <Quantita>${formatDecimal(linea.quantita)}</Quantita>\n`;
    }
    if (linea.unitaMisura) {
      lineeXML += `        <UnitaMisura>${escapeXml(linea.unitaMisura)}</UnitaMisura>\n`;
    }
    lineeXML += `        <PrezzoUnitario>${formatDecimal(linea.prezzoUnitario)}</PrezzoUnitario>\n`;
    lineeXML += `        <PrezzoTotale>${formatDecimal(linea.prezzoTotale)}</PrezzoTotale>\n`;
    lineeXML += `        <AliquotaIVA>${formatDecimal(linea.aliquotaIVA)}</AliquotaIVA>\n`;
    if (linea.natura) {
      lineeXML += `        <Natura>${linea.natura}</Natura>\n`;
    }
    lineeXML += `      </DettaglioLinee>\n`;
  });

  // Build DatiRiepilogo
  let riepilogoXML = '';
  datiRiepilogo.forEach(riepilogo => {
    riepilogoXML += `      <DatiRiepilogo>\n`;
    riepilogoXML += `        <AliquotaIVA>${formatDecimal(riepilogo.aliquotaIVA)}</AliquotaIVA>\n`;
    riepilogoXML += `        <Imponibile>${formatDecimal(riepilogo.imponibile)}</Imponibile>\n`;
    riepilogoXML += `        <Imposta>${formatDecimal(riepilogo.imposta)}</Imposta>\n`;
    if (riepilogo.natura) {
      riepilogoXML += `        <Natura>${riepilogo.natura}</Natura>\n`;
    }
    if (riepilogo.riferimentoNormativo) {
      riepilogoXML += `        <RiferimentoNormativo>${escapeXml(riepilogo.riferimentoNormativo)}</RiferimentoNormativo>\n`;
    }
    riepilogoXML += `      </DatiRiepilogo>\n`;
  });

  // Assemble full XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<p:FatturaElettronica versione="${datiTrasmissione.formatoTrasmissione}" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">\n`;
  
  xml += `  <FatturaElettronicaHeader>\n`;
  xml += `    <DatiTrasmissione>\n`;
  xml += `      <IdTrasmittente>\n`;
  xml += `        <IdPaese>${escapeXml(datiTrasmissione.idPaese)}</IdPaese>\n`;
  xml += `        <IdCodice>${escapeXml(datiTrasmissione.idCodice)}</IdCodice>\n`;
  xml += `      </IdTrasmittente>\n`;
  xml += `      <ProgressivoInvio>${escapeXml(datiTrasmissione.progressivoInvio)}</ProgressivoInvio>\n`;
  xml += `      <FormatoTrasmissione>${datiTrasmissione.formatoTrasmissione}</FormatoTrasmissione>\n`;
  xml += `      <CodiceDestinatario>${escapeXml(datiTrasmissione.codiceDestinatario)}</CodiceDestinatario>\n`;
  if (datiTrasmissione.pecDestinatario) {
    xml += `      <PECDestinatario>${escapeXml(datiTrasmissione.pecDestinatario)}</PECDestinatario>\n`;
  }
  xml += `    </DatiTrasmissione>\n`;
  xml += cedenteXML;
  xml += cessionarioXML;
  xml += `  </FatturaElettronicaHeader>\n`;
  
  xml += `  <FatturaElettronicaBody>\n`;
  xml += datiGeneraliXML;
  xml += `    <DatiBeniServizi>\n`;
  xml += lineeXML;
  xml += riepilogoXML;
  xml += `    </DatiBeniServizi>\n`;
  xml += `  </FatturaElettronicaBody>\n`;
  
  xml += `</p:FatturaElettronica>`;

  return xml;
}

export function getDefaultCausale(tipo: TipoDocumento): string[] {
  switch (tipo) {
    case 'TD17':
      return ['Integrazione autofattura per acquisto servizi da soggetto non residente - Art.17 c.2 DPR 633/72'];
    case 'TD18':
      return ['Integrazione per acquisto di beni intracomunitari - Art.46 DL 331/93'];
    case 'TD19':
      return ['Integrazione/autofattura per acquisto di beni da soggetti non residenti - Art.17 c.2 DPR 633/72'];
  }
}

export function getDefaultNatura(tipo: TipoDocumento): string {
  return 'N6'; // Non imponibili - alcuni casi
}

export function getDefaultRiferimentoNormativo(tipo: TipoDocumento): string {
  switch (tipo) {
    case 'TD17':
      return 'Art.17 comma 2 DPR 633/1972 - Autofattura servizi da estero';
    case 'TD18':
      return 'Art.46 DL 331/1993 - Acquisti intracomunitari';
    case 'TD19':
      return 'Art.17 comma 2 DPR 633/1972 - Autofattura beni da non residenti';
  }
}

export function getTipoDocumentoLabel(tipo: TipoDocumento): string {
  return getTipoDocumentoDescription(tipo);
}

export function downloadXML(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
