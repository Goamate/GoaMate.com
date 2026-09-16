            <div id="official-invoice-print-container" className="bg-white font-sans text-slate-900 border border-slate-200">
              
              {/* Header section */}
              <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-8 py-6 border-b-[6px] border-emerald-700">
                {/* Logo & Brand Left */}
                <div className="flex items-center gap-4">
                  {/* Circle Logo Placeholder */}
                  <div className="w-20 h-20 rounded-full border-4 border-red-600 bg-white flex flex-col items-center justify-center shadow-sm shrink-0 p-1">
                    <div className="w-full h-full rounded-full border border-emerald-600 flex flex-col items-center justify-center bg-amber-50 relative overflow-hidden">
                      <div className="text-[7px] font-black tracking-widest text-emerald-800 -mt-1 uppercase rounded-t-full">GOA MATE</div>
                      <Car className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="text-[5px] font-bold text-slate-800 uppercase mt-0.5 whitespace-nowrap">Car & Bike Rental</div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-emerald-700 m-0 leading-none">GOA MATE</h1>
                    <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight leading-tight">CAR & BIKE RENTAL</h2>
                    <p className="text-sm font-semibold italic text-emerald-800 mt-1" style={{fontFamily: 'cursive'}}>Explore Goa Together</p>
                  </div>
                </div>

                {/* Slogan Middle */}
                <div className="hidden lg:flex flex-col items-center justify-center border-l-2 border-slate-200 px-6">
                   <div className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest">
                     <span>CARS</span> <span className="text-emerald-500">|</span> <span>BIKES</span> <span className="text-emerald-500">|</span> <span>GOOD VIBES</span>
                   </div>
                   <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                     <span>DRIVE</span> <span>&bull;</span> <span>EXPLORE</span> <span>&bull;</span> <span>BELONG</span>
                   </div>
                </div>

                {/* Contact Right */}
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-800 mt-4 sm:mt-0">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-700" /> +91 9403784132</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" /> +91 9403784132 (WhatsApp)</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-700" /> goamate.com@gmail.com</div>
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-700" /> www.goamate.com</div>
                  <div className="flex items-start gap-2 mt-1"><MapPin className="w-5 h-5 text-emerald-700 shrink-0" /> <span className="max-w-[150px]">Shop No. 5, Naik Waddo, Calangute, Bardez, Goa 403516, India</span></div>
                </div>
              </div>

              {/* Title Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-8 py-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">INTERNAL INVOICE SAMPLE</h2>
                  <p className="text-emerald-700 text-sm font-black tracking-[0.2em] uppercase mt-1">RENTALS FOR A BRIGHTER GOA</p>
                </div>
                <div className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-sm mt-3 sm:mt-0">
                  <FileText className="w-6 h-6" />
                  <span className="font-bold text-lg">{copyType === 'internal' ? 'Vendor / Admin Copy' : 'Customer Copy'}</span>
                </div>
              </div>

              {/* 4 Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 sm:px-8 pb-6">
                {/* Card 1 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-14">
                  <div className="bg-emerald-700 w-12 flex items-center justify-center text-white shrink-0"><FileText className="w-6 h-6" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Invoice No:</span>
                    <span className="text-sm font-black text-slate-900">{currentInvoice?.invoiceNumber || booking.referenceNumber}</span>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-14">
                  <div className="bg-emerald-700 w-12 flex items-center justify-center text-white shrink-0"><AlignLeft className="w-6 h-6" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Booking No:</span>
                    <span className="text-sm font-black text-slate-900">{currentInvoice?.bookingReference || booking.referenceNumber}</span>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-14">
                  <div className="bg-emerald-700 w-12 flex items-center justify-center text-white shrink-0"><Calendar className="w-6 h-6" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Invoice Date:</span>
                    <span className="text-sm font-black text-slate-900">
                      {new Date(currentInvoice?.invoiceDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="flex bg-emerald-50 border border-emerald-100 rounded-lg overflow-hidden h-14">
                  <div className="bg-emerald-700 w-12 flex items-center justify-center text-white shrink-0"><Clock className="w-6 h-6" /></div>
                  <div className="flex flex-col justify-center px-3">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Payment Status:</span>
                    <div className="mt-0.5">
                      {currentInvoice?.paymentStatus === 'paid' && <span className="bg-emerald-300 text-emerald-900 px-2 py-0.5 rounded font-bold text-[11px] uppercase">PAID IN FULL</span>}
                      {currentInvoice?.paymentStatus === 'partially_paid' && <span className="bg-orange-300 text-amber-950 px-2 py-0.5 rounded font-bold text-[11px] uppercase">Partially Paid</span>}
                      {currentInvoice?.paymentStatus === 'pending' && <span className="bg-rose-300 text-rose-950 px-2 py-0.5 rounded font-bold text-[11px] uppercase">Payment Pending</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Columns Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-8 pb-6">
                {/* Col 1 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <User className="w-5 h-5" /> CUSTOMER DETAILS
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Name:</span><span className="font-bold text-slate-900">{currentInvoice?.customerDetails?.name || booking.customerName}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Address:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.address || 'Not Provided'}</span></div>
                    <div className="grid grid-cols-[100px_1fr] mt-2"><span className="text-slate-600 font-semibold">Phone:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.phone || booking.customerPhone}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Email:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.email || booking.customerEmail || 'Not Provided'}</span></div>
                    <div className="grid grid-cols-[100px_1fr] items-center"><span className="text-slate-600 font-semibold">WhatsApp:</span><span className="font-semibold text-slate-800 flex items-center gap-1"><span className="w-4 h-4 bg-emerald-500 rounded-full text-white flex items-center justify-center"><Phone className="w-2.5 h-2.5" /></span> {currentInvoice?.customerDetails?.phone || booking.customerPhone}</span></div>
                    <div className="grid grid-cols-[125px_1fr] pt-2"><span className="text-slate-600 font-semibold">Driving Licence No:</span><span className="font-semibold text-slate-800">{currentInvoice?.customerDetails?.drivingLicenceNumber || 'Verified in Person'}</span></div>
                  </div>
                </div>

                {/* Col 2 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <Bike className="w-5 h-5" /> VEHICLE DETAILS
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vehicle Type:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.type || booking.vehicleCategory}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vehicle Name:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name || booking.vehicleName}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Brand:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name?.split(' ')[0] || '-'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Model:</span><span className="font-semibold text-slate-800">{currentInvoice?.vehicleDetails?.name?.split(' ').slice(1).join(' ') || '-'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Registration No:</span><span className="font-semibold text-slate-800 uppercase">{currentInvoice?.vehicleDetails?.registrationNumber || 'Pending'}</span></div>
                    <div className="grid grid-cols-[100px_1fr]"><span className="text-slate-600 font-semibold">Vendor:</span><span className="font-semibold text-slate-800">{booking.vendorName || '-'}</span></div>
                  </div>
                </div>

                {/* Col 3 */}
                <div className="border border-emerald-700 bg-emerald-50/50 rounded-t-lg overflow-hidden flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <Calendar className="w-5 h-5" /> RENTAL INFORMATION
                  </div>
                  <div className="p-4 text-xs flex-1 space-y-2">
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Pickup Location:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.pickupLocation || booking.pickupLocation}</span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Drop-off Location:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.dropoffLocation || booking.dropoffLocation}</span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Pickup Date & Time:</span><span className="font-semibold text-slate-800">
                      {new Date(currentInvoice?.rentalDetails?.pickupDatetime || booking.pickupDatetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).toUpperCase()}
                    </span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Return Date & Time:</span><span className="font-semibold text-slate-800">
                      {new Date(currentInvoice?.rentalDetails?.returnDatetime || booking.returnDatetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).toUpperCase()}
                    </span></div>
                    <div className="grid grid-cols-[125px_1fr]"><span className="text-slate-600 font-semibold">Total Duration:</span><span className="font-semibold text-slate-800">{currentInvoice?.rentalDetails?.totalDurationDays || booking.totalDays} Days</span></div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="px-4 sm:px-8 pb-6">
                <table className="w-full text-left text-sm border-collapse border border-emerald-700">
                  <thead className="bg-emerald-700 text-white font-bold">
                    <tr>
                      <th className="py-2 px-3 border border-emerald-700 w-12 text-center">#</th>
                      <th className="py-2 px-3 border border-emerald-700">Description</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-28">Qty/Days</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-32">Rate (₹)</th>
                      <th className="py-2 px-3 border border-emerald-700 text-center w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice?.items?.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-medium text-slate-700">{i + 1}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 font-semibold text-slate-800">{item.description}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">{item.quantityOrDays} {item.description.includes('Rental') ? 'Days' : ''}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">{Number(item.rate).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">{Number(item.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {/* Fill empty rows if items < 4 */}
                    {Array.from({ length: Math.max(0, 4 - (currentInvoice?.items?.length || 0)) }).map((_, i) => (
                      <tr key={`empty-${i}`} className={(currentInvoice?.items?.length || 0 + i) % 2 !== 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-medium text-slate-700">{(currentInvoice?.items?.length || 0) + i + 1}</td>
                        <td className="py-2 px-3 border-r border-emerald-200 font-semibold text-slate-800">-</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">-</td>
                        <td className="py-2 px-3 border-r border-emerald-200 text-center font-semibold text-slate-700">-</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Notes & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6 px-4 sm:px-8 pb-6">
                {/* Notes */}
                <div className="bg-emerald-50/50 rounded-t-lg overflow-hidden border border-emerald-700 flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <AlignLeft className="w-5 h-5" /> Notes / Terms
                  </div>
                  <div className="p-4 text-xs font-semibold text-slate-800 leading-relaxed flex-1">
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>Customer provided valid driving licence and ID proof at the time of booking.</li>
                      {copyType === 'internal' && <li>Copy of customer documents are attached below.</li>}
                      <li>This is an {copyType === 'internal' ? 'internal' : 'official'} invoice for {copyType === 'internal' ? 'vendor/admin use only' : 'customer record'}.</li>
                      <li>All information is for operational purposes. Not a legal document.</li>
                    </ol>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-emerald-50/50 rounded-t-lg overflow-hidden border border-emerald-700 flex flex-col h-full">
                  <div className="bg-emerald-700 text-white px-3 py-2 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                    <AlignLeft className="w-5 h-5" /> INVOICE SUMMARY
                  </div>
                  <div className="p-4 text-sm font-semibold text-slate-800 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between py-1 border-b border-emerald-200">
                      <span>Subtotal</span>
                      <span className="font-bold">₹ {(currentInvoice?.subtotalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-red-600">
                      <span>Discount</span>
                      <span className="font-bold">- ₹ {(currentInvoice?.discountAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200">
                      <span>GST ({currentInvoice?.taxRatePercent || 0}%)</span>
                      <span className="font-bold">₹ {(currentInvoice?.taxAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-200/50 px-2 my-1 rounded border border-emerald-300">
                      <span className="font-bold text-slate-900">Total Amount</span>
                      <span className="font-bold text-emerald-800 text-base">₹ {(currentInvoice?.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-emerald-700">
                      <span>Amount Paid</span>
                      <span className="font-bold">₹ {(currentInvoice?.amountPaid || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-emerald-200 text-red-600">
                      <span className="font-bold">Balance Due</span>
                      <span className="font-bold">₹ {(currentInvoice?.amountDue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 mt-1">
                      <div>
                        <div className="font-bold">Refundable Security Deposit</div>
                        <div className="text-[10px] font-normal text-slate-500">(Not included in total)</div>
                      </div>
                      <span className="font-bold text-slate-800 mt-0.5">₹ {(currentInvoice?.securityDeposit || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Section (Only if Internal Copy) */}
              {copyType === 'internal' && (
                <div className="px-4 sm:px-8 pb-6">
                  <div className="border-t-[3px] border-emerald-700 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <div className="bg-emerald-700 text-white rounded-full p-1"><CheckSquare className="w-5 h-5" /></div>
                        <h3 className="text-lg font-black uppercase tracking-tight">CUSTOMER ID DETAILS WITH PHOTO &ndash; SAMPLE / CONFIDENTIAL</h3>
                      </div>
                      <div className="bg-red-50 text-red-700 border border-red-200 p-2 text-center text-[10px] font-bold rounded-lg w-full sm:w-72">
                        Confidential customer identification documents. Authorized business use only. Do not distribute publicly.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {booking.documents && booking.documents.length > 0 ? (
                         booking.documents.map((doc, idx) => (
                            <div key={idx} className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                              <div className="bg-emerald-100 text-emerald-900 text-center py-1.5 text-xs font-bold uppercase border-b border-emerald-200">
                                {doc.docType.replace(/_/g, ' ')} {doc.idProofType ? `(${doc.idProofType})` : ''}
                              </div>
                              <div className="p-3 flex items-center justify-center min-h-[160px] relative">
                                {doc.previewUrl ? (
                                  <img src={doc.previewUrl} alt="KYC Doc" className="w-full h-auto object-contain rounded" />
                                ) : (
                                  <span className="text-xs text-slate-400">Image unavailable</span>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                  <div className="text-4xl font-black text-red-500 -rotate-12 border-4 border-red-500 px-4 py-1 rounded-lg uppercase">SAMPLE</div>
                                </div>
                              </div>
                            </div>
                         ))
                      ) : (
                        <div className="col-span-1 sm:col-span-3 text-center py-8 text-slate-500 font-semibold border-2 border-dashed border-slate-300 rounded-xl">
                          No ID documents uploaded for this booking.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-[6px] border-emerald-700 px-4 sm:px-8 py-6 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                   <Sparkles className="w-10 h-10 text-emerald-600" />
                   <div>
                     <h4 className="text-3xl font-black text-emerald-700 italic leading-none">Goa</h4>
                     <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest mt-0.5">More Than a Destination</p>
                   </div>
                 </div>
                 
                 <div className="text-center">
                   <h3 className="text-2xl font-black text-emerald-700 italic">Thank you for choosing GoaMate</h3>
                   <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-800 uppercase tracking-widest mt-1">
                     <Car className="w-4 h-4 text-emerald-600" /> <span>Rent</span> <span className="text-slate-300">|</span> <span>Drive</span> <span className="text-slate-300">|</span> <span>Explore</span> <span className="text-slate-300">|</span> <span>Create Memories</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-end gap-3 text-right">
                   <div>
                     <h4 className="text-2xl font-black text-emerald-700 italic leading-none">Good Rides</h4>
                     <p className="text-xs font-bold text-emerald-900 italic mt-0.5">Happier Stories</p>
                   </div>
                   <Sparkles className="w-10 h-10 text-emerald-600" />
                 </div>
              </div>

            </div>
