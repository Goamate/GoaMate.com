with open("src/components/vendor/InvoiceModal.tsx", "r") as f:
    content = f.read()

import re

# We want to replace the whole 4 Info Cards section with a smaller version.

cards_start = content.find('{/* 4 Info Cards */}')
cards_end = content.find('{/* 3 Columns Section */}')

old_cards = content[cards_start:cards_end]

new_cards = old_cards.replace('h-14', 'h-11')
new_cards = new_cards.replace('w-12', 'w-10')
new_cards = new_cards.replace('w-6 h-6', 'w-5 h-5')
new_cards = new_cards.replace('text-[10px]', 'text-[9px]')
new_cards = new_cards.replace('text-sm font-black', 'text-xs font-black leading-[11px] mt-0.5')
new_cards = new_cards.replace('pb-6', 'pb-4')
new_cards = new_cards.replace('gap-4', 'gap-3')
# Also adjust the payment status pills
new_cards = new_cards.replace('text-[11px]', 'text-[9px]')

content = content[:cards_start] + new_cards + content[cards_end:]

with open("src/components/vendor/InvoiceModal.tsx", "w") as f:
    f.write(content)

