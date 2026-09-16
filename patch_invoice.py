import re

with open("src/components/vendor/InvoiceModal.tsx", "r") as f:
    content = f.read()

start_idx = content.find('<div id="official-invoice-print-container" className="space-y-8">')
end_idx = content.find('      {/* Print stylesheet to ensure only official invoice prints without background overlays */}')

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers. start: {start_idx}, end: {end_idx}")
    exit(1)

# Backtrack from end_idx to find the closing div of the print container
# The original structure:
#           </div>
#         )}
#       </div>
# 
#       {/* Print stylesheet to ensure only official invoice prints without background overlays */}
# So we want to replace up to the line right before `          </div>` that closes `bg-white w-full max-w-4xl...`
# Let's search backwards from end_idx for "          </div>"

search_str = "          </div>\n        )}\n      </div>\n\n      {/* Print stylesheet"
actual_end_idx = content.find(search_str)

if actual_end_idx == -1:
    print("Could not find actual end index.")
    search_str2 = "          </div>\n        )}\n      </div>\n"
    actual_end_idx = content.find(search_str2)
    if actual_end_idx == -1:
        print("Still no.")
        exit(1)
    
print("Found actual end index.")

with open("new_container.tsx", "r") as f:
    new_content = f.read()

final_content = content[:start_idx] + new_content + "\n" + content[actual_end_idx:]

with open("src/components/vendor/InvoiceModal.tsx", "w") as f:
    f.write(final_content)

print("Patched successfully!")
