with open("src/components/vendor/InvoiceModal.tsx", "r") as f:
    content = f.read()

content = content.replace("        @media print {", "        @media print {\n          * {\n            -webkit-print-color-adjust: exact !important;\n            print-color-adjust: exact !important;\n          }")

with open("src/components/vendor/InvoiceModal.tsx", "w") as f:
    f.write(content)
