// Sample realistic KYC documents for internal copy preview and seed bookings
// Crisp, self-contained SVG data URIs that work offline and never fail in PDFs

export const SAMPLE_DL_FRONT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#f8fafc; font-family:system-ui, -apple-system, sans-serif;">
  <rect x="0" y="0" width="540" height="340" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  
  <!-- Header Banner -->
  <rect x="0" y="0" width="540" height="70" rx="16" fill="#0f766e"/>
  <rect x="0" y="55" width="540" height="15" fill="#0f766e"/>
  
  <text x="270" y="28" fill="#ffffff" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.5">UNION OF INDIA • GOVERNMENT OF GOA</text>
  <text x="270" y="48" fill="#ccfbf1" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="2">DRIVING LICENCE</text>

  <!-- Gold Smart Chip Graphic -->
  <rect x="28" y="90" width="52" height="42" rx="6" fill="#eab308" stroke="#ca8a04" stroke-width="1.5"/>
  <line x1="28" y1="104" x2="80" y2="104" stroke="#a16207" stroke-width="1"/>
  <line x1="28" y1="118" x2="80" y2="118" stroke="#a16207" stroke-width="1"/>
  <line x1="54" y1="90" x2="54" y2="132" stroke="#a16207" stroke-width="1"/>

  <!-- Photo Box -->
  <rect x="28" y="145" width="120" height="150" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- User Silhouette -->
  <circle cx="88" cy="200" r="32" fill="#64748b"/>
  <path d="M48 285 C48 245, 128 245, 128 285 Z" fill="#64748b"/>
  <rect x="28" y="275" width="120" height="20" rx="4" fill="#0f766e" opacity="0.9"/>
  <text x="88" y="289" fill="#ffffff" font-size="9" font-weight="700" text-anchor="middle">VERIFIED HOLDER</text>

  <!-- Licence Details -->
  <text x="170" y="105" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">LICENCE NUMBER</text>
  <text x="170" y="125" fill="#0f172a" font-size="16" font-weight="900" letter-spacing="1">GA-03-20210009841</text>

  <text x="170" y="152" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">NAME</text>
  <text x="170" y="170" fill="#0f172a" font-size="14" font-weight="800">RAHUL SHARMA</text>

  <text x="170" y="195" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">SON/DAUGHTER OF</text>
  <text x="170" y="212" fill="#334155" font-size="12" font-weight="600">VIKRAM SHARMA</text>

  <text x="170" y="238" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">DATE OF BIRTH</text>
  <text x="170" y="255" fill="#334155" font-size="12" font-weight="700">14-08-1994</text>

  <text x="320" y="238" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">BLOOD GROUP</text>
  <text x="320" y="255" fill="#b91c1c" font-size="12" font-weight="800">B+ POSITIVE</text>

  <text x="170" y="282" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">VALID TILL</text>
  <text x="170" y="299" fill="#047857" font-size="12" font-weight="800">13-08-2034 (NON-TRANSPORT)</text>

  <text x="420" y="282" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">COV</text>
  <text x="420" y="299" fill="#0f172a" font-size="12" font-weight="800">MCWG, LMV</text>

  <!-- Watermark seal -->
  <circle cx="450" cy="150" r="45" fill="none" stroke="#0f766e" stroke-width="2" stroke-dasharray="4 2" opacity="0.4"/>
  <text x="450" y="148" fill="#0f766e" font-size="10" font-weight="800" text-anchor="middle" opacity="0.5">MVD GOA</text>
  <text x="450" y="162" fill="#0f766e" font-size="8" font-weight="700" text-anchor="middle" opacity="0.5">MARGAO RTO</text>
</svg>
`)}`;

export const SAMPLE_DL_BACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#f8fafc; font-family:system-ui, -apple-system, sans-serif;">
  <rect x="0" y="0" width="540" height="340" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  
  <rect x="0" y="0" width="540" height="40" rx="16" fill="#334155"/>
  <rect x="0" y="25" width="540" height="15" fill="#334155"/>
  <text x="270" y="25" fill="#ffffff" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="1.5">DRIVING LICENCE PARTICULARS & ADDRESS</text>

  <!-- Address Box -->
  <text x="30" y="65" fill="#64748b" font-size="10" font-weight="700" letter-spacing="1">PERMANENT RESIDENTIAL ADDRESS</text>
  <text x="30" y="85" fill="#0f172a" font-size="12" font-weight="600">Flat 402, Sunshine Enclave, 14th Road, Bandra West</text>
  <text x="30" y="103" fill="#0f172a" font-size="12" font-weight="600">Mumbai Suburban, Maharashtra - 400050</text>

  <!-- Classes of vehicles table -->
  <rect x="30" y="125" width="480" height="90" fill="#ffffff" stroke="#cbd5e1" rx="6"/>
  <line x1="30" y1="155" x2="510" y2="155" stroke="#cbd5e1"/>
  <line x1="150" y1="125" x2="150" y2="215" stroke="#cbd5e1"/>
  <line x1="320" y1="125" x2="320" y2="215" stroke="#cbd5e1"/>
  
  <text x="90" y="145" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">VEHICLE CLASS</text>
  <text x="235" y="145" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">DATE OF ISSUE</text>
  <text x="415" y="145" fill="#64748b" font-size="10" font-weight="700" text-anchor="middle">AUTHORISATION</text>

  <text x="90" y="178" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">MCWG (Motorcycle)</text>
  <text x="235" y="178" fill="#334155" font-size="11" font-weight="600" text-anchor="middle">14-08-2012</text>
  <text x="415" y="178" fill="#047857" font-size="11" font-weight="700" text-anchor="middle">APPROVED</text>

  <text x="90" y="202" fill="#0f172a" font-size="12" font-weight="800" text-anchor="middle">LMV (Light Motor Vehicle)</text>
  <text x="235" y="202" fill="#334155" font-size="11" font-weight="600" text-anchor="middle">20-03-2016</text>
  <text x="415" y="202" fill="#047857" font-size="11" font-weight="700" text-anchor="middle">APPROVED</text>

  <!-- Barcode Simulation -->
  <rect x="30" y="240" width="300" height="40" fill="#ffffff" stroke="#e2e8f0"/>
  <line x1="45" y1="245" x2="45" y2="275" stroke="#000" stroke-width="3"/>
  <line x1="52" y1="245" x2="52" y2="275" stroke="#000" stroke-width="1"/>
  <line x1="58" y1="245" x2="58" y2="275" stroke="#000" stroke-width="4"/>
  <line x1="68" y1="245" x2="68" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="76" y1="245" x2="76" y2="275" stroke="#000" stroke-width="1"/>
  <line x1="84" y1="245" x2="84" y2="275" stroke="#000" stroke-width="5"/>
  <line x1="96" y1="245" x2="96" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="106" y1="245" x2="106" y2="275" stroke="#000" stroke-width="3"/>
  <line x1="116" y1="245" x2="116" y2="275" stroke="#000" stroke-width="1"/>
  <line x1="126" y1="245" x2="126" y2="275" stroke="#000" stroke-width="4"/>
  <line x1="140" y1="245" x2="140" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="150" y1="245" x2="150" y2="275" stroke="#000" stroke-width="5"/>
  <line x1="165" y1="245" x2="165" y2="275" stroke="#000" stroke-width="1"/>
  <line x1="175" y1="245" x2="175" y2="275" stroke="#000" stroke-width="3"/>
  <line x1="190" y1="245" x2="190" y2="275" stroke="#000" stroke-width="4"/>
  <line x1="205" y1="245" x2="205" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="220" y1="245" x2="220" y2="275" stroke="#000" stroke-width="5"/>
  <line x1="238" y1="245" x2="238" y2="275" stroke="#000" stroke-width="1"/>
  <line x1="250" y1="245" x2="250" y2="275" stroke="#000" stroke-width="4"/>
  <line x1="265" y1="245" x2="265" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="280" y1="245" x2="280" y2="275" stroke="#000" stroke-width="3"/>
  <line x1="295" y1="245" x2="295" y2="275" stroke="#000" stroke-width="2"/>
  <line x1="310" y1="245" x2="310" y2="275" stroke="#000" stroke-width="4"/>

  <text x="30" y="305" fill="#64748b" font-size="10" font-weight="600">ISSUING AUTHORITY: LICENSING OFFICER, RTO MARGAO, GOA</text>
  <text x="440" y="305" fill="#94a3b8" font-size="10" font-weight="700">FORM 7</text>
</svg>
`)}`;

export const SAMPLE_AADHAAR_FRONT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="540" height="340" style="background:#ffffff; font-family:system-ui, -apple-system, sans-serif;">
  <rect x="0" y="0" width="540" height="340" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  
  <!-- Tricolor bar top -->
  <rect x="0" y="0" width="540" height="8" rx="16" fill="#ea580c"/>
  
  <!-- Header with emblem and title -->
  <rect x="0" y="8" width="540" height="58" fill="#f8fafc" border-bottom="1px solid #e2e8f0"/>
  <circle cx="45" cy="38" r="18" fill="#b45309" opacity="0.85"/>
  <text x="45" y="44" fill="#ffffff" font-size="16" font-weight="900" text-anchor="middle">🏛️</text>
  
  <text x="80" y="30" fill="#1e293b" font-size="13" font-weight="800">GOVERNMENT OF INDIA</text>
  <text x="80" y="48" fill="#b45309" font-size="11" font-weight="700">UNIQUE IDENTIFICATION AUTHORITY OF INDIA</text>

  <!-- Photo Box -->
  <rect x="35" y="88" width="115" height="145" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <circle cx="92" cy="140" r="30" fill="#94a3b8"/>
  <path d="M52 225 C52 185, 132 185, 132 225 Z" fill="#94a3b8"/>

  <!-- Info -->
  <text x="175" y="105" fill="#64748b" font-size="10" font-weight="700">NAME / नाम</text>
  <text x="175" y="125" fill="#0f172a" font-size="15" font-weight="900">RAHUL SHARMA</text>

  <text x="175" y="152" fill="#64748b" font-size="10" font-weight="700">DOB / जन्म तिथि</text>
  <text x="175" y="170" fill="#1e293b" font-size="13" font-weight="700">14/08/1994</text>

  <text x="175" y="196" fill="#64748b" font-size="10" font-weight="700">GENDER / लिंग</text>
  <text x="175" y="214" fill="#1e293b" font-size="13" font-weight="700">MALE / पुरुष</text>

  <!-- Aadhaar Number (Red highlighted, masked) -->
  <rect x="35" y="255" width="470" height="50" rx="8" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5"/>
  <text x="270" y="287" fill="#b91c1c" font-size="20" font-weight="900" letter-spacing="4" text-anchor="middle">XXXX  XXXX  4921</text>
  <text x="270" y="322" fill="#b45309" font-size="10" font-weight="800" text-anchor="middle" letter-spacing="1">मेरा आधार, मेरी पहचान</text>
</svg>
`)}`;
