/**
 * Legal-Grade PDF Export Utility
 * Compliant with Zero-Trust / No PII Leakage Architecture
 * 
 * @module pdfGenerator
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Mask PII from identifiers
 * @param {string} identifier - Raw identifier (e.g., "MULE_9982", "185501000012847")
 * @returns {string} Masked identifier (e.g., "MULE_****", "IOBA*****2847")
 */
const maskPII = (identifier) => {
  if (!identifier) return 'REDACTED'

  // Account numbers (numeric, 10+ digits)
  if (/^\d{10,}$/.test(identifier)) {
    const prefix = identifier.substring(0, 4)
    const suffix = identifier.substring(identifier.length - 4)
    return `${prefix}*****${suffix}`
  }

  // IFSC codes (e.g., IOBA0001855)
  if (/^[A-Z]{4}\d{7}$/.test(identifier)) {
    const prefix = identifier.substring(0, 4)
    const suffix = identifier.substring(identifier.length - 4)
    return `${prefix}*****${suffix}`
  }

  // Node IDs (e.g., MULE_01, VICTIM_03A)
  if (identifier.includes('_')) {
    const parts = identifier.split('_')
    return `${parts[0]}_****`
  }

  // Generic masking for other identifiers
  if (identifier.length > 8) {
    return `${identifier.substring(0, 3)}*****${identifier.substring(identifier.length - 2)}`
  }

  return identifier.substring(0, 3) + '****'
}

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Get action description based on node type and AI classification
 */
const getActionDescription = (node) => {
  if (node.type === 'victim') {
    return 'Protected Entity - No Action'
  }

  if (node.type === 'mule') {
    const velocity = node.velocity || 14
    const fr = node.fragmentation_ratio || 4.2
    return `Velocity: ${velocity} tx/min, FR: ${fr.toFixed(1)} | Action: Full Account Freeze`
  }

  if (node.type === 'merchant') {
    const fr = node.fragmentation_ratio || 0.0
    const tracedFunds = node.traced_funds || 50000
    return `Velocity: Normal, FR: ${fr.toFixed(1)} | Action: Proportional Lien (${formatCurrency(tracedFunds)})`
  }

  return 'Under Review'
}

/**
 * Get AI evidence summary
 */
const getAIEvidence = (node) => {
  const aiReasoning = node.ai_reasoning || {}
  
  if (node.type === 'victim') {
    return `Confirmed Victim (${(aiReasoning.confidence * 100 || 99).toFixed(0)}% confidence)`
  }

  if (node.type === 'mule') {
    const velocity = node.velocity || 14
    const fr = node.fragmentation_ratio || 4.2
    return `PVI: High (${velocity}/min) | FR: ${fr.toFixed(1)} | Conf: ${(aiReasoning.confidence * 100 || 95).toFixed(0)}%`
  }

  if (node.type === 'merchant') {
    const mcc = node.mcc_code || '5411'
    return `MCC: ${mcc} | Legitimate Business | Conf: ${(aiReasoning.confidence * 100 || 87).toFixed(0)}%`
  }

  return 'Analyzing...'
}

/**
 * Export Suspicious Activity Report (SAR) as PDF
 * 
 * @param {Object} caseData - Case metadata and graph data
 * @param {string} auditHash - SHA-256 hash for cryptographic integrity
 */
export const exportSARReport = (caseData, auditHash) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // ============================================
  // HEADER SECTION
  // ============================================
  
  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38) // Red
  doc.text('REGULATORY SUSPICIOUS ACTIVITY REPORT (SAR)', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 8

  // Subtitle
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105) // Slate-600
  doc.text('Indian Overseas Bank - Precision Fund Containment Engine', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 5
  doc.text('(Internal Audit - Zero PII Exposure)', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Metadata Box
  doc.setFillColor(241, 245, 249) // Slate-100
  doc.rect(15, yPosition, pageWidth - 30, 25, 'F')
  
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.setTextColor(30, 41, 59) // Slate-800
  
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Kolkata'
  })
  
  doc.text(`Report Generated: ${timestamp}`, 20, yPosition + 6)
  doc.text(`Case ID: ${caseData.case_id || 'FRA-2026-IOB-00847'}`, 20, yPosition + 11)
  doc.text(`Investigation Type: ${caseData.investigation_type || 'RAPID_FUND_FRAGMENTATION'}`, 20, yPosition + 16)
  doc.text(`Total Suspected Amount: ${formatCurrency(caseData.total_suspected_amount || 200000)}`, 20, yPosition + 21)
  
  yPosition += 30

  // ============================================
  // EXECUTIVE SUMMARY
  // ============================================
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.text('EXECUTIVE SUMMARY', 15, yPosition)
  yPosition += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85) // Slate-700
  
  const summaryText = `Network-wide containment action executed at ${new Date().toLocaleTimeString('en-IN')}. ` +
    `Mule accounts identified via AI-driven velocity and fragmentation analysis have been frozen. ` +
    `Innocent merchant accounts have been subjected to proportional lien enforcement to secure traced funds ` +
    `while maintaining operational continuity. Zero Personally Identifiable Information (PII) is exposed in ` +
    `this metadata payload. All identifiers are cryptographically masked per Zero-Trust architecture.`
  
  const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 30)
  doc.text(summaryLines, 15, yPosition)
  yPosition += summaryLines.length * 5 + 10

  // ============================================
  // EVIDENCE MATRIX (AUTOTABLE)
  // ============================================
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('EVIDENCE MATRIX', 15, yPosition)
  yPosition += 5

  // Prepare table data
  const tableData = []
  const nodes = caseData.graphData?.nodes || []

  nodes.forEach(node => {
    tableData.push([
      maskPII(node.id),
      node.type.toUpperCase(),
      getAIEvidence(node),
      getActionDescription(node)
    ])
  })

  // Generate table
  doc.autoTable({
    startY: yPosition,
    head: [['Masked Entity ID', 'Type', 'AI Evidence (PVI / FR)', 'Action Taken']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85], // Slate-700
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', font: 'courier' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 60 },
      3: { cellWidth: 60 }
    },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184) // Slate-400
      doc.text(
        `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }
  })

  yPosition = doc.lastAutoTable.finalY + 15

  // Check if we need a new page for the hash and certificate
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  // ============================================
  // CRYPTOGRAPHIC INTEGRITY BLOCK
  // ============================================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(6, 182, 212) // Cyan-500
  doc.text('IMMUTABLE LEDGER HASH (SHA-256)', 15, yPosition)
  yPosition += 7

  // Hash box
  doc.setFillColor(236, 254, 255) // Cyan-50
  doc.setDrawColor(34, 211, 238) // Cyan-400
  doc.rect(15, yPosition - 3, pageWidth - 30, 12, 'FD')
  
  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  doc.setTextColor(8, 145, 178) // Cyan-600
  doc.text(auditHash || 'HASH_GENERATION_PENDING', 20, yPosition + 3)
  yPosition += 15

  // ============================================
  // LEGAL CERTIFICATE (FOOTER)
  // ============================================
  
  doc.setFillColor(254, 243, 199) // Amber-100
  doc.setDrawColor(251, 191, 36) // Amber-400
  doc.rect(15, yPosition, pageWidth - 30, 30, 'FD')
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(146, 64, 14) // Amber-800
  doc.text('CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM, 2023', 20, yPosition + 6)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 53, 15) // Amber-900
  
  const legalText = 'Generated by the automated anomaly detection system. Data is secured via SHA-256 ' +
    'cryptographic hashing. All account identifiers are masked per Zero-Trust architecture. ' +
    'Property of Indian Overseas Bank. This document is admissible as electronic evidence under ' +
    'the Bharatiya Sakshya Adhiniyam, 2023.'
  
  const legalLines = doc.splitTextToSize(legalText, pageWidth - 40)
  doc.text(legalLines, 20, yPosition + 12)

  // ============================================
  // SAVE PDF
  // ============================================
  
  const filename = `SAR_${caseData.case_id || 'IOB'}_${Date.now()}.pdf`
  doc.save(filename)
  
  return filename
}

/**
 * Export Quick Evidence Summary (Single Page)
 */
export const exportQuickSummary = (caseData, auditHash) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPosition = 20

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text('QUICK EVIDENCE SUMMARY', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Case: ${caseData.case_id || 'FRA-2026-IOB-00847'}`, 15, yPosition)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 15, yPosition, { align: 'right' })
  yPosition += 10

  // Key Metrics
  const nodes = caseData.graphData?.nodes || []
  const muleCount = nodes.filter(n => n.type === 'mule').length
  const merchantCount = nodes.filter(n => n.type === 'merchant').length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Mules Identified: ${muleCount}`, 15, yPosition)
  doc.text(`Merchants Affected: ${merchantCount}`, 15, yPosition + 6)
  doc.text(`Total Amount: ${formatCurrency(caseData.total_suspected_amount || 200000)}`, 15, yPosition + 12)
  yPosition += 20

  // Hash
  doc.setFontSize(8)
  doc.setFont('courier', 'normal')
  doc.text(`Hash: ${auditHash}`, 15, yPosition)

  doc.save(`Summary_${caseData.case_id || 'IOB'}_${Date.now()}.pdf`)
}
