with open("src/components/vendor/InvoiceModal.tsx", "r") as f:
    content = f.read()

import re

old_code = """        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }"""

new_code = """        let pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Scale down to fit exactly in 2 pages if it overflows
        const maxPages = 2;
        if (imgHeight > pageHeight * maxPages) {
          const ratio = (pageHeight * maxPages) / imgHeight;
          imgHeight = imgHeight * ratio;
          pdfWidth = pdfWidth * ratio;
        }
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Center horizontally if scaled
        const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;

        pdf.addImage(imgData, 'PNG', xOffset, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 1) { // > 1 to avoid floating point precision blank pages
          position = position - pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', xOffset, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("src/components/vendor/InvoiceModal.tsx", "w") as f:
        f.write(content)
    print("Patched successfully!")
else:
    print("Could not find old_code to replace.")
