/*
 * Holikar
 * Copyright © 2026 Michael Papismedov.
 * All rights reserved.
 *
 * Proprietary software.
 * Unauthorized copying, distribution, modification,
 * publication or commercial use is prohibited.
 */

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { COPYRIGHT, DOCUMENT_META } from '../config/copyright'
import { safeFileName } from './id'

const FOOTER_H = 11

export async function exportElementToPdf(element: HTMLElement, name: string) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: Math.max(element.scrollWidth, 1200),
  })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const landscape = canvas.width >= canvas.height
  const pdf = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  pdf.setProperties({
    title: `${name} — ${COPYRIGHT.product}`,
    author: DOCUMENT_META.author,
    creator: DOCUMENT_META.creator,
    subject: DOCUMENT_META.copyright,
    keywords: `${COPYRIGHT.product}, ${COPYRIGHT.owner}, ${DOCUMENT_META.copyright}`,
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const contentH = pageH - FOOTER_H
  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let heightLeft = imgH
  let position = 0
  pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
  heightLeft -= contentH
  while (heightLeft > 4) {
    position -= contentH
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
    heightLeft -= contentH
  }

  drawFooters(pdf, pageW, pageH)
  pdf.save(`${safeFileName(name)}.pdf`)
}

function drawFooters(pdf: jsPDF, pageW: number, pageH: number) {
  const total = pdf.getNumberOfPages()
  const top = pageH - FOOTER_H
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page)
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, top, pageW, FOOTER_H, 'F')
    pdf.setDrawColor(216, 210, 200)
    pdf.line(10, top + 2, pageW - 10, top + 2)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(94, 99, 104)
    pdf.text(COPYRIGHT.text, pageW / 2, top + 6.5, { align: 'center' })
    pdf.text(`Page ${page} of ${total}`, pageW - 10, top + 6.5, { align: 'right' })
  }
}
