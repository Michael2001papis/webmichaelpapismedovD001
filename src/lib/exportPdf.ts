import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { safeFileName } from './id'

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
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let heightLeft = imgH
  let position = 0
  pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
  heightLeft -= pageH
  while (heightLeft > 4) {
    position -= pageH
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH)
    heightLeft -= pageH
  }
  pdf.save(`${safeFileName(name)}.pdf`)
}
